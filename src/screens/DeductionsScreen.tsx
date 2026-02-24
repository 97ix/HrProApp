import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, ArrowRight, User, AlertCircle, X, Check, ChevronDown } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { Employee } from '../types';

const DeductionsScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isUserPickerVisible, setIsUserPickerVisible] = useState(false);

    const [type, setType] = useState<'BONUS' | 'DEDUCTION'>('BONUS');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        userId: '',
        userName: 'اختر الموظف',
        amount: '',
        reason: '',
    });

    const [data, setData] = useState([
        { id: '1', name: 'أحمد علي', type: 'BONUS', amount: '50,000', reason: 'مكافأة تميز', date: '2026-02-23' },
        { id: '2', name: 'سارة محمود', type: 'DEDUCTION', amount: '25,000', reason: 'تأخر عن الدوام', date: '2026-02-22' },
    ]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/api/employees');
            setEmployees(res.data || []);
        } catch (e) {
            setEmployees([{ id: 'emp_1', name: 'أحمد علي' }, { id: 'emp_2', name: 'سارة محمود' }] as any);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdjustment = () => {
        if (!form.userId || !form.amount || !form.reason) {
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول واختيار الموظف');
            return;
        }

        const newEntry = {
            id: Math.random().toString(),
            name: form.userName,
            type: type,
            amount: Number(form.amount).toLocaleString(),
            reason: form.reason,
            date: new Date().toISOString().split('T')[0],
        };

        setData([newEntry, ...data]);
        setIsModalVisible(false);
        setForm({ userId: '', userName: 'اختر الموظف', amount: '', reason: '' });
        Alert.alert('نجاح', 'تم تسجيل العملية بنجاح');
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.recordInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.date}>{item.date}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'BONUS' ? COLORS.secondary + '20' : COLORS.danger + '20' }]}>
                    {item.type === 'BONUS' ? <TrendingUp size={16} color={COLORS.secondary} /> : <TrendingDown size={16} color={COLORS.danger} />}
                    <Text style={[styles.typeText, { color: item.type === 'BONUS' ? COLORS.secondary : COLORS.danger }]}>
                        {item.type === 'BONUS' ? 'زيادة' : 'خصم'}
                    </Text>
                </View>
            </View>
            <View style={styles.details}>
                <Text style={styles.reason}>{item.reason}</Text>
                <Text style={[styles.amount, { color: item.type === 'BONUS' ? COLORS.secondary : COLORS.danger }]}>
                    {item.type === 'BONUS' ? '+' : '-'}{item.amount} د.ع
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>الزيادات والخصومات</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
                    <AlertCircle size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterTabs}>
                <TouchableOpacity style={[styles.tab, type === 'BONUS' && styles.activeTab]} onPress={() => setType('BONUS')}>
                    <Text style={[styles.tabText, type === 'BONUS' && styles.activeTabText]}>مكافآت وزيادات</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, type === 'DEDUCTION' && styles.activeTab]} onPress={() => setType('DEDUCTION')}>
                    <Text style={[styles.tabText, type === 'DEDUCTION' && styles.activeTabText]}>خصومات وعقوبات</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                            <AlertCircle size={48} color={COLORS.textMuted} />
                            <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 16 }}>لا توجد سجلات حالياً</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <X size={24} color={COLORS.text} onPress={() => setIsModalVisible(false)} />
                            <Text style={styles.modalTitle}>إضافة {type === 'BONUS' ? 'زيادة' : 'خصم'}</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <Text style={styles.inputLabel}>الموظف</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsUserPickerVisible(true)}>
                            <Text style={styles.pickerText}>{form.userName}</Text>
                            <ChevronDown size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>المبلغ (د.ع)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={form.amount}
                            onChangeText={(t) => setForm({ ...form, amount: t })}
                            textAlign="right"
                        />

                        <Text style={styles.inputLabel}>السبب</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="مثال: جهد إضافي"
                            value={form.reason}
                            onChangeText={(t) => setForm({ ...form, reason: t })}
                            textAlign="right"
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: type === 'BONUS' ? COLORS.secondary : COLORS.danger }]}
                            onPress={handleAddAdjustment}
                        >
                            <Check size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>تسجيل</Text>
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
                                    <TouchableOpacity style={styles.pickerOption} onPress={() => { setForm({ ...form, userId: item.id, userName: item.name }); setIsUserPickerVisible(false); }}>
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
    filterTabs: { flexDirection: 'row-reverse', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BORDER_RADIUS.sm },
    activeTab: { backgroundColor: COLORS.primary },
    tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: 'bold' },
    activeTabText: { color: '#fff' },
    list: { padding: SPACING.lg },
    card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    recordInfo: { alignItems: 'flex-end' },
    userName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    date: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
    typeBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    typeText: { fontSize: 12, fontWeight: 'bold' },
    details: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    reason: { color: COLORS.text, fontSize: 14, flex: 1, textAlign: 'right' },
    amount: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    modalContent: { backgroundColor: COLORS.surface, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    inputLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 6, textAlign: 'right' },
    modalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    pickerTrigger: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    pickerText: { color: COLORS.text },
    saveBtn: { flexDirection: 'row-reverse', height: 50, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    pickerContent: { backgroundColor: COLORS.surface, margin: 40, borderRadius: BORDER_RADIUS.lg, maxHeight: '60%' },
    pickerOption: { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerOptionText: { textAlign: 'center', color: COLORS.text, fontSize: 16 },
});

export default DeductionsScreen;
