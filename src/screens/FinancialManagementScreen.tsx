import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    Modal, TextInput, Alert, FlatList, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowRight, Plus, TrendingUp, TrendingDown, DollarSign,
    X, Check, Pencil, Trash2, Tag, ChevronDown
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';

interface FinancialRecord {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    description: string;
    date: string;
    paymentMethod?: string;
    status?: string;
}

interface FinancialCategory {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string;
}

const DEFAULT_CATEGORIES: FinancialCategory[] = [
    { id: 'cat_rev', name: 'وارد / مبيعات', type: 'INCOME', color: '#10b981' },
    { id: 'cat_other_inc', name: 'إيراد عام', type: 'INCOME', color: '#6366f1' },
    { id: 'cat_salary', name: 'رواتب', type: 'EXPENSE', color: '#ef4444' },
    { id: 'cat_ops', name: 'مواد تشغيلية', type: 'EXPENSE', color: '#f59e0b' },
    { id: 'cat_invoice', name: 'فواتير', type: 'EXPENSE', color: '#8b5cf6' },
    { id: 'cat_trans', name: 'نقل وشحن', type: 'EXPENSE', color: '#06b6d4' },
    { id: 'cat_other_exp', name: 'مصروف عام', type: 'EXPENSE', color: '#64748b' },
];

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'نقد' },
    { value: 'BANK', label: 'تحويل بنكي' },
    { value: 'CARD', label: 'بطاقة ائتمانية' },
];

type TabType = 'OVERVIEW' | 'INCOME' | 'EXPENSE';

const FinancialManagementScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [categories, setCategories] = useState<FinancialCategory[]>(DEFAULT_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

    // Form state
    const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
    const [entryType, setEntryType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
    const [form, setForm] = useState({ category: '', amount: '', description: '', paymentMethod: 'CASH' });

    // Category modal
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', type: 'EXPENSE' as 'INCOME' | 'EXPENSE' });
    const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);

    // Pickers
    const [isCatPickerVisible, setIsCatPickerVisible] = useState(false);
    const [isPaymentPickerVisible, setIsPaymentPickerVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [recRes, catRes] = await Promise.all([
                api.get('/api/finance/records'),
                api.get('/api/finance/categories').catch(() => ({ data: null })),
            ]);
            const recData = recRes.data;
            if (Array.isArray(recData)) setRecords(recData);
            else if (recData?.records) setRecords(recData.records);
            else setRecords([]);

            const catData = catRes.data;
            if (Array.isArray(catData) && catData.length > 0) setCategories(catData);
        } catch (e) {
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    // ── إحصاءات ──
    const stats = useMemo(() => {
        const income = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
        const expense = records.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
        return { income, expense, net: income - expense };
    }, [records]);

    const filteredRecords = useMemo(() => {
        if (activeTab === 'INCOME') return records.filter(r => r.type === 'INCOME');
        if (activeTab === 'EXPENSE') return records.filter(r => r.type === 'EXPENSE');
        return records;
    }, [records, activeTab]);

    const getCategoryName = (catId: string) => {
        const cat = categories.find(c => c.id === catId || c.name === catId);
        return cat?.name || catId;
    };

    const getCategoryColor = (catId: string, type: string) => {
        const cat = categories.find(c => c.id === catId || c.name === catId);
        return cat?.color || (type === 'INCOME' ? '#10b981' : '#ef4444');
    };

    // ── فتح نموذج الإضافة ──
    const openAddModal = (type: 'INCOME' | 'EXPENSE') => {
        setEntryType(type);
        setEditingRecord(null);
        const defaultCat = categories.find(c => c.type === type);
        setForm({ category: defaultCat?.id || '', amount: '', description: '', paymentMethod: 'CASH' });
        setIsEntryModalVisible(true);
    };

    const openEditModal = (record: FinancialRecord) => {
        setEditingRecord(record);
        setEntryType(record.type);
        setForm({
            category: record.category,
            amount: record.amount.toString(),
            description: record.description,
            paymentMethod: record.paymentMethod || 'CASH',
        });
        setIsEntryModalVisible(true);
    };

    // ── حفظ السجل ──
    const handleSaveEntry = async () => {
        if (!form.amount || Number(form.amount) <= 0) {
            Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
            return;
        }
        if (!form.description.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال الوصف');
            return;
        }
        if (!form.category) {
            Alert.alert('خطأ', 'يرجى اختيار التصنيف');
            return;
        }

        const record: FinancialRecord = {
            id: editingRecord?.id || Math.random().toString(36).substr(2, 9),
            type: entryType,
            category: form.category,
            amount: Number(form.amount),
            description: form.description.trim(),
            date: new Date().toISOString().split('T')[0],
            paymentMethod: form.paymentMethod,
            status: 'PAID',
        };

        try {
            if (editingRecord) {
                await api.put(`/api/finance/records/${record.id}`, record).catch(() => { });
                setRecords(prev => prev.map(r => r.id === record.id ? record : r));
            } else {
                await api.post('/api/finance/records', record).catch(() => { });
                setRecords(prev => [record, ...prev]);
            }
        } catch (e) {
            if (editingRecord) {
                setRecords(prev => prev.map(r => r.id === record.id ? record : r));
            } else {
                setRecords(prev => [record, ...prev]);
            }
        }

        setIsEntryModalVisible(false);
        setEditingRecord(null);
    };

    // ── حذف سجل ──
    const handleDeleteRecord = (id: string) => {
        Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا السجل؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف', style: 'destructive', onPress: async () => {
                        await api.delete(`/api/finance/records/${id}`).catch(() => { });
                        setRecords(prev => prev.filter(r => r.id !== id));
                    }
                }
            ]
        );
    };

    // ── حفظ تصنيف ──
    const handleSaveCategory = async () => {
        if (!catForm.name.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال اسم التصنيف');
            return;
        }

        const colors: Record<string, string> = {
            INCOME: '#10b981',
            EXPENSE: '#ef4444',
        };

        if (editingCategory) {
            const updated = { ...editingCategory, name: catForm.name.trim(), type: catForm.type, color: editingCategory.color };
            setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
            setEditingCategory(null);
        } else {
            const newCat: FinancialCategory = {
                id: Math.random().toString(36).substr(2, 9),
                name: catForm.name.trim(),
                type: catForm.type,
                color: colors[catForm.type],
            };
            setCategories(prev => [...prev, newCat]);
        }
        setCatForm({ name: '', type: 'EXPENSE' });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>الإدارة المالية</Text>
                <TouchableOpacity style={styles.catBtn} onPress={() => setIsCategoryModalVisible(true)}>
                    <Tag size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderColor: '#10b981' + '40' }]}>
                    <TrendingUp size={16} color="#10b981" />
                    <Text style={[styles.statAmount, { color: '#10b981' }]}>{stats.income.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>الإيرادات</Text>
                </View>
                <View style={[styles.statCard, { borderColor: '#ef4444' + '40' }]}>
                    <TrendingDown size={16} color="#ef4444" />
                    <Text style={[styles.statAmount, { color: '#ef4444' }]}>{stats.expense.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>المصروفات</Text>
                </View>
                <View style={[styles.statCard, { borderColor: (stats.net >= 0 ? '#6366f1' : '#f59e0b') + '40' }]}>
                    <DollarSign size={16} color={stats.net >= 0 ? '#6366f1' : '#f59e0b'} />
                    <Text style={[styles.statAmount, { color: stats.net >= 0 ? '#6366f1' : '#f59e0b' }]}>{Math.abs(stats.net).toLocaleString()}</Text>
                    <Text style={styles.statLabel}>{stats.net >= 0 ? 'صافي ربح' : 'عجز'}</Text>
                </View>
            </View>

            {/* Tabs + Add Buttons */}
            <View style={styles.tabBar}>
                {(['OVERVIEW', 'INCOME', 'EXPENSE'] as TabType[]).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'OVERVIEW' ? 'الكل' : tab === 'INCOME' ? 'الإيرادات' : 'المصروفات'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Add Buttons */}
            <View style={styles.addRow}>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#10b981' }]} onPress={() => openAddModal('INCOME')}>
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addBtnText}>إضافة إيراد</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#ef4444' }]} onPress={() => openAddModal('EXPENSE')}>
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addBtnText}>إضافة مصروف</Text>
                </TouchableOpacity>
            </View>

            {/* Records List */}
            {loading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filteredRecords}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const color = getCategoryColor(item.category, item.type);
                        return (
                            <View style={styles.recordCard}>
                                <View style={[styles.recordAccent, { backgroundColor: color }]} />
                                <View style={styles.recordBody}>
                                    <View style={styles.recordTop}>
                                        <Text style={[styles.recordAmount, { color: item.type === 'INCOME' ? '#10b981' : '#ef4444' }]}>
                                            {item.type === 'INCOME' ? '+' : '-'}{item.amount.toLocaleString()} د.ع
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity onPress={() => openEditModal(item)}>
                                                <Pencil size={15} color={COLORS.textMuted} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteRecord(item.id)}>
                                                <Trash2 size={15} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <Text style={styles.recordDesc}>{item.description}</Text>
                                    <View style={styles.recordMeta}>
                                        <View style={[styles.catBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                                            <Text style={[styles.catBadgeText, { color }]}>{getCategoryName(item.category)}</Text>
                                        </View>
                                        <Text style={styles.recordDate}>{item.date}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <DollarSign size={40} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>لا توجد سجلات مالية</Text>
                        </View>
                    }
                />
            )}

            {/* ── Entry Modal ── */}
            <Modal visible={isEntryModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setIsEntryModalVisible(false)}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>
                                {editingRecord
                                    ? (entryType === 'INCOME' ? 'تعديل إيراد' : 'تعديل مصروف')
                                    : (entryType === 'INCOME' ? 'إضافة إيراد جديد' : 'إضافة مصروف جديد')
                                }
                            </Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {/* Type Toggle */}
                        <View style={styles.typeToggle}>
                            <TouchableOpacity
                                style={[styles.typeBtn, entryType === 'INCOME' && { backgroundColor: '#10b981' }]}
                                onPress={() => { setEntryType('INCOME'); setForm(f => ({ ...f, category: '' })); }}
                            >
                                <TrendingUp size={16} color={entryType === 'INCOME' ? '#fff' : COLORS.textMuted} />
                                <Text style={[styles.typeBtnText, entryType === 'INCOME' && { color: '#fff' }]}>إيراد</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, entryType === 'EXPENSE' && { backgroundColor: '#ef4444' }]}
                                onPress={() => { setEntryType('EXPENSE'); setForm(f => ({ ...f, category: '' })); }}
                            >
                                <TrendingDown size={16} color={entryType === 'EXPENSE' ? '#fff' : COLORS.textMuted} />
                                <Text style={[styles.typeBtnText, entryType === 'EXPENSE' && { color: '#fff' }]}>مصروف</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.inputLabel}>المبلغ (د.ع)</Text>
                            <TextInput
                                style={styles.modalInput}
                                keyboardType="numeric"
                                value={form.amount}
                                onChangeText={t => setForm(f => ({ ...f, amount: t }))}
                                textAlign="right"
                                placeholder="0"
                                placeholderTextColor={COLORS.textMuted}
                            />

                            <Text style={styles.inputLabel}>الوصف / البيان</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={form.description}
                                onChangeText={t => setForm(f => ({ ...f, description: t }))}
                                textAlign="right"
                                placeholder="مثال: توريد بضاعة، صيانة..."
                                placeholderTextColor={COLORS.textMuted}
                            />

                            <Text style={styles.inputLabel}>التصنيف</Text>
                            <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsCatPickerVisible(true)}>
                                <ChevronDown size={18} color={COLORS.textMuted} />
                                <Text style={[styles.pickerText, { color: form.category ? COLORS.text : COLORS.textMuted }]}>
                                    {form.category ? getCategoryName(form.category) : 'اختر التصنيف'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.inputLabel}>طريقة الدفع</Text>
                            <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsPaymentPickerVisible(true)}>
                                <ChevronDown size={18} color={COLORS.textMuted} />
                                <Text style={styles.pickerText}>
                                    {PAYMENT_METHODS.find(p => p.value === form.paymentMethod)?.label || 'نقد'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: entryType === 'INCOME' ? '#10b981' : '#ef4444', marginTop: 20 }]}
                                onPress={handleSaveEntry}
                            >
                                <Check size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>{editingRecord ? 'تحديث السجل' : 'حفظ السجل'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>

                {/* Category Picker */}
                <Modal visible={isCatPickerVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsCatPickerVisible(false)}>
                        <View style={styles.pickerContent}>
                            <Text style={styles.pickerTitle}>اختر التصنيف</Text>
                            {categories.filter(c => c.type === entryType).map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.pickerOption, form.category === cat.id && { backgroundColor: cat.color + '20' }]}
                                    onPress={() => { setForm(f => ({ ...f, category: cat.id })); setIsCatPickerVisible(false); }}
                                >
                                    <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                                    <Text style={[styles.pickerOptionText, form.category === cat.id && { color: cat.color, fontWeight: 'bold' }]}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Payment Picker */}
                <Modal visible={isPaymentPickerVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsPaymentPickerVisible(false)}>
                        <View style={styles.pickerContent}>
                            <Text style={styles.pickerTitle}>طريقة الدفع</Text>
                            {PAYMENT_METHODS.map(pm => (
                                <TouchableOpacity
                                    key={pm.value}
                                    style={[styles.pickerOption, form.paymentMethod === pm.value && { backgroundColor: COLORS.primary + '20' }]}
                                    onPress={() => { setForm(f => ({ ...f, paymentMethod: pm.value })); setIsPaymentPickerVisible(false); }}
                                >
                                    <Text style={[styles.pickerOptionText, form.paymentMethod === pm.value && { color: COLORS.primary, fontWeight: 'bold' }]}>{pm.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </Modal>

            {/* ── Category Management Modal ── */}
            <Modal visible={isCategoryModalVisible} animationType="slide">
                <View style={[styles.fullModal, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                            <ArrowRight size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>إدارة التصنيفات المالية</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Add Category */}
                    <View style={styles.catFormBox}>
                        <Text style={styles.catFormTitle}>{editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={catForm.name}
                            onChangeText={t => setCatForm(f => ({ ...f, name: t }))}
                            placeholder="اسم التصنيف..."
                            placeholderTextColor={COLORS.textMuted}
                            textAlign="right"
                        />
                        <View style={styles.typeToggle}>
                            <TouchableOpacity
                                style={[styles.typeBtn, catForm.type === 'INCOME' && { backgroundColor: '#10b981' }]}
                                onPress={() => setCatForm(f => ({ ...f, type: 'INCOME' }))}
                            >
                                <Text style={[styles.typeBtnText, catForm.type === 'INCOME' && { color: '#fff' }]}>إيراد</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, catForm.type === 'EXPENSE' && { backgroundColor: '#ef4444' }]}
                                onPress={() => setCatForm(f => ({ ...f, type: 'EXPENSE' }))}
                            >
                                <Text style={[styles.typeBtnText, catForm.type === 'EXPENSE' && { color: '#fff' }]}>مصروف</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: COLORS.primary }]} onPress={handleSaveCategory}>
                                <Check size={18} color="#fff" />
                                <Text style={styles.saveBtnText}>{editingCategory ? 'تحديث' : 'إضافة'}</Text>
                            </TouchableOpacity>
                            {editingCategory && (
                                <TouchableOpacity
                                    style={[styles.saveBtn, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}
                                    onPress={() => { setEditingCategory(null); setCatForm({ name: '', type: 'EXPENSE' }); }}
                                >
                                    <Text style={[styles.saveBtnText, { color: COLORS.textMuted }]}>إلغاء</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <FlatList
                        data={categories}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: SPACING.md }}
                        renderItem={({ item }) => (
                            <View style={styles.catCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                    <View style={[styles.catDotLarge, { backgroundColor: item.color }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.catName}>{item.name}</Text>
                                        <Text style={[styles.catType, { color: item.type === 'INCOME' ? '#10b981' : '#ef4444' }]}>
                                            {item.type === 'INCOME' ? 'إيراد' : 'مصروف'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        style={[styles.iconBtn, { backgroundColor: COLORS.primary + '20' }]}
                                        onPress={() => { setEditingCategory(item); setCatForm({ name: item.name, type: item.type }); }}
                                    >
                                        <Pencil size={14} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.iconBtn, { backgroundColor: '#ef444420' }]}
                                        onPress={() => {
                                            Alert.alert('حذف التصنيف', 'هل أنت متأكد؟', [
                                                { text: 'إلغاء', style: 'cancel' },
                                                { text: 'حذف', style: 'destructive', onPress: () => setCategories(prev => prev.filter(c => c.id !== item.id)) }
                                            ]);
                                        }}
                                    >
                                        <Trash2 size={14} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
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
    title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    catBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },

    statsRow: { flexDirection: 'row-reverse', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
    statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1 },
    statAmount: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
    statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

    tabBar: { flexDirection: 'row-reverse', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.sm },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
    tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    tabTextActive: { color: '#fff' },

    addRow: { flexDirection: 'row-reverse', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
    addBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: BORDER_RADIUS.md },
    addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    list: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
    recordCard: { flexDirection: 'row-reverse', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    recordAccent: { width: 4 },
    recordBody: { flex: 1, padding: SPACING.md },
    recordTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    recordAmount: { fontSize: 17, fontWeight: 'bold' },
    recordDesc: { color: COLORS.text, fontSize: 14, textAlign: 'right', marginBottom: 8 },
    recordMeta: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
    catBadgeText: { fontSize: 10, fontWeight: 'bold' },
    recordDate: { fontSize: 11, color: COLORS.textMuted },

    empty: { alignItems: 'center', marginTop: 80, gap: 12 },
    emptyText: { color: COLORS.textMuted, fontSize: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    inputLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 6, textAlign: 'right' },
    modalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    pickerTrigger: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    pickerText: { color: COLORS.text, fontSize: 14 },
    saveBtn: { flexDirection: 'row-reverse', height: 52, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    typeToggle: { flexDirection: 'row-reverse', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: 4, gap: 4, marginBottom: SPACING.md },
    typeBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BORDER_RADIUS.sm },
    typeBtnText: { color: COLORS.textMuted, fontWeight: 'bold', fontSize: 14 },

    pickerContent: { backgroundColor: COLORS.surface, margin: 30, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
    pickerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerOption: { flexDirection: 'row-reverse', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
    pickerOptionText: { color: COLORS.text, fontSize: 15 },
    catDot: { width: 12, height: 12, borderRadius: 6 },

    fullModal: { flex: 1, backgroundColor: COLORS.background },
    catFormBox: { margin: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
    catFormTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, textAlign: 'right', marginBottom: SPACING.md },
    catCard: { flexDirection: 'row-reverse', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    catDotLarge: { width: 36, height: 36, borderRadius: 18 },
    catName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
    catType: { fontSize: 11, fontWeight: '600', textAlign: 'right' },
    iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});

export default FinancialManagementScreen;
