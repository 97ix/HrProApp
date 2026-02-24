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
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, ArrowRight, ChevronRight, Calculator, FileText, CheckCircle, Info, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { PayrollRecord, Employee } from '../types';

const PayrollScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [records, setRecords] = useState<PayrollRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('2026-02');

    // Detailed View State
    const [selectedDetail, setSelectedDetail] = useState<Employee | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [payRes, empRes] = await Promise.all([
                api.get(`/api/payroll/${selectedMonth}`),
                api.get('/api/employees')
            ]);
            setRecords(payRes.data || []);
            setEmployees(empRes.data || []);
        } catch (error) {
            setRecords([{ id: '1', employeeId: 'emp_1', month: '2026-02', basicSalary: 1200000, bonus: 50000, deductions: 25000, netSalary: 1225000, status: 'PAID' }] as any);
            setEmployees([{ id: 'emp_1', name: 'أحمد علي', salary: 1200000, workingHours: 8, phoneNumber: '07701234567' }] as any);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateAll = () => {
        Alert.alert(
            'احتساب الرواتب',
            `هل أنت متأكد من احتساب رواتب شهر ${selectedMonth}؟ سيتم تطبيق الخصومات والزيادات المسجلة آلياً.`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'احتساب الآن',
                    onPress: () => {
                        setIsCalculating(true);
                        setTimeout(() => {
                            setIsCalculating(false);
                            // Simulate calculation results
                            const newRecs = employees.map(emp => ({
                                id: Math.random().toString(),
                                employeeId: emp.id,
                                month: selectedMonth,
                                basicSalary: emp.salary,
                                bonus: 50000,
                                deductions: 25000,
                                netSalary: emp.salary + 25000,
                                status: 'PENDING'
                            }));
                            setRecords(newRecs as any);
                            Alert.alert('نجاح', 'تم احتساب الرواتب لجميع الموظفين بنجاح.');
                        }, 2000);
                    }
                }
            ]
        );
    };

    const handleUndoCalculation = () => {
        Alert.alert(
            'تراجع عن الاحتساب',
            'هل أنت متأكد من التراجع عن احتساب الرواتب لهذا الشهر؟ سيتم حذف الكشوفات غير المدفوعة.',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'تراجع الآن',
                    style: 'destructive',
                    onPress: () => {
                        setRecords([]);
                        Alert.alert('تم التراجع', 'تم حذف كشوفات الرواتب المحتسبة بنجاح.');
                    }
                }
            ]
        );
    };

    const getEmployeeName = (id: string) => {
        if (!employees || !Array.isArray(employees)) return 'غير معروف';
        return employees.find(e => e.id === id)?.name || 'غير معروف';
    };

    const renderDetailModal = () => (
        <Modal visible={!!selectedDetail} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.detailContent}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.detailTitle}>تفاصيل الراتب المستحق</Text>
                        <Text style={styles.detailName}>{selectedDetail?.name}</Text>
                    </View>

                    <ScrollView style={styles.detailBody}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailValue}>{selectedDetail?.salary.toLocaleString()} د.ع</Text>
                            <Text style={styles.detailLabel}>الراتب الأساسي</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                            <Text style={[styles.detailValue, { color: COLORS.secondary }]}>+ 50,000 د.ع</Text>
                            <Text style={styles.detailLabel}>مكافآت وإضافات</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomWidth: 0, marginTop: -15 }]}>
                            <Text style={[styles.detailValue, { color: COLORS.danger }]}>- 25,000 د.ع</Text>
                            <Text style={styles.detailLabel}>خصومات وعقوبات</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomWidth: 0, marginTop: -15 }]}>
                            <Text style={[styles.detailValue, { color: COLORS.danger }]}>- 200,000 د.ع</Text>
                            <Text style={styles.detailLabel}>قسط السلفة</Text>
                        </View>

                        <View style={styles.totalBox}>
                            <Text style={styles.totalLabel}>صافي الراتب المتوقع</Text>
                            <Text style={styles.totalValue}>1,025,000 د.ع</Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedDetail(null)}>
                        <Text style={styles.closeBtnText}>إغلاق</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>كشوفات الرواتب</Text>
                <View style={styles.headerActions}>
                    {records.length > 0 && (
                        <TouchableOpacity style={[styles.calcBtn, { backgroundColor: COLORS.danger, marginLeft: 8 }]} onPress={handleUndoCalculation}>
                            <RotateCcw size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.calcBtn} onPress={handleCalculateAll}>
                        <Calculator size={20} color="#fff" />
                        <Text style={styles.calcBtnText}>احتساب</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {isCalculating && (
                <View style={styles.calcOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.calcText}>جاري احتساب الرواتب...</Text>
                </View>
            )}

            {loading ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={records}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => setSelectedDetail(employees.find(e => e.id === item.employeeId) || null)}
                        >
                            <View style={styles.cardMain}>
                                <View style={styles.info}>
                                    <Text style={styles.name}>{getEmployeeName(item.employeeId)}</Text>
                                    <Text style={styles.netAmount}>{item.netSalary.toLocaleString()} د.ع</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: item.status === 'PAID' ? COLORS.secondary + '20' : COLORS.accent + '20' }]}>
                                    <Text style={[styles.statusText, { color: item.status === 'PAID' ? COLORS.secondary : COLORS.accent }]}>
                                        {item.status === 'PAID' ? 'تم الدفع' : 'بالانتظار'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.cardFooter}>
                                <View style={styles.footerItem}>
                                    <TrendingUp size={12} color={COLORS.secondary} />
                                    <Text style={styles.footerText}>+{item.bonus.toLocaleString()}</Text>
                                </View>
                                <View style={styles.footerItem}>
                                    <TrendingDown size={12} color={COLORS.danger} />
                                    <Text style={styles.footerText}>-{item.deductions.toLocaleString()}</Text>
                                </View>
                                <Info size={16} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                            <Wallet size={48} color={COLORS.textMuted} />
                            <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 16 }}>لا توجد كشوفات رواتب لهذا الشهر</Text>
                        </View>
                    }
                />
            )}

            {renderDetailModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
    backButton: { padding: SPACING.xs },
    title: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
    headerActions: { flexDirection: 'row-reverse', alignItems: 'center' },
    calcBtn: { flexDirection: 'row-reverse', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, alignItems: 'center', gap: 6 },
    calcBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    list: { padding: SPACING.lg, paddingBottom: 40 },
    card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    cardMain: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    info: { alignItems: 'flex-end' },
    name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    netAmount: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    cardFooter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 15, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    footerItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 11, color: COLORS.textMuted },

    calcOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    calcText: { color: '#fff', marginTop: 15, fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    detailContent: { backgroundColor: COLORS.surface, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl },
    detailHeader: { alignItems: 'center', marginBottom: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.md },
    detailTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    detailName: { fontSize: 14, color: COLORS.primary, marginTop: 4 },
    detailBody: { maxHeight: 300 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border + '50' },
    detailLabel: { color: COLORS.textMuted, fontSize: 14 },
    detailValue: { color: COLORS.text, fontWeight: 'bold', fontSize: 14 },
    totalBox: { backgroundColor: COLORS.primary + '10', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: 20, alignItems: 'center' },
    totalLabel: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
    totalValue: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', marginTop: 5 },
    closeBtn: { marginTop: 20, padding: 12, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md },
    closeBtnText: { color: COLORS.danger, fontWeight: 'bold' },
});

export default PayrollScreen;
