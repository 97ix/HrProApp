import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, ArrowRight, Plus, Minus, CreditCard, Banknote, X, Check, Settings, Palette, Target } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { FinancialRecord, FinancialCategory, PaymentMethod } from '../types';

const FinancialManagementScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [balance, setBalance] = useState(150000000);
    const [records, setRecords] = useState<FinancialRecord[]>([]);

    const [categories, setCategories] = useState<FinancialCategory[]>([
        { id: '1', name: 'مبيعات', type: 'INCOME', color: '#10b981' },
        { id: '2', name: 'رواتب', type: 'EXPENSE', color: '#ef4444' },
        { id: '3', name: 'إيجارات', type: 'EXPENSE', color: '#f59e0b' },
    ]);

    // Modal States
    const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isPickerVisible, setIsPickerVisible] = useState(false);

    const [form, setForm] = useState({
        type: 'INCOME' as 'INCOME' | 'EXPENSE',
        category: 'مبيعات',
        amount: '',
        description: '',
        paymentMethod: 'CASH' as PaymentMethod,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/finance/records');
            setRecords(res.data);
        } catch (e) {
            setRecords([
                { id: '1', type: 'EXPENSE', category: 'رواتب', amount: 45000000, description: 'رواتب شهر فبراير', date: '2026-02-23', status: 'PAID' },
                { id: '2', type: 'INCOME', category: 'مبيعات', amount: 12000000, description: 'دفعة زبون', date: '2026-02-22', status: 'PAID' },
            ] as any);
        }
    };

    const handleSaveEntry = () => {
        if (!form.amount || !form.description) {
            Alert.alert('خطأ', 'يرجى ملء البيانات');
            return;
        }

        const newRec: FinancialRecord = {
            id: Math.random().toString(),
            ...form,
            amount: Number(form.amount),
            date: new Date().toISOString().split('T')[0],
            status: 'PAID',
        };

        setBalance(prev => form.type === 'INCOME' ? prev + newRec.amount : prev - newRec.amount);
        setRecords([newRec, ...records]);
        setIsEntryModalVisible(false);
        setForm({ type: 'INCOME', category: 'مبيعات', amount: '', description: '', paymentMethod: 'CASH' });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>الإدارة المالية</Text>
                <TouchableOpacity style={styles.settingsBtn} onPress={() => setIsCategoryModalVisible(true)}>
                    <Palette size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>الرصيد الكلي المتوفر</Text>
                    <Text style={styles.balanceValue}>{balance.toLocaleString()} د.ع</Text>
                    <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.cardBtn} onPress={() => { setForm({ ...form, type: 'INCOME' }); setIsEntryModalVisible(true); }}>
                            <Plus size={20} color="#fff" />
                            <Text style={styles.cardBtnText}>إيراد</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.cardBtn, { backgroundColor: COLORS.danger }]} onPress={() => { setForm({ ...form, type: 'EXPENSE' }); setIsEntryModalVisible(true); }}>
                            <Minus size={20} color="#fff" />
                            <Text style={styles.cardBtnText}>مصروف</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>السجل المالي</Text>
                {records.map((item) => (
                    <View key={item.id} style={styles.recordItem}>
                        <View style={styles.recordMain}>
                            <Text style={styles.recordTitle}>{item.description}</Text>
                            <Text style={styles.recordSub}>{item.category} • {item.date}</Text>
                        </View>
                        <View style={styles.recordAmountBox}>
                            <Text style={[styles.recordAmount, { color: item.type === 'INCOME' ? COLORS.secondary : COLORS.danger }]}>
                                {item.type === 'INCOME' ? '+' : '-'}{item.amount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Entry Modal */}
            <Modal visible={isEntryModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <X size={24} color={COLORS.text} onPress={() => setIsEntryModalVisible(false)} />
                            <Text style={styles.modalTitle}>{form.type === 'INCOME' ? 'إضافة إيراد' : 'إضافة مصروف'}</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <Text style={styles.inputLabel}>المبلغ (د.ع)</Text>
                        <TextInput style={styles.modalInput} keyboardType="numeric" value={form.amount} onChangeText={t => setForm({ ...form, amount: t })} textAlign="right" />

                        <Text style={styles.inputLabel}>التصنيف</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsPickerVisible(true)}>
                            <Text style={styles.pickerText}>{form.category}</Text>
                            <Target size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>الوصف / البيان</Text>
                        <TextInput style={styles.modalInput} value={form.description} onChangeText={t => setForm({ ...form, description: t })} textAlign="right" />

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: form.type === 'INCOME' ? COLORS.secondary : COLORS.danger }]} onPress={handleSaveEntry}>
                            <Check size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>حفظ العملية</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Internal Picker */}
                <Modal visible={isPickerVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsPickerVisible(false)}>
                        <View style={styles.pickerContent}>
                            {categories.filter(c => c.type === form.type).map(cat => (
                                <TouchableOpacity key={cat.id} style={styles.pickerOption} onPress={() => { setForm({ ...form, category: cat.name }); setIsPickerVisible(false); }}>
                                    <View style={[styles.catColor, { backgroundColor: cat.color }]} />
                                    <Text style={styles.pickerOptionText}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </Modal>

            {/* Category Management Modal */}
            <Modal visible={isCategoryModalVisible} animationType="slide">
                <View style={[styles.fullModal, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                            <ArrowRight size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>إدارة التصنيفات المالية</Text>
                        <Plus size={24} color={COLORS.primary} />
                    </View>
                    <FlatList
                        data={categories}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <View style={styles.catCard}>
                                <View style={[styles.catColorCircle, { backgroundColor: item.color }]} />
                                <View style={styles.catInfo}>
                                    <Text style={styles.catName}>{item.name}</Text>
                                    <Text style={[styles.catType, { color: item.type === 'INCOME' ? COLORS.secondary : COLORS.danger }]}>{item.type === 'INCOME' ? 'إيراد' : 'مصروف'}</Text>
                                </View>
                                <Settings size={18} color={COLORS.textMuted} />
                            </View>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
    backButton: { padding: SPACING.xs },
    title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    content: { padding: SPACING.lg },
    balanceCard: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 8 },
    balanceValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    cardActions: { flexDirection: 'row', gap: SPACING.md, marginTop: 20 },
    cardBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, gap: 10, alignItems: 'center', justifyContent: 'center' },
    cardBtnText: { color: '#fff', fontWeight: 'bold' },
    sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.md, textAlign: 'right' },
    recordItem: { flexDirection: 'row-reverse', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
    recordMain: { alignItems: 'flex-end', flex: 1 },
    recordTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },
    recordSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
    recordAmountBox: { alignItems: 'flex-start' },
    recordAmount: { fontSize: 16, fontWeight: 'bold' },

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
    pickerOption: { flexDirection: 'row-reverse', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerOptionText: { flex: 1, textAlign: 'right', color: COLORS.text, fontSize: 16 },
    catColor: { width: 12, height: 12, borderRadius: 6, marginLeft: 10 },

    fullModal: { flex: 1, backgroundColor: COLORS.background },
    catCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
    catColorCircle: { width: 40, height: 40, borderRadius: 20, marginLeft: 15 },
    catInfo: { flex: 1, alignItems: 'flex-end' },
    catName: { fontSize: 16, fontWeight: 'bold' },
    catType: { fontSize: 12 },
});

export default FinancialManagementScreen;
