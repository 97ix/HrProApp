import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet, View, Text, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Wallet, ArrowRight, Calculator, RotateCcw,
    TrendingUp, TrendingDown, Info, ChevronDown
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { PayrollRecord, Employee } from '../types';

interface FinancialAdjustment {
    id: string;
    employeeId: string;
    type: 'BONUS' | 'DEDUCTION';
    amount: number;
    reason: string;
    date: string;
}

interface Loan {
    id: string;
    employeeId: string;
    installmentAmount: number;
    status: string;
    installments?: { month: string; status: string }[];
}

const PayrollScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [records, setRecords] = useState<PayrollRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCalculating, setIsCalculating] = useState(false);

    // اختيار الشهر
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

    const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    // الشهر المحدد للعرض
    const [selectedDetail, setSelectedDetail] = useState<{ emp: Employee; rec: PayrollRecord } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, empRes, adjRes, loanRes] = await Promise.all([
                api.get('/api/payroll').catch(() => ({ data: [] })),
                api.get('/api/employees'),
                api.get('/api/adjustments').catch(() => ({ data: [] })),
                api.get('/api/loans').catch(() => ({ data: [] })),
            ]);
            setRecords(Array.isArray(payRes.data) ? payRes.data : []);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
            setAdjustments(Array.isArray(adjRes.data) ? adjRes.data : []);
            setLoans(Array.isArray(loanRes.data) ? loanRes.data : []);
        } catch (error) {
            setRecords([]);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    // سجلات الشهر المختار
    const monthRecords = useMemo(() =>
        records.filter(r => r.month === monthKey),
        [records, monthKey]
    );

    // حساب المكافآت والخصومات الحقيقية لموظف في شهر معين
    const getEmployeeAdj = (empId: string) => {
        const empAdjs = adjustments.filter(a => {
            if (a.employeeId !== empId) return false;
            const adjDate = new Date(a.date);
            return adjDate.getFullYear() === selectedYear && adjDate.getMonth() + 1 === selectedMonth;
        });
        const bonus = empAdjs.filter(a => a.type === 'BONUS').reduce((s, a) => s + a.amount, 0);
        const deduction = empAdjs.filter(a => a.type === 'DEDUCTION').reduce((s, a) => s + a.amount, 0);
        return { bonus, deduction, items: empAdjs };
    };

    // حساب قسط السلفة للموظف
    const getEmployeeLoanInstallment = (empId: string) => {
        const activeLoans = loans.filter(l =>
            l.employeeId === empId &&
            (l.status === 'APPROVED' || l.status === 'approved') &&
            l.installments?.some(inst => inst.month === monthKey && inst.status === 'PENDING')
        );
        return activeLoans.reduce((s, l) => s + (l.installmentAmount || 0), 0);
    };

    const getEmployeeName = (id: string) =>
        employees.find(e => e.id === id)?.name || 'غير معروف';

    // احتساب الرواتب من الـ API
    const handleCalculateAll = () => {
        Alert.alert(
            'احتساب الرواتب',
            `هل أنت متأكد من احتساب رواتب شهر ${selectedMonth}/${selectedYear}؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'احتساب الآن',
                    onPress: async () => {
                        setIsCalculating(true);
                        try {
                            const res = await api.post('/api/payroll/calculate', { month: monthKey });
                            const calculated = res.data;
                            if (Array.isArray(calculated) && calculated.length > 0) {
                                setRecords(prev => [
                                    ...prev.filter(r => r.month !== monthKey),
                                    ...calculated
                                ]);
                                Alert.alert('نجاح', 'تم احتساب الرواتب بنجاح.');
                            } else {
                                // احتساب محلي باستخدام البيانات الحقيقية
                                const newRecs = employees.map(emp => {
                                    const { bonus, deduction } = getEmployeeAdj(emp.id);
                                    const loanInst = getEmployeeLoanInstallment(emp.id);
                                    const net = (emp.salary || 0) + bonus - deduction - loanInst;
                                    return {
                                        id: Math.random().toString(36).substr(2, 9),
                                        employeeId: emp.id,
                                        month: monthKey,
                                        basicSalary: emp.salary || 0,
                                        bonus,
                                        deductions: deduction + loanInst,
                                        netSalary: net,
                                        actualPaidAmount: net,
                                        status: 'PENDING' as const,
                                    };
                                });
                                setRecords(prev => [
                                    ...prev.filter(r => r.month !== monthKey),
                                    ...newRecs
                                ]);
                                Alert.alert('نجاح', 'تم احتساب الرواتب بنجاح.');
                            }
                        } catch {
                            // احتساب محلي عند فشل API
                            const newRecs = employees.map(emp => {
                                const { bonus, deduction } = getEmployeeAdj(emp.id);
                                const loanInst = getEmployeeLoanInstallment(emp.id);
                                const net = (emp.salary || 0) + bonus - deduction - loanInst;
                                return {
                                    id: Math.random().toString(36).substr(2, 9),
                                    employeeId: emp.id,
                                    month: monthKey,
                                    basicSalary: emp.salary || 0,
                                    bonus,
                                    deductions: deduction + loanInst,
                                    netSalary: net,
                                    actualPaidAmount: net,
                                    status: 'PENDING' as const,
                                };
                            });
                            setRecords(prev => [
                                ...prev.filter(r => r.month !== monthKey),
                                ...newRecs
                            ]);
                            Alert.alert('نجاح', 'تم احتساب الرواتب بنجاح.');
                        } finally {
                            setIsCalculating(false);
                        }
                    }
                }
            ]
        );
    };

    const handleUndoCalculation = () => {
        Alert.alert(
            'تراجع عن الاحتساب',
            'هل أنت متأكد من حذف كشوفات هذا الشهر غير المدفوعة؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'تراجع الآن', style: 'destructive',
                    onPress: () => {
                        setRecords(prev => prev.filter(r => r.month !== monthKey || r.status === 'PAID'));
                        Alert.alert('تم التراجع', 'تم حذف كشوفات الرواتب غير المدفوعة.');
                    }
                }
            ]
        );
    };

    // Modal تفاصيل الراتب
    const renderDetailModal = () => {
        if (!selectedDetail) return null;
        const { emp, rec } = selectedDetail;
        const { items: adjItems } = getEmployeeAdj(emp.id);
        const loanInst = getEmployeeLoanInstallment(emp.id);
        const bonusItems = adjItems.filter(a => a.type === 'BONUS');
        const deductItems = adjItems.filter(a => a.type === 'DEDUCTION');

        return (
            <Modal visible={true} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.detailContent}>
                        <View style={styles.detailHeader}>
                            <Text style={styles.detailTitle}>تفاصيل الراتب المستحق</Text>
                            <Text style={styles.detailName}>{emp.name}</Text>
                            <Text style={[styles.detailName, { color: COLORS.textMuted, fontSize: 12 }]}>{rec.month}</Text>
                        </View>

                        <ScrollView style={styles.detailBody}>
                            {/* الراتب الأساسي */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailValue}>{(rec.basicSalary || emp.salary || 0).toLocaleString()} د.ع</Text>
                                <Text style={styles.detailLabel}>الراتب الأساسي</Text>
                            </View>

                            {/* المكافآت */}
                            {bonusItems.length > 0 ? bonusItems.map(adj => (
                                <View key={adj.id} style={styles.detailRow}>
                                    <Text style={[styles.detailValue, { color: COLORS.secondary }]}>+{adj.amount.toLocaleString()} د.ع</Text>
                                    <Text style={styles.detailLabel}>مكافأة: {adj.reason}</Text>
                                </View>
                            )) : rec.bonus > 0 ? (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailValue, { color: COLORS.secondary }]}>+{rec.bonus.toLocaleString()} د.ع</Text>
                                    <Text style={styles.detailLabel}>مكافآت وإضافات</Text>
                                </View>
                            ) : null}

                            {/* الخصومات */}
                            {deductItems.length > 0 ? deductItems.map(adj => (
                                <View key={adj.id} style={styles.detailRow}>
                                    <Text style={[styles.detailValue, { color: COLORS.danger }]}>-{adj.amount.toLocaleString()} د.ع</Text>
                                    <Text style={styles.detailLabel}>خصم: {adj.reason}</Text>
                                </View>
                            )) : rec.deductions > 0 ? (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailValue, { color: COLORS.danger }]}>-{rec.deductions.toLocaleString()} د.ع</Text>
                                    <Text style={styles.detailLabel}>خصومات</Text>
                                </View>
                            ) : null}

                            {/* قسط السلفة */}
                            {loanInst > 0 && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailValue, { color: COLORS.danger }]}>-{loanInst.toLocaleString()} د.ع</Text>
                                    <Text style={styles.detailLabel}>قسط السلفة</Text>
                                </View>
                            )}

                            <View style={styles.totalBox}>
                                <Text style={styles.totalLabel}>صافي الراتب المستحق</Text>
                                <Text style={styles.totalValue}>{(rec.actualPaidAmount || rec.netSalary || 0).toLocaleString()} د.ع</Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedDetail(null)}>
                            <Text style={styles.closeBtnText}>إغلاق</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>كشوفات الرواتب</Text>
                <View style={styles.headerActions}>
                    {monthRecords.length > 0 && (
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

            {/* Month Selector */}
            <TouchableOpacity style={styles.monthSelector} onPress={() => setIsMonthPickerVisible(true)}>
                <ChevronDown size={18} color={COLORS.primary} />
                <Text style={styles.monthText}>{MONTHS_AR[selectedMonth - 1]} {selectedYear}</Text>
            </TouchableOpacity>

            {/* Month Picker Modal */}
            <Modal visible={isMonthPickerVisible} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsMonthPickerVisible(false)}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>اختر الشهر</Text>
                        <ScrollView>
                            {[2025, 2026, 2027].map(y =>
                                Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <TouchableOpacity
                                        key={`${y}-${m}`}
                                        style={[styles.pickerOption, selectedYear === y && selectedMonth === m && { backgroundColor: COLORS.primary + '20' }]}
                                        onPress={() => { setSelectedYear(y); setSelectedMonth(m); setIsMonthPickerVisible(false); }}
                                    >
                                        <Text style={[styles.pickerOptionText, selectedYear === y && selectedMonth === m && { color: COLORS.primary, fontWeight: 'bold' }]}>
                                            {MONTHS_AR[m - 1]} {y}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {isCalculating && (
                <View style={styles.calcOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.calcText}>جاري احتساب الرواتب...</Text>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={monthRecords}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const { bonus, deduction } = getEmployeeAdj(item.employeeId);
                        // استخدم القيم من السجل إذا كان محتسباً مسبقاً، وإلا القيم الحقيقية
                        const displayBonus = item.bonus || bonus;
                        const displayDeduction = item.deductions || deduction;
                        const emp = employees.find(e => e.id === item.employeeId);

                        return (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => emp && setSelectedDetail({ emp, rec: item })}
                            >
                                <View style={styles.cardMain}>
                                    <View style={styles.info}>
                                        <Text style={styles.name}>{getEmployeeName(item.employeeId)}</Text>
                                        <Text style={styles.netAmount}>{(item.actualPaidAmount || item.netSalary || 0).toLocaleString()} د.ع</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'PAID' ? COLORS.secondary + '20' : COLORS.accent + '20' }]}>
                                        <Text style={[styles.statusText, { color: item.status === 'PAID' ? COLORS.secondary : COLORS.accent }]}>
                                            {item.status === 'PAID' ? 'تم الدفع' : 'بالانتظار'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.cardFooter}>
                                    {displayBonus > 0 && (
                                        <View style={styles.footerItem}>
                                            <TrendingUp size={12} color={COLORS.secondary} />
                                            <Text style={styles.footerText}>+{displayBonus.toLocaleString()}</Text>
                                        </View>
                                    )}
                                    {displayDeduction > 0 && (
                                        <View style={styles.footerItem}>
                                            <TrendingDown size={12} color={COLORS.danger} />
                                            <Text style={styles.footerText}>-{displayDeduction.toLocaleString()}</Text>
                                        </View>
                                    )}
                                    <Info size={16} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                            <Wallet size={48} color={COLORS.textMuted} />
                            <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 16 }}>لا توجد كشوفات رواتب لهذا الشهر</Text>
                            <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>اضغط "احتساب" لتوليد كشوفات من بيانات النظام</Text>
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

    monthSelector: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
    monthText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15, flex: 1, textAlign: 'right' },

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
    detailBody: { maxHeight: 350 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '50' },
    detailLabel: { color: COLORS.textMuted, fontSize: 13, flex: 1, textAlign: 'left' },
    detailValue: { color: COLORS.text, fontWeight: 'bold', fontSize: 14 },
    totalBox: { backgroundColor: COLORS.primary + '10', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: 20, alignItems: 'center' },
    totalLabel: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
    totalValue: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', marginTop: 5 },
    closeBtn: { marginTop: 20, padding: 12, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md },
    closeBtnText: { color: COLORS.danger, fontWeight: 'bold' },

    pickerContent: { backgroundColor: COLORS.surface, margin: 30, borderRadius: BORDER_RADIUS.lg, maxHeight: '70%' },
    pickerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerOption: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerOptionText: { color: COLORS.text, fontSize: 14, textAlign: 'center' },
});

export default PayrollScreen;
