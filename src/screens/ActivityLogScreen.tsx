import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { History, ArrowRight, User, Clock, Info } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { AuditLogEntry } from '../types';

const ActivityLogScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/audit-logs');
            setLogs(response.data);
        } catch (error) {
            setLogs([
                { id: '1', timestamp: '2026-02-23 10:30', actorName: 'مدير النظام', action: 'تعديل راتب', details: 'تعديل راتب الموظف أحمد علي' } as any,
                { id: '2', timestamp: '2026-02-23 09:15', actorName: 'سارة محمد', action: 'تسجيل دخول', details: 'قامت بتسجيل الدخول من جهاز جديد' } as any,
                { id: '3', timestamp: '2026-02-22 16:45', actorName: 'مدير النظام', action: 'إضافة موظف', details: 'إضافة الموظف الجديد: محمد جاسم' } as any,
            ]);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: AuditLogEntry }) => (
        <View style={styles.logCard}>
            <View style={styles.logHeader}>
                <View style={styles.actorInfo}>
                    <User size={14} color={COLORS.primary} />
                    <Text style={styles.actorName}>{item.actorName}</Text>
                </View>
                <View style={styles.timeInfo}>
                    <Clock size={12} color={COLORS.textMuted} />
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
            </View>
            <Text style={styles.actionTitle}>{item.action}</Text>
            <Text style={styles.detailsText}>{item.details}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>السجل والأنشطة</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} animating={true} />
                </View>
            ) : (
                <FlatList
                    data={logs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
    backButton: { padding: SPACING.xs },
    title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    list: { padding: SPACING.lg },
    logCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
    logHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 },
    actorInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
    actorName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
    timeInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    timestamp: { color: COLORS.textMuted, fontSize: 11 },
    actionTitle: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 },
    detailsText: { color: COLORS.text, fontSize: 13, textAlign: 'right', opacity: 0.8 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default ActivityLogScreen;
