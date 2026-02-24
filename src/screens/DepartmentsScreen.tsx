import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layers, ArrowRight, User, Users, ChevronRight, X, Check, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { getSocket } from '../services/socket';

const DepartmentsScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptManager, setNewDeptManager] = useState('');
    const [depts, setDepts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDepts();
        const socket = getSocket();
        if (socket) {
            socket.on('data-update', (data: any) => {
                if (data.key === 'hr_pro_data') fetchDepts();
            });
            return () => socket.off('data-update');
        }
    }, []);

    const fetchDepts = async () => {
        try {
            const res = await api.get('/api/departments');
            setDepts(res.data || []);
        } catch (e) {
            setDepts([
                { id: '1', name: 'تكنولوجيا المعلومات', manager: 'أحمد علي', employees: 12, color: '#3b82f6' },
                { id: '2', name: 'الموارد البشرية', manager: 'سارة محمود', employees: 5, color: '#ec4899' },
                { id: '3', name: 'المحاسبة والمالية', manager: 'محمد جاسم', employees: 8, color: '#10b981' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDept = async () => {
        if (!newDeptName) {
            Alert.alert('خطأ', 'يرجى إدخال اسم القسم');
            return;
        }

        const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#ef4444'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newDept = {
            name: newDeptName,
            manager: newDeptManager || 'غير محدد',
            employees: 0,
            color: randomColor,
        };

        try {
            await api.post('/api/departments', newDept);
            fetchDepts();
            setIsModalVisible(false);
            setNewDeptName('');
            setNewDeptManager('');
            Alert.alert('نجاح', 'تم إضافة القسم الجديد بنجاح');
        } catch (e) {
            Alert.alert('خطأ', 'فشل إضافة القسم');
        }
    };

    const handleDeleteDept = (id: string, name: string) => {
        Alert.alert(
            'حذف القسم',
            `هل تريد حذف قسم ${name}؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/departments/${id}`);
                            fetchDepts();
                        } catch (e) {
                            Alert.alert('خطأ', 'فشل حذف القسم');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} onLongPress={() => handleDeleteDept(item.id, item.name)}>
            <View style={[styles.colorBar, { backgroundColor: item.color }]} />
            <View style={styles.cardContent}>
                <View style={styles.deptInfo}>
                    <Text style={styles.deptName}>{item.name}</Text>
                    <View style={styles.managerRow}>
                        <User size={14} color={COLORS.textMuted} />
                        <Text style={styles.managerName}>المدير: {item.manager}</Text>
                    </View>
                </View>
                <View style={styles.statsContainer}>
                    <View style={styles.empCountBox}>
                        <Users size={16} color={COLORS.primary} />
                        <Text style={styles.empCount}>{item.employees}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteDept(item.id, item.name)}>
                        <Trash2 size={18} color={COLORS.danger + '80'} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>إدارة الأقسام</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
                    <Layers size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={depts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
            />

            {/* Add Department Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>إضافة قسم جديد</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>اسم القسم</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="مثال: قسم الموارد البشرية"
                            value={newDeptName}
                            onChangeText={setNewDeptName}
                            textAlign="right"
                        />

                        <Text style={styles.inputLabel}>اسم مدير القسم (اختياري)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="مثال: سارة محمود"
                            value={newDeptManager}
                            onChangeText={setNewDeptManager}
                            textAlign="right"
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleAddDept}>
                            <Check size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>إنشاء القسم</Text>
                        </TouchableOpacity>
                    </View>
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
    addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    list: { padding: SPACING.lg },
    card: { flexDirection: 'row-reverse', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    colorBar: { width: 6 },
    cardContent: { flex: 1, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
    deptInfo: { alignItems: 'flex-end', flex: 1 },
    deptName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    managerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 4 },
    managerName: { color: COLORS.textMuted, fontSize: 13 },
    statsContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 15 },
    empCountBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    empCount: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.xl },
    modalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl },
    modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    inputLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'right' },
    modalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    saveBtn: { backgroundColor: COLORS.primary, flexDirection: 'row-reverse', height: 50, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default DepartmentsScreen;
