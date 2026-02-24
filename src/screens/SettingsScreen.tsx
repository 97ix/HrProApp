import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Settings,
    ArrowRight,
    Lock,
    Send,
    Database,
    Bell,
    Moon,
    Languages,
    LogOut,
    Check,
    X
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

const SettingsScreen = ({ navigation, user }: { navigation?: any, user?: any }) => {
    const insets = useSafeAreaInsets();

    // UI States
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [isBackingUp, setIsBackingUp] = useState(false);

    const handleUpdatePassword = () => {
        if (!passwords.old || !passwords.new || !passwords.confirm) {
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
            return;
        }
        if (passwords.new !== passwords.confirm) {
            Alert.alert('خطأ', 'كلمة السر الجديدة غير متطابقة');
            return;
        }

        setIsPasswordModalVisible(false);
        setPasswords({ old: '', new: '', confirm: '' });
        Alert.alert('نجاح', 'تم تغيير كلمة السر بنجاح');
    };

    const handleBackup = (type: 'TELEGRAM' | 'LOCAL') => {
        setIsBackingUp(true);
        setTimeout(() => {
            setIsBackingUp(false);
            Alert.alert('نجاح', `تم إجراء النسخ الاحتياطي عبر ${type === 'TELEGRAM' ? 'التلكرام' : 'التطبيق'} بنجاح.`);
        }, 2000);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.navigate('Dashboard')}>
                    <ArrowRight size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>الإعدادات</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>الأمان والحساب</Text>
                <TouchableOpacity style={styles.settingItem} onPress={() => setIsPasswordModalVisible(true)}>
                    <Lock size={20} color={COLORS.primary} />
                    <Text style={styles.settingLabel}>تغيير كلمة السر</Text>
                    <ChevronRight />
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>النسخ الاحتياطي</Text>
                <TouchableOpacity style={styles.settingItem} onPress={() => handleBackup('TELEGRAM')}>
                    <Send size={20} color="#229ED9" />
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>نسخ احتياطي (تلكرام)</Text>
                        <Text style={styles.settingSub}>إرسال نسخة من البيانات لبوت التلكرام</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem} onPress={() => handleBackup('LOCAL')}>
                    <Database size={20} color={COLORS.secondary} />
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>نسخ احتياطي (محلي)</Text>
                        <Text style={styles.settingSub}>حفظ نسخة احتياطية في ذاكرة التطبيق</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>عام</Text>
                <View style={styles.settingItem}>
                    <Bell size={20} color={COLORS.accent} />
                    <Text style={[styles.settingLabel, { flex: 1 }]}>الإشعارات</Text>
                    <Switch value={true} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
                </View>
                <View style={styles.settingItem}>
                    <Moon size={20} color="#6366f1" />
                    <Text style={[styles.settingLabel, { flex: 1 }]}>الوضع الليلي</Text>
                    <Switch value={false} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
                </View>

                <TouchableOpacity style={[styles.settingItem, { marginTop: 40, borderTopWidth: 1, borderColor: COLORS.border }]}>
                    <LogOut size={20} color={COLORS.danger} />
                    <Text style={[styles.settingLabel, { color: COLORS.danger }]}>تسجيل الخروج</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={isPasswordModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <X size={24} color={COLORS.text} onPress={() => setIsPasswordModalVisible(false)} />
                            <Text style={styles.modalTitle}>تغيير كلمة السر</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <Text style={styles.inputLabel}>كلمة السر الحالية</Text>
                        <TextInput style={styles.modalInput} secureTextEntry value={passwords.old} onChangeText={t => setPasswords({ ...passwords, old: t })} textAlign="right" />

                        <Text style={styles.inputLabel}>كلمة السر الجديدة</Text>
                        <TextInput style={styles.modalInput} secureTextEntry value={passwords.new} onChangeText={t => setPasswords({ ...passwords, new: t })} textAlign="right" />

                        <Text style={styles.inputLabel}>تأكيد كلمة السر</Text>
                        <TextInput style={styles.modalInput} secureTextEntry value={passwords.confirm} onChangeText={t => setPasswords({ ...passwords, confirm: t })} textAlign="right" />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword}>
                            <Check size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>تحديث</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const ChevronRight = () => (
    <View style={{ transform: [{ rotate: '180deg' }] }}>
        <ArrowRight size={18} color={COLORS.textMuted} />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
    backButton: { padding: SPACING.xs },
    title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    content: { padding: SPACING.lg },
    sectionTitle: { color: COLORS.primary, fontSize: 13, fontWeight: '800', marginBottom: 15, marginTop: 25, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 },
    settingItem: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
    settingInfo: { flex: 1, alignItems: 'flex-end', marginLeft: 15 },
    settingLabel: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '600', textAlign: 'right', marginRight: 15 },
    settingSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    modalContent: { backgroundColor: COLORS.surface, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    inputLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 6, textAlign: 'right' },
    modalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
    saveBtn: { backgroundColor: COLORS.primary, flexDirection: 'row-reverse', height: 50, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default SettingsScreen;
