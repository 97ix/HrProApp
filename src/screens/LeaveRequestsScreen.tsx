import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, CheckCircle, XCircle, User, ArrowRight, Plus, ChevronDown, Check, RotateCcw } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { LeaveRequest, Employee } from '../types';

const LeaveRequestsScreen = ({ user, navigation }: { user?: any, navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);
    const [isUserPickerVisible, setIsUserPickerVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [newLeave, setNewLeave] = useState({
        userId: '',
        userName: 'اختر الموظف',
        type: 'ANNUAL' as any,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        deductionType: 'HOURLY',
        count: '0',
        amount: '0',
    });

    const [actionForm, setActionForm] = useState({
        amount: '0',
    });

    useEffect(() => {
        fetchData();
        const socket = getSocket();
        if (socket) {
            socket.on('data-update', () => fetchData());
            return () => {
                socket.off('data-update');
            };
        }
    }, []);

    const isAdmin = Boolean(user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'DEPT_MGR');

    const fetchData = async () => {
        try {
            const endpoint = isAdmin ? '/api/leaves' : `/api/leaves/employee/${user?.id}`;
            const [leaveRes, empRes] = await Promise.all([
                api.get(endpoint),
                api.get('/api/employees')
            ]);
            setRequests(leaveRes.data || []);
            setEmployees(empRes.data || []);
        } catch (error) {
            setRequests([
                { id: '1', employeeId: 'emp_1', type: 'ANNUAL', startDate: '2026-02-25', endDate: '2026-02-28', status: 'PENDING', reason: 'إجازة عائلية' },
                { id: '2', employeeId: 'emp_2', type: 'SICK', startDate: '2026-02-23', endDate: '2026-02-24', status: 'APPROVED', reason: 'مرضية' },
            ] as any);
            setEmployees([{ id: 'emp_1', name: 'أحمد علي' }, { id: 'emp_2', name: 'سارة محمود' }] as any);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedRequest || isProcessing) return;
        setIsProcessing(true);
        try {
            await api.put(`/api/leaves/${selectedRequest.id}`, { status });
            setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, status: status } : r));
            setIsActionModalVisible(false);
            setSelectedRequest(null);
            Alert.alert(status === 'APPROVED' ? 'تمت الموافقة' : 'تم الرفض');
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحديث حالة الطلب في السيرفر');
        } finally {
            setIsProcessing(false);
        }
    };

    const calculateDeduction = (countValue: string, type: string, userId: string = newLeave.userId) => {
        const emp = employees.find(e => e.id === userId);
        if (!emp || !emp.salary) {
            setNewLeave(prev => ({ ...prev, count: countValue, deductionType: type }));
            return;
        }

        const count = Number(countValue) || 0;
        const hourlyRate = (emp.salary / 30) / (emp.workingHours || 8);
        const dailyRate = (emp.salary / 30);

        let amount = 0;
        if (type === 'HOURLY') {
            amount = Math.round(hourlyRate * count);
        } else {
            amount = Math.round(dailyRate * count);
        }

        setNewLeave(prev => ({ ...prev, count: countValue, deductionType: type, amount: amount.toString() }));
    };

    const handleUndo = (id: string) => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'PENDING' } : r));
        Alert.alert('تم التراجع', 'تم إعادة الطلب لحالة الانتظار');
    };

    const handleAddLeave = async () => {
        if (!newLeave.userId || !newLeave.reason) {
            Alert.alert('خطأ', 'يرجى ملء كافة البيانات');
            return;
        }
        const req: LeaveRequest = {
            id: Math.random().toString(),
            employeeId: newLeave.userId,
            type: newLeave.type,
            startDate: newLeave.startDate,
            endDate: newLeave.endDate,
            status: 'APPROVED',
            reason: newLeave.reason,
        };

        try {
            await api.post('/api/leaves', req);
            setRequests([req, ...requests]);
            setIsAddModalVisible(false);

            if (Number(newLeave.amount) > 0) {
                Alert.alert('نجاح', `تم تسجيل الإجازة مع خصم ${Number(newLeave.amount).toLocaleString()} د.ع`);
            } else {
                Alert.alert('نجاح', 'تم تسجيل الإجازة بنجاح');
            }

            setNewLeave({
                userId: '',
                userName: 'اختر الموظف',
                type: 'ANNUAL' as any,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                reason: '',
                deductionType: 'HOURLY',
                count: '0',
                amount: '0',
            });
        } catch (error) {
            Alert.alert('خطأ', 'فشل حفظ طلب الإجازة في السيرفر');
        }
    };

    const getEmployeeName = (id: string) => {
        if (!employees || !Array.isArray(employees)) return 'غير معروف';
        return employees.find(e => e.id === id)?.name || 'غير معروف';
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>طلبات الإجازات</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.userInfo}>
                                    <User size={16} color={COLORS.primary} />
                                    <Text style={styles.userName}>{getEmployeeName(item.employeeId)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: item.status === 'APPROVED' ? COLORS.secondary + '20' : item.status === 'REJECTED' ? COLORS.danger + '20' : COLORS.accent + '20' }]}>
                                    <Text style={[styles.statusText, { color: item.status === 'APPROVED' ? COLORS.secondary : item.status === 'REJECTED' ? COLORS.danger : COLORS.accent }]}>
                                        {item.status === 'APPROVED' ? 'مقبولة' : item.status === 'REJECTED' ? 'مرفوضة' : 'بالانتظار'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.reasonText}>{item.reason}</Text>

                            <View style={styles.dateRow}>
                                <Calendar size={14} color={COLORS.textMuted} />
                                <Text style={styles.dateText}>من {item.startDate} إلى {item.endDate}</Text>
                            </View>

                            <View style={styles.cardActions}>
                                {item.status === 'PENDING' ? (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedRequest(item); setIsActionModalVisible(true); }}>
                                        <CheckCircle size={18} color={COLORS.primary} />
                                        <Text style={styles.actionBtnText}>اتخاذ إجراء</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.textMuted }]} onPress={() => handleUndo(item.id)}>
                                        <RotateCcw size={18} color={COLORS.textMuted} />
                                        <Text style={[styles.actionBtnText, { color: COLORS.textMuted }]}>تراجع</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                            <Calendar size={48} color={COLORS.textMuted} />
                            <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 16 }}>لا توجد طلبات إجازة حالياً</Text>
                        </View>
                    }
                />
            )}

            {/* Action Modal */}
            <Modal visible={isActionModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>الإجراء المطلوب</Text>
                        <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 20 }]}>للموظف: {getEmployeeName(selectedRequest?.employeeId || '')}</Text>

                        <Text style={styles.inputLabel}>المبلغ المستقطع (اختياري)</Text>
                        <TextInput style={styles.modalInput} keyboardType="numeric" value={actionForm.amount} onChangeText={t => setActionForm({ ...actionForm, amount: t })} textAlign="right" />

                        <View style={{ gap: 10, marginTop: 10 }}>
                            <TouchableOpacity
                                style={[styles.footerBtn, { backgroundColor: COLORS.secondary, opacity: isProcessing ? 0.7 : 1 }]}
                                onPress={() => handleAction('APPROVED')}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <ActivityIndicator color="#fff" /> : <CheckCircle size={20} color="#fff" />}
                                <Text style={styles.footerBtnText}>موافقة على الإجازة</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.footerBtn, { backgroundColor: COLORS.danger, opacity: isProcessing ? 0.7 : 1 }]}
                                onPress={() => handleAction('REJECTED')}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <ActivityIndicator color="#fff" /> : <XCircle size={20} color="#fff" />}
                                <Text style={styles.footerBtnText}>رفض الطلب</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setIsActionModalVisible(false)}>
                            <Text style={{ textAlign: 'center', color: COLORS.textMuted }}>إلغاء</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Manual Leave Modal */}
            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <XCircle size={24} color={COLORS.text} onPress={() => setIsAddModalVisible(false)} />
                            <Text style={styles.modalTitle}>إجازة يدوية جديدة</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <Text style={styles.inputLabel}>الموظف</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsUserPickerVisible(true)}>
                            <Text style={styles.pickerText}>{newLeave.userName}</Text>
                            <ChevronDown size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>السبب</Text>
                        <TextInput style={styles.modalInput} value={newLeave.reason} onChangeText={t => setNewLeave({ ...newLeave, reason: t })} textAlign="right" />

                        <Text style={styles.inputLabel}>نوع الخصم</Text>
                        <View style={styles.tabRow}>
                            <TouchableOpacity
                                style={[styles.miniTab, newLeave.deductionType === 'HOURLY' && styles.miniTabActive]}
                                onPress={() => calculateDeduction(newLeave.count, 'HOURLY')}
                            >
                                <Text style={[styles.miniTabText, newLeave.deductionType === 'HOURLY' && styles.miniTabTextActive]}>بالساعة</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.miniTab, newLeave.deductionType === 'DAILY' && styles.miniTabActive]}
                                onPress={() => calculateDeduction(newLeave.count, 'DAILY')}
                            >
                                <Text style={[styles.miniTabText, newLeave.deductionType === 'DAILY' && styles.miniTabTextActive]}>باليوم</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>العدد ({newLeave.deductionType === 'HOURLY' ? 'ساعات' : 'أيام'})</Text>
                        <TextInput
                            style={styles.modalInput}
                            keyboardType="numeric"
                            value={newLeave.count}
                            onChangeText={t => calculateDeduction(t, newLeave.deductionType)}
                            textAlign="right"
                        />

                        <View style={styles.calcResultBox}>
                            <Text style={styles.calcResultLabel}>إجمالي المبلغ المخصوم</Text>
                            <Text style={styles.calcResultValue}>{Number(newLeave.amount).toLocaleString()} د.ع</Text>
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleAddLeave}>
                            <Check size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>تسجيل الإجازة</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* User Picker Internal */}
                <Modal visible={isUserPickerVisible} animationType="fade" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerContent}>
                            <FlatList
                                data={employees}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.pickerOption} onPress={() => {
                                        setNewLeave({ ...newLeave, userId: item.id, userName: item.name });
                                        calculateDeduction(newLeave.count, newLeave.deductionType, item.id);
                                        setIsUserPickerVisible(false);
                                    }}>
                                        <Text style={styles.pickerOptionText}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
    backButton: { padding: SPACING.xs },
    title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
    card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    userInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    userName: { color: COLORS.text, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    reasonText: { color: COLORS.text, fontSize: 14, textAlign: 'right', marginBottom: 10 },
    dateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 15 },
    dateText: { color: COLORS.textMuted, fontSize: 12 },
    cardActions: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.primary },
    actionBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    modalContent: { backgroundColor: COLORS.surface, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
    inputLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'right' },
    modalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    modalFooterActions: { flexDirection: 'row', gap: 10 },
    footerBtn: { flex: 1, flexDirection: 'row-reverse', height: 50, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 8 },
    footerBtnText: { color: '#fff', fontWeight: 'bold' },
    pickerTrigger: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    pickerText: { color: COLORS.text },
    saveBtn: { backgroundColor: COLORS.primary, flexDirection: 'row-reverse', height: 50, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    pickerContent: { backgroundColor: COLORS.surface, margin: 40, borderRadius: BORDER_RADIUS.lg, maxHeight: '60%' },
    pickerOption: { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerOptionText: { textAlign: 'center', color: COLORS.text, fontSize: 16 },
    tabRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 15 },
    miniTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
    miniTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    miniTabText: { fontSize: 12, color: COLORS.textMuted, fontWeight: 'bold' },
    miniTabTextActive: { color: '#fff' },
    calcResultBox: { backgroundColor: COLORS.danger + '10', padding: 15, borderRadius: 10, marginBottom: 20, alignItems: 'center' },
    calcResultLabel: { fontSize: 11, color: COLORS.danger, fontWeight: 'bold', marginBottom: 5 },
    calcResultValue: { fontSize: 20, color: COLORS.danger, fontWeight: 'bold' },
});

export default LeaveRequestsScreen;
