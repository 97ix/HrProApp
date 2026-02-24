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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserCog, ShieldCheck, UserMinus, ArrowRight, ShieldAlert, Check, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { Employee, UserRole } from '../types';

interface ExtendedEmployee extends Employee {
    isFrozen?: boolean;
}

const UserManagerScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [users, setUsers] = useState<ExtendedEmployee[]>([]);
    const [loading, setLoading] = useState(true);

    // States for Role Selection Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const rolesList = [
        { id: UserRole.HR, name: 'مدير النظام (HR)', color: COLORS.danger },
        { id: UserRole.MANAGER, name: 'مدير عام', color: COLORS.primary },
        { id: UserRole.DEPARTMENT_MANAGER, name: 'مدير قسم', color: COLORS.secondary },
        { id: UserRole.EMPLOYEE, name: 'موظف قياسي', color: COLORS.textMuted },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const [usersRes, empRes] = await Promise.all([
                api.get('/api/users'),
                api.get('/api/employees')
            ]);
            setUsers(usersRes.data);
            setEmployees(empRes.data);
        } catch (error) {
            setUsers([
                { id: 'admin_1', name: 'مدير النظام', username: 'admin', role: UserRole.HR, departmentId: 'إدارة' } as any,
                { id: 'mgr_1', name: 'سارة محمد', username: 'sara_mgr', role: UserRole.DEPARTMENT_MANAGER, departmentId: 'المحاسبة' } as any,
                { id: 'emp_1', name: 'أحمد علي', username: 'ahmed_99', role: UserRole.EMPLOYEE, departmentId: 'تكنولوجيا المعلومات' } as any,
            ]);
            setEmployees([
                { id: 'emp_1', name: 'أحمد علي', username: 'ahmed_99' },
                { id: 'emp_2', name: 'خالد وليد', username: 'khaled_w' },
                { id: 'emp_3', name: 'مريم حسن', username: 'maryam_h' },
            ] as any);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (employee: Employee) => {
        try {
            const role = UserRole.EMPLOYEE;
            await api.post('/api/users', { id: employee.id, role, username: employee.username || employee.name });
            const newUser = { ...employee, role };
            setUsers([newUser, ...users]);
            setIsAddModalVisible(false);
            Alert.alert('نجاح', `تم تسجيل ${employee.name} كمستخدم في النظام`);
        } catch (error) {
            Alert.alert('خطأ', 'فشل تسجيل المستخدم في السيرفر');
        }
    };

    const handleFreezeUser = (user: ExtendedEmployee) => {
        const isCurrentlyFrozen = user.isFrozen;
        const alertTitle = isCurrentlyFrozen ? 'إلغاء التجميد' : 'تجميد المستخدم';
        const alertMessage = isCurrentlyFrozen
            ? 'هل أنت متأكد من إلغاء تجميد حساب هذا المستخدم والسماح له بالدخول مجدداً؟'
            : 'هل أنت متأكد من تجميد حساب هذا المستخدم ومنعه من الدخول؟ (سيظل الموظف مسجلاً في النظام)';

        Alert.alert(
            alertTitle,
            alertMessage,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: isCurrentlyFrozen ? 'إلغاء التجميد' : 'تجميد',
                    style: isCurrentlyFrozen ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            const res = await api.put(`/api/users/${user.id}/freeze`);
                            setUsers(users.map(u => u.id === user.id ? { ...u, isFrozen: res.data.isFrozen } : u));
                            Alert.alert('نجاح', isCurrentlyFrozen ? 'تم إلغاء التجميد بنجاح' : 'تم تجميد حساب المستخدم بنجاح');
                        } catch (error) {
                            Alert.alert('خطأ', 'فشل تغيير حالة المستخدم');
                        }
                    }
                }
            ]
        );
    };

    const handleOpenRoleModal = (user: Employee) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

    const handleSelectRole = async (roleId: UserRole) => {
        if (!selectedUser) return;

        try {
            await api.put(`/api/users/${selectedUser.id}/role`, { role: roleId });

            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id ? { ...u, role: roleId } : u
            ));

            setModalVisible(false);
            Alert.alert('تم التحديث', `تم تغيير دور ${selectedUser.name} بنجاح.`);
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحديث الدور في السيرفر');
        }
    };

    const getRoleName = (role?: string) => {
        switch (role) {
            case UserRole.HR: return 'مدير النظام';
            case UserRole.MANAGER: return 'مدير عام';
            case UserRole.DEPARTMENT_MANAGER: return 'مدير قسم';
            case UserRole.EMPLOYEE: return 'موظف';
            default: return 'غير محدد';
        }
    };

    const renderItem = ({ item }: { item: Employee }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userHandle}>@{item.username}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: item.role === UserRole.HR ? COLORS.danger + '20' : COLORS.primary + '20' }]}>
                    <Text style={[styles.roleText, { color: item.role === UserRole.HR ? COLORS.danger : COLORS.primary }]}>
                        {getRoleName(item.role)}
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: COLORS.primary }]}
                    onPress={() => handleOpenRoleModal(item)}
                >
                    <ShieldCheck size={16} color={COLORS.primary} />
                    <Text style={[styles.actionText, { color: COLORS.primary }]}>الصلاحيات</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, {
                        borderColor: item.isFrozen ? COLORS.warning : COLORS.danger,
                        backgroundColor: item.isFrozen ? COLORS.warning + '15' : COLORS.danger + '10'
                    }]}
                    onPress={() => handleFreezeUser(item)}
                >
                    <UserMinus size={16} color={item.isFrozen ? COLORS.warning : COLORS.danger} />
                    <Text style={[styles.actionText, { color: item.isFrozen ? COLORS.warning : COLORS.danger }]}>
                        {item.isFrozen ? 'الحساب مجمد' : 'تجميد الحساب'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>إدارة المستخدمين</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
                    <UserCog size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} animating={true} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {/* Role Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>اختيار الصلاحية</Text>
                            <Text style={styles.modalSubtitle}>للمستخدم: {selectedUser?.name}</Text>
                        </View>

                        {rolesList.map((role) => (
                            <TouchableOpacity
                                key={role.id}
                                style={[
                                    styles.roleOption,
                                    selectedUser?.role === role.id && styles.selectedRoleOption
                                ]}
                                onPress={() => handleSelectRole(role.id)}
                            >
                                <View style={styles.roleOptionTextContent}>
                                    <Text style={[
                                        styles.roleOptionName,
                                        selectedUser?.role === role.id && { color: COLORS.primary }
                                    ]}>{role.name}</Text>
                                </View>
                                {selectedUser?.role === role.id && (
                                    <View style={styles.checkBadge}>
                                        <Check size={16} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeModalBtnText}>إلغاء</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add User Modal */}
            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>إضافة مستخدم جديد</Text>
                            <Text style={styles.modalSubtitle}>اختر من الموظفين المسجلين</Text>
                        </View>

                        <FlatList
                            data={employees.filter(e => !users.find(u => u.id === e.id))}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.roleOption} onPress={() => handleAddUser(item)}>
                                    <View style={styles.roleOptionTextContent}>
                                        <Text style={styles.roleOptionName}>{item.name}</Text>
                                        <Text style={styles.userHandle}>@{item.username}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.textMuted }}>لا يوجد موظفين غير مسجلين حالياً</Text>}
                        />

                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setIsAddModalVisible(false)}
                        >
                            <Text style={styles.closeModalBtnText}>إلغاء</Text>
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
    card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    userInfo: { alignItems: 'flex-end' },
    userName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    userHandle: { color: COLORS.textMuted, fontSize: 12 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    roleText: { fontSize: 11, fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
    actionBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: BORDER_RADIUS.md, gap: 4, borderWidth: 1 },
    actionText: { fontWeight: 'bold', fontSize: 11 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: SPACING.xl,
        paddingBottom: 40,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    roleOption: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedRoleOption: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '05',
    },
    roleOptionTextContent: {
        alignItems: 'flex-end',
    },
    roleOptionName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeModalBtn: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        alignItems: 'center',
    },
    closeModalBtnText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default UserManagerScreen;
