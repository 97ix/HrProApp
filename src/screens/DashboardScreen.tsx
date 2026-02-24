import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Platform,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Users,
    Calendar,
    Wallet,
    Settings,
    LogOut,
    Bell,
    Clock,
    TrendingUp,
    AlertCircle,
    UserCog,
    History,
    FileText,
    Layers,
    HandCoins,
    Shield,
    UserCircle,
    UserCircle as UserIcon,
    X,
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { getSocket } from '../services/socket';

const DashboardScreen = ({ user, onLogout, navigation }: { user: any, onLogout: () => void, navigation: any }) => {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifVisible, setIsNotifVisible] = useState(false);
    const [stats, setStats] = useState({ totalEmployees: 0, presentToday: 0, pendingLeaves: 0 });

    const isAdmin = Boolean(user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'DEPT_MGR' || user?.role === 'DEPARTMENT_MANAGER');

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
        fetchStats();
        setTimeout(() => setRefreshing(false), 1500);
    }, []);

    const fetchNotifications = async () => {
        try {
            const params: any = {};
            if (user?.id) params.userId = user.id;
            if (user?.role) params.role = user.role;
            const res = await api.get('/api/notifications', { params });
            setNotifications(res.data);
        } catch (e) {
            console.error('Fetch Notifications Error:', e);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/api/notifications/read-all', { userId: user?.id, role: user?.role });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) {
            console.error('Mark all read error:', e);
        }
    };

    const fetchStats = async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/api/dashboard/stats');
            setStats(res.data);
        } catch (e) {
            console.error('Fetch Stats Error:', e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchStats();
        const socket = getSocket();
        if (socket) {
            socket.on('new-notification', (notif: any) => {
                // فلتر الإشعار قبل إضافته بناءً على دور المستخدم
                const isAdminNotif = !notif.userId; // إشعار عام للمدراء
                const isPersonalNotif = notif.userId === user?.id; // إشعار شخصي
                const userIsAdmin = Boolean(
                    user?.role === 'HR' || user?.role === 'MANAGER' ||
                    user?.role === 'DEPT_MGR' || user?.role === 'DEPARTMENT_MANAGER'
                );

                if (isPersonalNotif || (userIsAdmin && isAdminNotif)) {
                    setNotifications(prev => [notif, ...prev].slice(0, 50));
                }
            });
            socket.on('data-update', () => {
                fetchNotifications();
                fetchStats();
            });
            return () => {
                socket.off('new-notification');
                socket.off('data-update');
            };
        }
    }, []);


    interface MenuItem {
        id?: string;
        title: string;
        icon: any;
        color: string;
        screen?: string;
    }

    const adminMenu: MenuItem[] = [
        { id: '1', title: 'إدارة الموظفين', icon: Users, color: '#3b82f6', screen: 'Employees' },
        { id: '2', title: 'إدارة المستخدمين', icon: UserCircle, color: '#10b981', screen: 'UserManager' },
        { id: '11', title: 'إدارة الصلاحيات', icon: Shield, color: '#f59e0b', screen: 'RoleManager' },
        { id: '3', title: 'كشوفات الرواتب', icon: Wallet, color: '#8b5cf6', screen: 'Payroll' },
        { id: '4', title: 'الأقسام', icon: Layers, color: '#ec4899', screen: 'Departments' },
        { id: '5', title: 'الحضور', icon: Clock, color: '#10b981', screen: 'Attendance' },
        { id: '6', title: 'الإجازات', icon: Calendar, color: '#f59e0b', screen: 'Leaves' },
        { id: '7', title: 'إدارة مالية', icon: Wallet, color: '#059669', screen: 'FinancialManagement' },
        { id: '8', title: 'التقارير المالية', icon: FileText, color: '#f97316', screen: 'FinancialReports' },
        { id: '9', title: 'السلف والقروض', icon: HandCoins, color: '#0ea5e9', screen: 'Loans' },
        { id: '10', title: 'الزيادة والخصم', icon: AlertCircle, color: '#ef4444', screen: 'Deductions' },
        { id: '12', title: 'السجل والأنشطة', icon: History, color: '#64748b', screen: 'ActivityLogs' },
        { id: '13', title: 'الإعدادات', icon: Settings, color: COLORS.primary, screen: 'Settings' },
    ];

    const employeeMenu: MenuItem[] = [
        { title: 'سجل الحضور', icon: Clock, color: '#10b981', screen: 'Attendance' },
        { title: 'طلباتي', icon: Calendar, color: '#f59e0b', screen: 'Leaves' },
        { title: 'كشف الراتب', icon: Wallet, color: '#6366f1', screen: 'Payroll' },
        { title: 'البروفايل', icon: Users, color: '#3b82f6', screen: 'Profile' },
    ];

    const menuItems = isAdmin ? adminMenu : employeeMenu;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
                        <LogOut size={24} color={COLORS.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setIsNotifVisible(true)}>
                        <Bell size={24} color={COLORS.text} />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <View style={[styles.badge, { position: 'absolute', top: 2, right: 2, backgroundColor: COLORS.danger, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }]}>
                                <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                                    {notifications.filter(n => !n.read).length > 99 ? '99+' : notifications.filter(n => !n.read).length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.welcomeText}>مرحباً بك،</Text>
                    <Text style={styles.userName}>{user?.name || 'المدير'}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{isAdmin ? 'مسؤول النظام' : 'موظف'}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={Boolean(refreshing)}
                        onRefresh={onRefresh}
                        enabled={true}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {isAdmin && (
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Users size={20} color={COLORS.primary} />
                            <Text style={styles.statValue}>{stats.totalEmployees}</Text>
                            <Text style={styles.statLabel}>إجمالي الموظفين</Text>
                        </View>
                        <View style={styles.statCard}>
                            <TrendingUp size={20} color={COLORS.secondary} />
                            <Text style={styles.statValue}>{stats.presentToday}</Text>
                            <Text style={styles.statLabel}>حاضرون اليوم</Text>
                        </View>
                        <View style={styles.statCard}>
                            <AlertCircle size={20} color={COLORS.accent} />
                            <Text style={styles.statValue}>{stats.pendingLeaves}</Text>
                            <Text style={styles.statLabel}>طلبات معلقة</Text>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>الوصول السريع</Text>
                <View style={styles.grid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.title}
                            style={styles.gridItem}
                            onPress={() => item.screen && navigation.navigate(item.screen)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                <item.icon size={28} color={item.color} />
                            </View>
                            <Text style={styles.gridTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {!isAdmin && (
                    <>
                        <Text style={styles.sectionTitle}>آخر النشاطات</Text>
                        <View style={styles.recentActivity}>
                            {notifications.slice(0, 5).map((notif) => (
                                <View key={notif.id} style={styles.activityItem}>
                                    <View style={styles.activityInfo}>
                                        <Text style={styles.activityTitle}>{notif.title}</Text>
                                        <Text style={styles.activityDate}>{notif.body}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Notifications Modal */}
            <Modal visible={isNotifVisible} animationType="slide" transparent={false}>
                <View style={[styles.modalNotifContainer, { paddingTop: insets.top }]}>
                    <View style={styles.modalNotifHeader}>
                        <TouchableOpacity onPress={() => setIsNotifVisible(false)}>
                            <X size={28} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalNotifTitle}>تنبيهات النظام</Text>
                        <TouchableOpacity onPress={markAllRead} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: COLORS.primary + '20', borderRadius: 8 }}>
                            <Text style={{ color: COLORS.primary, fontSize: 10, fontWeight: 'bold' }}>{'قراءة الكل'}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
                        {notifications.map((notif) => (
                            <View key={notif.id} style={styles.notifCard}>
                                <View style={[styles.notifTypeBorder, { backgroundColor: notif.type === 'SECURITY' ? COLORS.danger : (notif.type === 'ATTENDANCE' ? COLORS.secondary : COLORS.primary) }]} />
                                <View style={styles.notifContent}>
                                    <View style={styles.notifHeaderRow}>
                                        <Text style={styles.notifTitleText}>{notif.title}</Text>
                                        <Text style={styles.notifTimeText}>{new Date(notif.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                    <Text style={styles.notifBodyText}>{notif.body}</Text>
                                    <Text style={styles.notifDateText}>{new Date(notif.timestamp).toLocaleDateString('ar-SA')}</Text>
                                </View>
                            </View>
                        ))}
                        {notifications.length === 0 && (
                            <View style={styles.emptyNotif}>
                                <Bell size={48} color={COLORS.border} />
                                <Text style={styles.emptyText}>لا توجد تنبيهات جديدة</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    userInfo: {
        alignItems: 'flex-end',
    },
    welcomeText: {
        color: COLORS.textMuted,
        fontSize: 14,
    },
    userName: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: 'bold',
    },
    roleBadge: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    roleText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    content: {
        padding: SPACING.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        color: COLORS.textMuted,
        fontSize: 9,
        textAlign: 'center',
        marginTop: 4,
    },
    statValue: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
        textAlign: 'right',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    gridItem: {
        width: '47%',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modalNotifContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalNotifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalNotifTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    notifCard: {
        flexDirection: 'row-reverse',
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    notifTypeBorder: {
        width: 6,
    },
    notifContent: {
        flex: 1,
        padding: SPACING.md,
        alignItems: 'flex-end',
    },
    notifHeaderRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 4,
    },
    notifTitleText: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    notifTimeText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    notifBodyText: {
        color: COLORS.text,
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'right',
    },
    notifDateText: {
        color: COLORS.textMuted,
        fontSize: 11,
    },
    emptyNotif: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        opacity: 0.5,
    },
    emptyText: {
        color: COLORS.textMuted,
        marginTop: 10,
        fontSize: 16,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.danger,
        borderWidth: 1.5,
        borderColor: COLORS.surface,
    },
    recentActivity: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activityItem: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'flex-end',
    },
    activityInfo: {
        alignItems: 'flex-end',
    },
    activityTitle: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 2,
    },
    activityDate: {
        color: COLORS.textMuted,
        fontSize: 13,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    gridTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    notifTime: {
        fontSize: 9,
        color: COLORS.textMuted,
        marginTop: 4,
    }
});

export default DashboardScreen;
