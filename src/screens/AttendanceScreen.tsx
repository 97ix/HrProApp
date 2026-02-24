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
import { Clock, CheckCircle, XCircle, User, ArrowRight, Plus, Search, ChevronDown, Check, Trash2, RotateCcw, LogOut } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Attendance, Employee } from '../types';

const AttendanceScreen = ({ user, navigation }: { user?: any, navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    // Manual Entry States
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isUserPickerVisible, setIsUserPickerVisible] = useState(false);
    const [manualEntry, setManualEntry] = useState({
        userId: '',
        userName: 'اختر الموظف',
        checkIn: '',
        checkOut: '',
        date: new Date().toISOString().split('T')[0],
    });

    const isAdmin = Boolean(user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'DEPT_MGR');

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

    const fetchData = async () => {
        try {
            const [attRes, empRes] = await Promise.all([
                api.get(isAdmin ? '/api/attendance/today' : `/api/attendance/employee/${user.id}`),
                api.get('/api/employees')
            ]);
            setAttendance(attRes.data || []);
            setEmployees(empRes.data || []);

            if (!isAdmin) {
                const today = new Date().toISOString().split('T')[0];
                setIsCheckedIn((attRes.data || []).some((r: any) => r.date === today && !r.checkOut));
            }
        } catch (error) {
            setAttendance([{ id: '1', employeeId: 'emp_1', date: '2026-02-23', checkIn: '08:15', checkOut: '16:30', totalHours: 8.25 }] as any);
            setEmployees([{ id: 'emp_1', name: 'أحمد علي' }, { id: 'emp_2', name: 'سارة محمود' }] as any);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!manualEntry.userId) {
            Alert.alert('خطأ', 'يرجى اختيار الموظف أولاً');
            return;
        }

        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        // إذا كان حقل الدخول فارغاً، نأخذ الوقت الحالي
        const finalCheckIn = manualEntry.checkIn || currentTime;

        // إذا كان حقل الخروج فارغاً، لا نعطيه قيمة (إلا إذا أردت أن يكون في نفس اللحظة)
        // بناء على طلبك: تحديد الدخول والخروج ليس إجباري.
        const finalCheckOut = manualEntry.checkOut || undefined;

        let totalHours = 0;
        if (finalCheckOut) {
            const [h1, m1] = finalCheckIn.split(':').map(Number);
            const [h2, m2] = finalCheckOut.split(':').map(Number);
            totalHours = parseFloat(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60).toFixed(2));
            if (totalHours < 0) totalHours = 0; // حماية من الإدخال العكسي
        }

        const newRec = {
            id: Math.random().toString(),
            employeeId: manualEntry.userId,
            date: manualEntry.date,
            checkIn: finalCheckIn,
            checkOut: finalCheckOut,
            totalHours,
        };

        try {
            await api.post('/api/attendance', newRec);
            setAttendance([newRec, ...attendance]);
            setIsModalVisible(false);
            setManualEntry({ userId: '', userName: 'اختر الموظف', checkIn: '', checkOut: '', date: new Date().toISOString().split('T')[0] });
            Alert.alert('نجاح', 'تم تسجيل الحضور يدوياً');
        } catch (error) {
            Alert.alert('خطأ', 'فشل حفظ السجل في السيرفر');
        }
    };

    const handleCheckIn = async (employeeId: string) => {
        const now = new Date();
        const checkInTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const today = now.toISOString().split('T')[0];

        const newRec = {
            employeeId,
            date: today,
            checkIn: checkInTime,
        };

        try {
            await api.post('/api/attendance', newRec);
            fetchData();
            Alert.alert('تم تجسل الحضور', `تم تسجيل حضور الموظف الساعة ${checkInTime}`);
        } catch (error) {
            Alert.alert('خطأ', 'فشل الاتصال بالسيرفر');
        }
    };

    const handleCheckOut = async (recordId: string) => {
        const now = new Date();
        const checkOutTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        try {
            // Find current record to calculate hours
            const record = attendance.find(r => r.id === recordId);
            let totalHours = 8;
            if (record && record.checkIn) {
                const [h1, m1] = record.checkIn.split(':').map(Number);
                const [h2, m2] = checkOutTime.split(':').map(Number);
                totalHours = parseFloat(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60).toFixed(2));
            }

            await api.put(`/api/attendance/${recordId}`, { checkOut: checkOutTime, totalHours });
            fetchData();
            Alert.alert('تم تسجيل الانصراف', `تم تسجيل انصراف الموظف الساعة ${checkOutTime}`);
        } catch (error) {
            Alert.alert('خطأ', 'فشل الاتصال بالسيرفر');
        }
    };

    const handleUndo = async (employeeId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const record = attendance.find(r => r.employeeId === employeeId && r.date === today);

        if (!record) return;

        Alert.alert(
            'تراجع',
            'هل أنت متأكد من التراجع عن آخر حركة (حضور/انصراف) لهذا اليوم؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'تأكيد',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (record.checkOut) {
                                // Just remove checkout
                                await api.put(`/api/attendance/${record.id}`, { checkOut: null, totalHours: 0 });
                            } else {
                                // Delete the record entirely
                                await api.delete(`/api/attendance/${record.id}`);
                            }
                            fetchData();
                        } catch (e) {
                            Alert.alert('خطأ', 'فشل التراجع');
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = async (id: string) => {
        Alert.alert('حذف السجل', 'هل أنت متأكد من حذف هذا السجل نهائياً؟', [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'حذف',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/api/attendance/${id}`);
                        fetchData();
                    } catch (e) { Alert.alert('خطأ', 'فشل الحذف'); }
                }
            }
        ]);
    };

    const getEmployeeName = (id: string) => {
        if (!employees || !Array.isArray(employees)) return 'غير معروف';
        return employees.find(e => e.id === id)?.name || 'غير معروف';
    };

    const renderEmployeeAttendance = ({ item: employee }: { item: Employee }) => {
        const today = new Date().toISOString().split('T')[0];
        const record = (attendance || []).find(r => r.employeeId === employee.id && r.date === today);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerRight}>
                        <User size={18} color={COLORS.primary} />
                        <Text style={styles.employeeName}>{employee.name}</Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: record ? (record.checkOut ? COLORS.secondary + '20' : COLORS.primary + '20') : COLORS.danger + '20' }]}>
                        <Text style={[styles.statusTagText, { color: record ? (record.checkOut ? COLORS.secondary : COLORS.primary) : COLORS.danger }]}>
                            {record ? (record.checkOut ? 'مكتمل' : 'حاضر') : 'غائب'}
                        </Text>
                    </View>
                </View>

                {record ? (
                    <View style={styles.timeRow}>
                        <View style={styles.timeBox}><Text style={styles.timeLabel}>دخول</Text><Text style={styles.timeValue}>{record.checkIn}</Text></View>
                        <View style={styles.timeDivider} />
                        <View style={styles.timeBox}><Text style={styles.timeLabel}>خروج</Text><Text style={styles.timeValue}>{record.checkOut || '--:--'}</Text></View>
                        <View style={styles.timeDivider} />
                        <View style={styles.timeBox}><Text style={styles.timeLabel}>ساعات</Text><Text style={styles.timeValue}>{record.totalHours || '0'}</Text></View>
                    </View>
                ) : (
                    <View style={styles.emptyWorkDay}>
                        <Text style={styles.emptyDayText}>لم يتم تسجيل حضور اليوم</Text>
                    </View>
                )}

                <View style={styles.adminActions}>
                    {!record ? (
                        <TouchableOpacity style={[styles.actionBtn, styles.checkInBtn]} onPress={() => handleCheckIn(employee.id)}>
                            <Check size={16} color="#fff" />
                            <Text style={styles.actionBtnText}>حضور</Text>
                        </TouchableOpacity>
                    ) : !record.checkOut ? (
                        <TouchableOpacity style={[styles.actionBtn, styles.checkOutBtn]} onPress={() => handleCheckOut(record.id)}>
                            <LogOut size={16} color="#fff" />
                            <Text style={styles.actionBtnText}>انصراف</Text>
                        </TouchableOpacity>
                    ) : null}

                    {record && (
                        <TouchableOpacity style={[styles.actionBtn, styles.undoBtn]} onPress={() => handleUndo(employee.id)}>
                            <RotateCcw size={16} color={COLORS.text} />
                            <Text style={[styles.actionBtnText, { color: COLORS.text }]}>تراجع</Text>
                        </TouchableOpacity>
                    )}

                    {record && (
                        <TouchableOpacity style={[styles.actionBtn, styles.delBtn]} onPress={() => handleDelete(record.id)}>
                            <Trash2 size={16} color={COLORS.danger} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{isAdmin ? 'إدارة الحضور' : 'سجل حضوري'}</Text>

                {isAdmin ? (
                    <TouchableOpacity style={styles.actionButton} onPress={() => setIsModalVisible(true)}>
                        <Plus size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>يدوي</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionButton, isCheckedIn && { backgroundColor: COLORS.danger }]}
                        onPress={() => setIsCheckedIn(!isCheckedIn)}
                    >
                        <Clock size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>{isCheckedIn ? 'خروج' : 'دخول'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} animating /></View>
            ) : (
                <FlatList
                    data={(isAdmin ? employees.filter(emp => attendance.some(a => a.employeeId === emp.id && a.date === new Date().toISOString().split('T')[0])) : attendance) as any}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    renderItem={isAdmin ? (renderEmployeeAttendance as any) : (({ item }: any) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.headerRight}>
                                    <User size={18} color={COLORS.primary} />
                                    <Text style={styles.employeeName}>{getEmployeeName(item.employeeId)}</Text>
                                </View>
                                <Text style={styles.dateText}>{item.date}</Text>
                            </View>
                            <View style={styles.timeRow}>
                                <View style={styles.timeBox}><Text style={styles.timeLabel}>دخول</Text><Text style={styles.timeValue}>{item.checkIn}</Text></View>
                                <View style={styles.timeDivider} />
                                <View style={styles.timeBox}><Text style={styles.timeLabel}>خروج</Text><Text style={styles.timeValue}>{item.checkOut || '--:--'}</Text></View>
                                <View style={styles.timeDivider} />
                                <View style={styles.timeBox}><Text style={styles.timeLabel}>ساعات</Text><Text style={styles.timeValue}>{item.totalHours || '0'}</Text></View>
                            </View>
                        </View>
                    ))}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                            <Clock size={48} color={COLORS.textMuted} />
                            <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 16 }}>لا توجد سجلات حضور حالياً</Text>
                        </View>
                    }
                />
            )}

            {/* Manual Entry Modal */}
            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <XCircle size={24} color={COLORS.text} onPress={() => setIsModalVisible(false)} />
                            <Text style={styles.modalTitle}>تسجيل حضور يدوي</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <Text style={styles.inputLabel}>الموظف</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsUserPickerVisible(true)}>
                            <Text style={styles.pickerText}>{manualEntry.userName}</Text>
                            <ChevronDown size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.inputLabel}>وقت الدخول (اختياري)</Text>
                                <TextInput style={styles.modalInput} placeholder="08:00 (التلقائي: الوقت الحالي)" value={manualEntry.checkIn} onChangeText={t => setManualEntry({ ...manualEntry, checkIn: t })} textAlign="right" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>وقت الخروج (اختياري)</Text>
                                <TextInput style={styles.modalInput} placeholder="مثال: 16:00" value={manualEntry.checkOut} onChangeText={t => setManualEntry({ ...manualEntry, checkOut: t })} textAlign="right" />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleManualSubmit}>
                            <CheckCircle size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>حفظ السجل</Text>
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
                                    <TouchableOpacity style={styles.pickerOption} onPress={() => { setManualEntry({ ...manualEntry, userId: item.id, userName: item.name }); setIsUserPickerVisible(false); }}>
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
    actionButton: { flexDirection: 'row-reverse', backgroundColor: COLORS.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, alignItems: 'center', gap: 6 },
    actionButtonText: { color: '#fff', fontWeight: 'bold' },
    list: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
    card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8 },
    headerRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    employeeName: { color: COLORS.text, fontWeight: 'bold' },
    dateText: { color: COLORS.textMuted, fontSize: 12 },
    timeRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center' },
    timeBox: { alignItems: 'center' },
    timeLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
    timeValue: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    timeDivider: { width: 1, height: 20, backgroundColor: COLORS.border },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    modalContent: { backgroundColor: COLORS.surface, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    inputLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'right' },
    pickerTrigger: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    pickerText: { color: COLORS.text },
    modalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    row: { flexDirection: 'row-reverse' },
    saveBtn: { backgroundColor: COLORS.primary, flexDirection: 'row-reverse', height: 50, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    pickerContent: { backgroundColor: COLORS.surface, marginHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.lg, maxHeight: '60%', padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    pickerOption: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'flex-end' },
    pickerOptionText: { color: COLORS.text, fontSize: 16 },

    adminActions: { flexDirection: 'row-reverse', gap: 8, marginTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
    actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, gap: 4 },
    actionBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    checkInBtn: { backgroundColor: COLORS.primary },
    checkOutBtn: { backgroundColor: COLORS.secondary },
    undoBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    delBtn: { backgroundColor: COLORS.danger + '10', width: 36, height: 32, justifyContent: 'center' },
    statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusTagText: { fontSize: 11, fontWeight: 'bold' },
    emptyWorkDay: { padding: 10, alignItems: 'center', opacity: 0.5 },
    emptyDayText: { color: COLORS.textMuted, fontSize: 12 },
});

export default AttendanceScreen;
