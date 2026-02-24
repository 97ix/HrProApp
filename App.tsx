import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, StatusBar, Platform, TouchableWithoutFeedback, Keyboard, Animated, Image, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/constants/theme';
import { storage } from './src/services/storage';
import { initSocket } from './src/services/socket';
import { registerForPushNotificationsAsync, updatePushTokenOnServer } from './src/services/notifications';

// Import Screens manually
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import PayrollScreen from './src/screens/PayrollScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LeaveRequestsScreen from './src/screens/LeaveRequestsScreen';
import UserManagerScreen from './src/screens/UserManagerScreen';
import RoleManagerScreen from './src/screens/RoleManagerScreen';
import ActivityLogScreen from './src/screens/ActivityLogScreen';
import FinancialReportsScreen from './src/screens/FinancialReportsScreen';
import FinancialManagementScreen from './src/screens/FinancialManagementScreen';
import LoansScreen from './src/screens/LoansScreen';
import DeductionsScreen from './src/screens/DeductionsScreen';
import DepartmentsScreen from './src/screens/DepartmentsScreen';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [splashVisible, setSplashVisible] = useState(true);

  // رسوميات الانيميشن
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(COLORS.surface);
    }

    // تشغيل الأنيميشن للدخول (ظهور تدريجي وتكبير)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();

    // إخفاء الـ Splash Screen بعد 2.5 ثانية بسلاسة
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    }, 2500);

    const checkLogin = async () => {
      try {
        const savedUser = await storage.getItem('user');
        if (savedUser) {
          setUser(savedUser);
          setCurrentScreen('Dashboard');
          initSocket();
          // تسجيل الإشعارات بعد التحقق من الدخول
          registerForPushNotificationsAsync().then((token) => {
            if (token) updatePushTokenOnServer(token, (savedUser as any).id);
          });
        }
      } catch (e) {
        console.error('Check Login Error:', e);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setCurrentScreen('Dashboard');
    initSocket();
    // تسجيل الإشعارات مباشرة بعد نجاح الدخول لأول مرة
    registerForPushNotificationsAsync().then((token) => {
      if (token) updatePushTokenOnServer(token, (userData as any).id);
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل تريد فعلاً تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            await storage.removeItem('user');
            setUser(null);
            setCurrentScreen('Login');
          }
        }
      ]
    );
  };

  // Custom Navigation Logic
  const navigateTo = (screenName: string) => {
    setCurrentScreen(screenName);
  };

  const renderScreen = () => {
    if (!user || currentScreen === 'Login') {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentScreen) {
      case 'Dashboard':
        return <DashboardScreen user={user} onLogout={handleLogout} navigation={{ navigate: navigateTo }} />;
      case 'Employees':
        return <EmployeeListScreen navigation={{ navigate: navigateTo }} />;
      case 'Attendance':
        return <AttendanceScreen navigation={{ navigate: navigateTo }} user={user} />;
      case 'Payroll':
        return <PayrollScreen navigation={{ navigate: navigateTo }} />;
      case 'Settings':
        return <SettingsScreen user={user} navigation={{ navigate: navigateTo }} />;
      case 'Profile':
        return <ProfileScreen user={user} navigation={{ navigate: navigateTo }} />;
      case 'Leaves':
        return <LeaveRequestsScreen navigation={{ navigate: navigateTo }} user={user} />;
      case 'UserManager':
        return <UserManagerScreen navigation={{ navigate: navigateTo }} user={user} />;
      case 'RoleManager':
        return <RoleManagerScreen navigation={{ navigate: navigateTo }} />;
      case 'ActivityLogs':
        return <ActivityLogScreen navigation={{ navigate: navigateTo }} />;
      case 'FinancialReports':
        return <FinancialReportsScreen navigation={{ navigate: navigateTo }} />;
      case 'FinancialManagement':
        return <FinancialManagementScreen navigation={{ navigate: navigateTo }} />;
      case 'Loans':
        return <LoansScreen navigation={{ navigate: navigateTo }} user={user} />;
      case 'Deductions':
        return <DeductionsScreen navigation={{ navigate: navigateTo }} />;
      case 'Departments':
        return <DepartmentsScreen navigation={{ navigate: navigateTo }} />;
      default:
        return <DashboardScreen user={user} onLogout={handleLogout} navigation={{ navigate: navigateTo }} />;
    }
  };

  if (splashVisible || loading) {
    return (
      <SafeAreaProvider>
        <View style={[styles.container, styles.splashContainer]}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
            <Image
              source={require('./assets/custom-splash.png')}
              style={styles.splashLogo}
              resizeMode="contain"
            />
            <Text style={styles.splashTitle}>HR Pro</Text>
            <ActivityIndicator size="large" color={COLORS.primary} animating={true} style={{ marginTop: 30 }} />
          </Animated.View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  splashLogo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },
});
