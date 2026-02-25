import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, UserPlus, Phone, Briefcase, ArrowRight, Trash2, X, Check, ChevronDown, Lock, User, Send, Edit2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Employee, UserRole, Department } from '../types';

const EmployeeListScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isPickerVisible, setIsPickerVisible] = useState<'dept' | 'role' | null>(null);

    const [newEmployee, setNewEmployee] = useState({
        name: '',
        phoneNumber: '',
        role: UserRole.EMPLOYEE,
        salary: '',
        departmentId: '',
        workingHours: '8',
        username: '',
        password: '',
        telegramChatId: '',
    });

    const [roles, setRoles] = useState<any[]>([
        { id: UserRole.HR, name: 'HR / مدير نظام' },
        { id: UserRole.MANAGER, name: 'مدير عام' },
        { id: UserRole.DEPARTMENT_MANAGER, name: 'مدير قسم' },
        { id: UserRole.SUPERVISOR, name: 'مشرف' },
        { id: UserRole.CASHIER, name: 'كاشير' },
        { id: UserRole.DATA_ENTRY, name: 'مدخل بيانات' },
        { id: UserRole.EMPLOYEE, name: 'موظف' },
    ]);

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
            const [empRes, deptRes, rolesRes] = await Promise.all([
                api.get('/api/employees'),
                api.get('/api/departments'),
                api.get('/api/roles').catch(() => ({ data: [] }))
            ]);
            setEmployees(empRes.data);
            setDepartments(deptRes.data);
            if (rolesRes.data && rolesRes.data.length > 0) {
                setRoles(rolesRes.data.map((r: any) => ({
                    id: r.id,
                    name: r.nameAr || r.nameEn || r.id
                })));
            }
            if (deptRes.data.length > 0) {
                setNewEmployee(prev => ({ ...prev, departmentId: deptRes.data[0].id }));
            }
        } catch (error) {
            setEmployees([]);
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setNewEmployee({
            name: '',
            phoneNumber: '',
            role: UserRole.EMPLOYEE,
            salary: '',
            departmentId: departments[0]?.id || '',
            workingHours: '8',
            username: '',
            password: '',
            telegramChatId: '',
        });
        setIsAddModalVisible(true);
    };

    const openEditModal = (emp: any) => {
        setIsEditMode(true);
        setEditingId(emp.id);
        setNewEmployee({
            name: emp.name || '',
            phoneNumber: (emp.phoneNumber || '').toString(),
            role: emp.role || UserRole.EMPLOYEE,
            salary: (emp.salary || '').toString(),
            departmentId: emp.departmentId || departments[0]?.id || '',
            workingHours: (emp.workingHours || '8').toString(),
            username: emp.username || '',
            password: '', // اتركها فارغة إذا لم يرد تغييرها
            telegramChatId: (emp.telegramChatId || '').toString(),
        });
        setIsAddModalVisible(true);
    };

    const handleSaveEmployee = async () => {
        const { name, phoneNumber, salary, username, password } = newEmployee;

        // التحقق من الحقول الأساسية (الباسورد مطلوب فقط في الإضافة)
        let isBasicValid = false;
        if (isEditMode) {
            isBasicValid = !!(name && phoneNumber && salary && username);
        } else {
            isBasicValid = !!(name && phoneNumber && salary && username && password);
        }

        if (!isBasicValid) {
            Alert.alert('خطأ', `يرجى ملء كافة الحقول الأساسية المطلوبة${!isEditMode ? ' (بما فيها الباسورد)' : ''}`);
            return;
        }

        try {
            if (isEditMode && editingId) {
                const employeeToUpdate: any = {
                    ...newEmployee,
                    salary: Number(salary),
                    workingHours: Number(newEmployee.workingHours),
                };
                if (!password) delete employeeToUpdate.password;

                await api.put(`/api/employees/${editingId}`, employeeToUpdate);
                setEmployees(employees.map(e => e.id === editingId ? { ...e, ...employeeToUpdate } : e));
                Alert.alert('نجاح', 'تم تعديل الموظف بنجاح');
            } else {
                const employeeToAdd: Employee = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...newEmployee,
                    salary: Number(salary),
                    workingHours: Number(newEmployee.workingHours),
                    hireDate: new Date().toISOString().split('T')[0],
                    contractExpiry: '',
                    documents: [],
                    leaveBalance: 20,
                } as any;

                await api.post('/api/employees', employeeToAdd);
                setEmployees([employeeToAdd, ...employees]);
                Alert.alert('نجاح', 'تم إضافة الموظف بنجاح');
            }
            setIsAddModalVisible(false);
        } catch (error) {
            Alert.alert('خطأ', 'فشل حفظ بيانات الموظف في السيرفر');
        }
    };

    const handleDeleteEmployee = (id: string, name: string) => {
        Alert.alert(
            'حذف الموظف',
            `هل أنت متأكد من حذف ${name}؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/employees/${id}`);
                            setEmployees(employees.filter(emp => emp.id !== id));
                        } catch (e) {
                            Alert.alert('خطأ', 'فشل الحذف من السيرفر');
                        }
                    }
                }
            ]
        );
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) && emp.role !== UserRole.HR
    );

    const getDeptName = (id: string) => {
        if (!departments || !Array.isArray(departments)) return 'غير محدد';
        return departments.find(d => d.id === id)?.name || 'غير محدد';
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>إدارة الموظفين</Text>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <UserPlus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="بحث عن موظف..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} animating={true} />
                </View>
            ) : (
                <FlatList
                    data={filteredEmployees}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardContent}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    <View style={styles.detailsRow}>
                                        <Briefcase size={12} color={COLORS.textMuted} />
                                        <Text style={styles.detailText}>{getDeptName(item.departmentId)}</Text>
                                        <View style={styles.divider} />
                                        <Phone size={12} color={COLORS.textMuted} />
                                        <Text style={styles.detailText}>{item.phoneNumber}</Text>
                                    </View>
                                </View>
                                <View style={styles.actionsContainer}>
                                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                                        <Edit2 size={18} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteEmployee(item.id, item.name)} style={styles.actionBtn}>
                                        <Trash2 size={18} color={COLORS.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {/* Enhanced Add Employee Modal */}
            <Modal animationType="slide" transparent={true} visible={isAddModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{isEditMode ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <Text style={styles.inputLabel}>الاسم الكامل</Text>
                            <TextInput style={styles.modalInput} placeholder="الاسم الثلاثي" value={newEmployee.name} onChangeText={t => setNewEmployee({ ...newEmployee, name: t, username: t.split(' ')[0] })} textAlign="right" />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.inputLabel}>رقم الهاتف</Text>
                                    <TextInput style={styles.modalInput} placeholder="07XXXXXXXXX" keyboardType="phone-pad" value={newEmployee.phoneNumber} onChangeText={t => setNewEmployee({ ...newEmployee, phoneNumber: t })} textAlign="right" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>الراتب (د.ع)</Text>
                                    <TextInput style={styles.modalInput} placeholder="1,000,000" keyboardType="numeric" value={newEmployee.salary} onChangeText={t => setNewEmployee({ ...newEmployee, salary: t })} textAlign="right" />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>القسم</Text>
                            <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsPickerVisible('dept')}>
                                <Text style={styles.pickerText}>{getDeptName(newEmployee.departmentId)}</Text>
                                <ChevronDown size={20} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <Text style={styles.inputLabel}>الصلاحية / الدور</Text>
                            <TouchableOpacity style={styles.pickerTrigger} onPress={() => setIsPickerVisible('role')}>
                                <Text style={styles.pickerText}>{roles.find(r => r.id === newEmployee.role)?.name}</Text>
                                <ChevronDown size={20} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.inputLabel}>اسم المستخدم</Text>
                                    <View style={styles.inputIconWrapper}>
                                        <User size={16} color={COLORS.textMuted} />
                                        <TextInput style={[styles.modalInput, { marginBottom: 0, flex: 1 }]} value={newEmployee.username} onChangeText={t => setNewEmployee({ ...newEmployee, username: t })} textAlign="right" />
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>كلمة السر {isEditMode ? '(اختياري)' : ''}</Text>
                                    <View style={styles.inputIconWrapper}>
                                        <Lock size={16} color={COLORS.textMuted} />
                                        <TextInput style={[styles.modalInput, { marginBottom: 0, flex: 1 }]} secureTextEntry value={newEmployee.password} onChangeText={t => setNewEmployee({ ...newEmployee, password: t })} textAlign="right" />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.inputLabel}>ساعات العمل</Text>
                                    <TextInput style={styles.modalInput} keyboardType="numeric" value={newEmployee.workingHours} onChangeText={t => setNewEmployee({ ...newEmployee, workingHours: t })} textAlign="right" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>معرف التلكرام (اختياري)</Text>
                                    <View style={styles.inputIconWrapper}>
                                        <Send size={16} color={COLORS.textMuted} />
                                        <TextInput style={[styles.modalInput, { marginBottom: 0, flex: 1 }]} placeholder="1234567" keyboardType="numeric" value={newEmployee.telegramChatId} onChangeText={t => setNewEmployee({ ...newEmployee, telegramChatId: t })} textAlign="right" />
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.saveBtn, { marginTop: 20 }]} onPress={handleSaveEmployee}>
                                <Check size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>{isEditMode ? 'تحديث البيانات' : 'حفظ الموظف'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>

                {/* Internal Picker Modals */}
                <Modal visible={!!isPickerVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsPickerVisible(null)}>
                        <View style={styles.pickerContent}>
                            {isPickerVisible === 'dept' ? (
                                departments.map(d => (
                                    <TouchableOpacity key={d.id} style={styles.pickerOption} onPress={() => { setNewEmployee({ ...newEmployee, departmentId: d.id }); setIsPickerVisible(null); }}>
                                        <Text style={styles.pickerOptionText}>{d.name}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                roles.map(r => (
                                    <TouchableOpacity key={r.id} style={styles.pickerOption} onPress={() => { setNewEmployee({ ...newEmployee, role: r.id }); setIsPickerVisible(null); }}>
                                        <Text style={styles.pickerOptionText}>{r.name}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </TouchableOpacity>
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
    searchContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.md, height: 50, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    searchInput: { flex: 1, color: COLORS.text, textAlign: 'right', marginRight: SPACING.sm },
    list: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
    card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    cardContent: { flexDirection: 'row-reverse', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.md },
    avatarText: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' },
    info: { flex: 1, alignItems: 'flex-end' },
    name: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    detailsRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
    detailText: { color: COLORS.textMuted, fontSize: 12 },
    divider: { width: 1, height: 10, backgroundColor: COLORS.border, marginHorizontal: 4 },
    actionsContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    actionBtn: { padding: 8, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    modalContent: { backgroundColor: COLORS.surface, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    inputLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 6, textAlign: 'right' },
    modalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    row: { flexDirection: 'row-reverse' },
    pickerTrigger: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    pickerText: { color: COLORS.text, fontSize: 14 },
    inputIconWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, marginBottom: SPACING.md },
    saveBtn: { backgroundColor: COLORS.primary, flexDirection: 'row-reverse', height: 55, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    pickerContent: { backgroundColor: COLORS.surface, margin: 40, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
    pickerOption: { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerOptionText: { textAlign: 'center', fontSize: 16, color: COLORS.text },
});

export default EmployeeListScreen;
