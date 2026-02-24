import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Lock, Server, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import api from '../services/api';
import { storage } from '../services/storage';

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
    const insets = useSafeAreaInsets();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverIp, setServerIp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password || !serverIp) {
            Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
            return;
        }

        setLoading(true);
        try {
            await storage.setItem('server_ip', serverIp);

            // Note: services/api.ts will automatically pick up the new server_ip for this request 
            // but we might need a small delay or a direct axios call if the interceptor hasn't re-run.
            // However, the interceptor runs *on every request*, so it should work.

            const response = await api.post('/api/login', { username, password });
            const userData = response.data;

            await storage.setItem('user', userData);
            onLoginSuccess(userData);
        } catch (error: any) {
            console.error('Login Error:', error);
            const msg = error.response?.data?.message || 'فشل الاتصال بالسيرفر';
            Alert.alert('خطأ', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 50 }]}>
            <View style={styles.header}>
                <Text style={styles.title}>HR PRO</Text>
                <Text style={styles.subtitle}>الجيل الجديد للموارد البشرية</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="عنوان السيرفر IP"
                        placeholderTextColor={COLORS.textMuted}
                        value={serverIp}
                        onChangeText={setServerIp}
                    />
                    <Server size={20} color={COLORS.primary} />
                </View>

                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="اسم المستخدم"
                        placeholderTextColor={COLORS.textMuted}
                        value={username}
                        onChangeText={setUsername}
                    />
                    <User size={20} color={COLORS.primary} />
                </View>

                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="كلمة المرور"
                        placeholderTextColor={COLORS.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={true}
                    />
                    <Lock size={20} color={COLORS.primary} />
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" animating={true} />
                    ) : (
                        <View style={styles.buttonContent}>
                            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
                            <ArrowRight size={20} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>HR Pro Online - النسخة المستقرة</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 5,
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        height: 60,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        textAlign: 'right',
        paddingRight: 10,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 'auto',
        marginBottom: 20,
    },
});

export default LoginScreen;
