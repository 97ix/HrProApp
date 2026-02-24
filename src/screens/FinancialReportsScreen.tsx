import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, ArrowRight, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

const FinancialReportsScreen = ({ navigation }: { navigation?: any }) => {
    const insets = useSafeAreaInsets();

    const stats = [
        { title: 'إجمالي الرواتب', value: '45,200,000', icon: DollarSign, color: COLORS.primary },
        { title: 'الإيرادات', value: '12,500,000', icon: TrendingUp, color: COLORS.secondary },
        { title: 'المصروفات', value: '8,750,000', icon: TrendingDown, color: COLORS.danger },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>التقارير المالية</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.statsGrid}>
                    {stats.map((stat) => (
                        <View key={stat.title} style={styles.statCard}>
                            <View style={[styles.iconBox, { backgroundColor: stat.color + '20' }]}>
                                <stat.icon size={24} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.title}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>التقارير المتاحة</Text>
                {[
                    { title: 'تقرير الرواتب الشهري', date: 'فبراير 2026' },
                    { title: 'كشف الميزانية العمومية', date: 'الربع الأول 2026' },
                    { title: 'تقرير السلف والقروض', date: '2026' },
                ].map((report) => (
                    <TouchableOpacity key={report.title} style={styles.reportItem}>
                        <View style={styles.reportInfo}>
                            <Text style={styles.reportTitle}>{report.title}</Text>
                            <Text style={styles.reportDate}>{report.date}</Text>
                        </View>
                        <FileText size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
    backButton: { padding: SPACING.xs },
    title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    content: { padding: SPACING.lg },
    statsGrid: { gap: SPACING.md, marginBottom: SPACING.xl },
    statCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    iconBox: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statValue: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
    statLabel: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
    sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.md, textAlign: 'right' },
    reportItem: { flexDirection: 'row-reverse', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 4, borderLeftColor: COLORS.primary },
    reportInfo: { alignItems: 'flex-end' },
    reportTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },
    reportDate: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});

export default FinancialReportsScreen;
