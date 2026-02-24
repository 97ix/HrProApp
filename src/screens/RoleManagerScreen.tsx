import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, ArrowRight, Plus, X, Check, Edit2, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { Role, Permission } from '../types';

const RoleManagerScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const [roleForm, setRoleForm] = useState({
        nameAr: '',
        nameEn: '',
        color: COLORS.primary,
        permissions: [] as Permission[],
    });

    const allPermissions = Object.values(Permission);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            setRoles([
                { id: '1', nameAr: 'مدير عام', nameEn: 'General Manager', color: '#ef4444', permissions: [Permission.VIEW_ALL_EMPLOYEES, Permission.MANAGE_SETTINGS], isSystem: true },
                { id: '2', nameAr: 'موظف', nameEn: 'Employee', color: '#3b82f6', permissions: [Permission.VIEW_OWN_PROFILE], isSystem: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (perm: Permission) => {
        setRoleForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    const handleSaveRole = () => {
        if (!roleForm.nameAr || !roleForm.nameEn) {
            Alert.alert('خطأ', 'يرجى ملء الأسماء بالعربية والإنجليزية');
            return;
        }

        if (editingRole) {
            setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...roleForm } : r));
        } else {
            const newRole: Role = {
                id: Math.random().toString(),
                ...roleForm,
                isSystem: false,
            };
            setRoles([...roles, newRole]);
        }

        setIsModalVisible(false);
        setEditingRole(null);
        setRoleForm({ nameAr: '', nameEn: '', color: COLORS.primary, permissions: [] });
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setRoleForm({
            nameAr: role.nameAr,
            nameEn: role.nameEn,
            color: role.color,
            permissions: role.permissions,
        });
        setIsModalVisible(true);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>إدارة الصلاحيات</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={roles}
                keyExtractor={item => item.id?.toString()}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <View style={styles.roleCard}>
                        <View style={[styles.roleColorStrip, { backgroundColor: item.color }]} />
                        <View style={styles.roleInfo}>
                            <Text style={styles.roleNameAr}>{item.nameAr}</Text>
                            <Text style={styles.roleNameEn}>{item.nameEn}</Text>
                            <Text style={styles.permCount}>{(item.permissions || []).length} صلاحية</Text>
                        </View>
                        <View style={styles.roleActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
                                <Edit2 size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                            {!item.isSystem && (
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Trash2 size={18} color={COLORS.danger} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            />

            <Modal visible={isModalVisible} animationType="slide">
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <X size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{editingRole ? 'تعديل الصلاحية' : 'إضافة صلاحية جديدة'}</Text>
                        <TouchableOpacity onPress={handleSaveRole}>
                            <Check size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <Text style={styles.inputLabel}>الاسم بالعربية</Text>
                        <TextInput style={styles.input} value={roleForm.nameAr} onChangeText={t => setRoleForm({ ...roleForm, nameAr: t })} textAlign="right" />

                        <Text style={styles.inputLabel}>الاسم بالإنجليزية</Text>
                        <TextInput style={styles.input} value={roleForm.nameEn} onChangeText={t => setRoleForm({ ...roleForm, nameEn: t })} textAlign="left" />

                        <Text style={styles.inputLabel}>تحديد الصلاحيات</Text>
                        <View style={styles.permGrid}>
                            {allPermissions.map((perm, index) => (
                                <TouchableOpacity
                                    key={`perm-${perm}-${index}`}
                                    style={[styles.permItem, roleForm.permissions.includes(perm) && styles.permItemActive]}
                                    onPress={() => togglePermission(perm)}
                                >
                                    <View style={[styles.checkbox, roleForm.permissions.includes(perm) && styles.checkboxActive]}>
                                        {roleForm.permissions.includes(perm) && <Check size={12} color="#fff" />}
                                    </View>
                                    <Text style={[styles.permText, roleForm.permissions.includes(perm) && styles.permTextActive]}>{perm.replace(/_/g, ' ')}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
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
    roleCard: { flexDirection: 'row-reverse', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    roleColorStrip: { width: 6 },
    roleInfo: { flex: 1, padding: SPACING.md, alignItems: 'flex-end' },
    roleNameAr: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    roleNameEn: { fontSize: 12, color: COLORS.textMuted },
    permCount: { fontSize: 11, color: COLORS.primary, marginTop: 4, fontWeight: 'bold' },
    roleActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm },
    actionBtn: { padding: 10 },

    modalContainer: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalBody: { padding: SPACING.lg },
    inputLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: COLORS.text, textAlign: 'right' },
    input: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    permGrid: { gap: 10 },
    permItem: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
    permItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: COLORS.border, marginLeft: 12, alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    permText: { fontSize: 13, color: COLORS.text, flex: 1, textAlign: 'right' },
    permTextActive: { color: COLORS.primary, fontWeight: 'bold' },
});

export default RoleManagerScreen;
