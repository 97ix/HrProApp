import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Phone, Mail, MapPin, Briefcase, Calendar, Shield, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { Employee } from '../types';

const ProfileScreen = ({ user, navigation }: { user: any, navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get(`/employees/${user.id}`);
            setProfile(response.data);
        } catch (error) {
            setProfile({
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                phoneNumber: '07701234567',
                departmentId: 'تكنولوجيا المعلومات',
                salary: 1500000,
                hireDate: '2024-01-15',
                leaveBalance: 14,
            } as any);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary} animating={true} />
            </View>
        );
    }

    const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
        <View style={styles.infoRow}>
            <View style={styles.infoRight}>
                <View style={styles.iconContainer}>
                    <Icon size={18} color={COLORS.primary} />
                </View>
                <View>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.headerNav}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation?.navigate('Dashboard')}
                >
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>الملف الشخصي</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{profile?.name[0]}</Text>
                        </View>
                        <View style={styles.onlineStatus} />
                    </View>
                    <Text style={styles.name}>{profile?.name}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{profile?.role === 'HR' ? 'مسؤول النظام' : 'موظف'}</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>رصيد الإجازات</Text>
                        <Text style={styles.statValue}>{profile?.leaveBalance} يوم</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>تاريخ التعيين</Text>
                        <Text style={styles.statValue}>{profile?.hireDate}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
                    <View style={styles.card}>
                        <InfoRow icon={User} label="اسم المستخدم" value={`@${profile?.username}`} />
                        <View style={styles.divider} />
                        <InfoRow icon={Phone} label="رقم الهاتف" value={profile?.phoneNumber || 'غير مسجل'} />
                        <View style={styles.divider} />
                        <InfoRow icon={Briefcase} label="القسم" value={profile?.departmentId || 'غير محدد'} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>الحساب والأمان</Text>
                    <View style={styles.card}>
                        <InfoRow icon={Shield} label="نوع الحساب" value={profile?.role === 'HR' ? 'مدير (HR)' : 'موظف قياسي'} />
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation?.navigate('Login')}>
                    <Text style={styles.logoutBtnText}>تغيير الحساب</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerNav: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    backButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: SPACING.lg,
    },
    profileHeader: {
        alignItems: 'center',
        marginVertical: SPACING.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarText: {
        color: COLORS.primary,
        fontSize: 40,
        fontWeight: 'bold',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.secondary,
        borderWidth: 3,
        borderColor: COLORS.background,
    },
    name: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    roleBadge: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 15,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 8,
    },
    roleText: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row-reverse',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.border,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
        textAlign: 'right',
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    infoRow: {
        padding: SPACING.md,
    },
    infoRight: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoLabel: {
        color: COLORS.textMuted,
        fontSize: 11,
        textAlign: 'right',
    },
    infoValue: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.md,
    },
    logoutBtn: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.danger + '40',
        marginTop: SPACING.lg,
    },
    logoutBtnText: {
        color: COLORS.danger,
        fontWeight: 'bold',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});

export default ProfileScreen;
