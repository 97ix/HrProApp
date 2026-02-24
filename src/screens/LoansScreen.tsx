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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HandCoins, ArrowRight, User, Calendar, X, Check, ChevronDown, CheckCircle, XCircle } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Loan, Employee } from '../types';

const LoansScreen = ({ navigation, user }: { navigation?: any, user?: any }) => {
    const insets = useSafeAreaInsets();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);
    const [isUserPickerVisible, setIsUserPickerVisible] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [actionMonths, setActionMonths] = useState('10');
    const [isProcessing, setIsProcessing] = useState(false);

    const [newLoan, setNewLoan] = useState({
        userId: '',
        userName: 'اختر الموظف',
        amount: '',
        installments: '10',
        reason: '',
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
    }, [user?.id]);

    const fetchData = async () => {
        try {
            const userIsAdmin = Boolean(
                user?.role === 'HR' || user?.role === 'MANAGER' ||
                user?.role === 'DEPT_MGR' || user?.role === 'DEPARTMENT_MANAGER'
            );
            // الموظفون يرون قروضهم فقط، المدراء يرون الكل
            const endpoint = userIsAdmin || !user?.id ? '/api/loans' : `/api/loans/employee/${user?.id}`;
            const [loanRes, empRes] = await Promise.all([
                api.get(endpoint),
                api.get('/api/employees')
            ]);
            setLoans(loanRes.data || []);
            setEmployees(empRes.data || []);
        } catch (error) {
            console.warn('Loans fetch error:', error);
            setLoans([]);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedLoan || isProcessing) return;

        const months = Number(actionMonths);
        if (status === 'APPROVED' && (!months || months <= 0)) {
            Alert.alert('خطأ', 'يرجى تحديد عدد أشهر صالح');
            return;
        }

        const updates = {
            status: status,
            installmentsCount: status === 'APPROVED' ? months : selectedLoan.installmentsCount,
            installmentAmount: status === 'APPROVED' ? Math.round(selectedLoan.totalAmount / months) : selectedLoan.installmentAmount
        };

        setIsProcessing(true);
        try {
            await api.put(`/api/loans/${selectedLoan.id}`, updates);
            setLoans(loans.map(l => l.id === selectedLoan.id ? { ...l, ...updates } : l));
            setIsActionModalVisible(false);
            setSelectedLoan(null);
            Alert.alert(status === 'APPROVED' ? 'تمت الموافقة وتوزيع الأقساط' : 'تم الرفض');
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحديث حالة السلفة في السيرفر');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveLoan = async () => {
        if (!newLoan.userId || !newLoan.amount) {
            Alert.alert('خطأ', 'يرجى ملء البيانات الأساسية');
            return;
        }
        const loanToAdd: any = {
            id: Math.random().toString(),
            employeeId: newLoan.userId,
            totalAmount: Number(newLoan.amount),
            installmentsCount: Number(newLoan.installments),
            installmentAmount: Math.round(Number(newLoan.amount) / Number(newLoan.installments)),
            status: 'APPROVED',
            reason: newLoan.reason,
            createdAt: new Date().toISOString().split('T')[0],
        };

        try {
            await api.post('/api/loans', loanToAdd);
            setLoans([loanToAdd, ...loans]);
            setIsAddModalVisible(false);
            setNewLoan({ userId: '', userName: 'اختر الموظف', amount: '', installments: '10', reason: '' });
            Alert.alert('نجاح', 'تم تسجيل السلفة بنجاح');
        } catch (error) {
            Alert.alert('خطأ', 'فشل حفظ السلفة في السيرفر');
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
                <Text style={styles.title}>السلف والقروض</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
                    <HandCoins size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} animating /></View>
            ) : (
                <FlatList
                    data={loans}
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
                                        {item.status === 'APPROVED' ? 'مقبولة' : item.status === 'REJECTED' ? 'مرفوضة' : 'انتظار'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>المبلغ الكلي</Text>
                                    <Text style={styles.detailValue}>{item.totalAmount.toLocaleString()} د.ع</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>عدد الأشهر</Text>
                                    <Text style={styles.detailValue}>{item.installmentsCount} شهر</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>القسط الشهري</Text>
                                    <Text style={styles.detailValue}>{item.installmentAmount.toLocaleString()} د.ع</Text>
                                </View>
                            </View>

                            {item.status === 'PENDING' && (
                                <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedLoan(item); setIsActionModalVisible(true); }}>
                                    <CheckCircle size={18} color={COLORS.primary} />
                                    <Text style={styles.actionBtnText}>اتخاذ إجراء</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                            <HandCoins size={48} color={COLORS.textMuted} />
                            <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 16 }}>لا توجد سلف أو قروض حالياً</Text>
                        </View>
                    }
                />
            )}

            {/* Action Modal */}
            <Modal visible={isActionModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>قرار السلفة</Text>
                        <Text style={styles.modalSub}>{getEmployeeName(selectedLoan?.employeeId || '')}</Text>

                        <View style={{ marginTop: 20 }}>
                            <Text style={styles.inputLabel}>تحديد عدد أشهر التقسيط</Text>
                            <TextInput
                                style={styles.modalInput}
                                keyboardType="numeric"
                                value={actionMonths}
                                onChangeText={setActionMonths}
                                textAlign="right"
                                placeholder="مثلاً: 12"
                            />

                            {Number(actionMonths) > 0 && selectedLoan && (
                                <View style={styles.calcPreview}>
                                    <Text style={styles.calcPreviewText}>
                                        القسط الشهري: {Math.round(selectedLoan.totalAmount / Number(actionMonths)).toLocaleString()} د.ع
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={{ gap: 10, marginTop: 10 }}>
                            <TouchableOpacity
                                style={[styles.footerBtn, { backgroundColor: COLORS.secondary, opacity: isProcessing ? 0.7 : 1 }]}
                                onPress={() => handleAction('APPROVED')}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <ActivityIndicator color="#fff" /> : <CheckCircle size={20} color="#fff" />}
                                <Text style={styles.footerBtnText}>موافقة على السلفة</Text>
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
                        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setIsActionModalVisible(false)}>
                            <Text style={{ textAlign: 'center', color: COLORS.textMuted }}>إغلاق</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Manual Loan Modal */}
            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <X size={24} color={COLORS.text} onPress={() => setIsAddModalVisible(false)} />
                            <Text style={styles.modalTitle}>تسجيل سلفة يدوية</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <Text style={styles.inputLabel}>الموظف</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsUserPickerVisible(true)}>
                            <Text style={styles.pickerText}>{newLoan.userName}</Text>
                            <ChevronDown size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.inputLabel}>المبلغ</Text>
                                <TextInput style={styles.modalInput} keyboardType="numeric" value={newLoan.amount} onChangeText={t => setNewLoan({ ...newLoan, amount: t })} textAlign="right" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>الأقساط (شهر)</Text>
                                <TextInput style={styles.modalInput} keyboardType="numeric" value={newLoan.installments} onChangeText={t => setNewLoan({ ...newLoan, installments: t })} textAlign="right" />
                            </View>
                        </View>

                        <Text style={styles.inputLabel}>السبب</Text>
                        <TextInput style={styles.modalInput} value={newLoan.reason} onChangeText={t => setNewLoan({ ...newLoan, reason: t })} textAlign="right" />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLoan}>
                            <Check size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>حفظ السلفة</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* User Picker Internal */}
                <Modal visible={isUserPickerVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerContent}>
                            <FlatList
                                data={employees}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.pickerOption} onPress={() => { setNewLoan({ ...newLoan, userId: item.id, userName: item.name }); setIsUserPickerVisible(false); }}>
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
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
    backButton: { padding: SPACING.xs },
    title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    list: { padding: SPACING.lg, paddingBottom: 40 },
    card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    userInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    userName: { color: COLORS.text, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    detailGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 15 },
    detailItem: { alignItems: 'center' },
    detailLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
    detailValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.text },
    actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15, paddingVertical: 10, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.primary },
    actionBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    modalContent: { backgroundColor: COLORS.surface, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    modalSub: { textAlign: 'center', color: COLORS.primary, marginTop: 5 },
    inputLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 6, textAlign: 'right' },
    modalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    row: { flexDirection: 'row-reverse' },
    pickerTrigger: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    pickerText: { color: COLORS.text },
    saveBtn: { backgroundColor: COLORS.primary, flexDirection: 'row-reverse', height: 50, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    pickerContent: { backgroundColor: COLORS.surface, margin: 40, borderRadius: BORDER_RADIUS.lg, maxHeight: '60%' },
    pickerOption: { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerOptionText: { textAlign: 'center', color: COLORS.text, fontSize: 16 },
    footerBtn: { flexDirection: 'row-reverse', height: 55, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10 },
    footerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    calcPreview: { backgroundColor: COLORS.secondary + '10', padding: 10, borderRadius: 8, marginBottom: 15, alignItems: 'center' },
    calcPreviewText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 13 },
});

export default LoansScreen;
