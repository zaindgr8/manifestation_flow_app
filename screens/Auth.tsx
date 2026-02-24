import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Dimensions,
} from 'react-native';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Sparkles, AlertCircle } from 'lucide-react-native';
import { useManifest } from '../context/ManifestContext';
import { Svg, Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

/**
 * REDESIGNED AUTH SCREEN
 * Rebuilt from scratch for a premium aesthetic and robust layout.
 * Old version preserved in comments below.
 */

export const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { enableGuestMode } = useManifest();

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '50846238672-1skmjgl5lp2r9u10i9vnqumvdpcd6mc2.apps.googleusercontent.com',
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '50846238672-1skmjgl5lp2r9u10i9vnqumvdpcd6mc2.apps.googleusercontent.com',
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '50846238672-1skmjgl5lp2r9u10i9vnqumvdpcd6mc2.apps.googleusercontent.com',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            setLoading(true);
            signInWithCredential(auth, credential)
                .then(() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                })
                .catch((err) => {
                    console.error("Google Auth Error", err);
                    setError("Google Sign-In failed.");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                })
                .finally(() => setLoading(false));
        }
    }, [response]);

    const handleEmailAuth = async () => {
        if (!email || !password) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (!auth) {
            setError("Firebase not configured.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            console.error(err);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            let msg = "Authentication failed.";
            if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (err.code === 'auth/email-already-in-use') msg = "Email already exists.";
            if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <BlurView intensity={20} tint="dark" style={styles.logoBlur}>
                            <Sparkles size={40} color="#F4E0B9" />
                        </BlurView>
                    </View>
                    <Text style={styles.title}>ManifestFlow</Text>
                    <Text style={styles.subtitle}>ALIGN WITH YOUR REALITY</Text>
                </View>

                {/* Form Card */}
                <View style={styles.cardWrapper}>
                    <BlurView intensity={15} tint="dark" style={styles.card}>
                        {/* Toggle */}
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsLogin(true);
                                    setError(null);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
                            >
                                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>LOGIN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsLogin(false);
                                    setError(null);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
                            >
                                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>SIGN UP</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Fields */}
                        <View style={styles.form}>
                            <Input
                                label="Email Address"
                                placeholder="Enter Your Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Input
                                label="PASSWORD"
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            {error && (
                                <View style={styles.errorContainer}>
                                    <AlertCircle size={16} color="#ef4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <Button
                                loading={loading}
                                onPress={handleEmailAuth}
                                style={styles.mainButton}
                            >
                                {isLogin ? 'LOGIN' : 'Sign Up'}
                            </Button>
                        </View>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.divider} />
                        </View>

                        <Button
                            disabled={loading || !request}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                promptAsync();
                            }}
                            variant="google"
                        >
                            <View style={styles.googleContent}>
                                <Svg width="18" height="18" viewBox="0 0 24 24">
                                    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </Svg>
                                <Text style={styles.googleText}>Continue with Google</Text>
                            </View>
                        </Button>

                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                enableGuestMode();
                            }}
                            style={styles.guestButton}
                        >
                            {/* <Text style={styles.guestText}>Entry as Seeker Only</Text> */}
                        </TouchableOpacity>
                    </BlurView>
                </View>

                {/* <Text style={styles.footerText}>
                    By entering, you agree to align with{"\n"}your highest self.
                </Text> */}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505', // Void
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 84,
        height: 84,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(244, 224, 185, 0.2)',
        backgroundColor: 'rgba(20, 20, 20, 0.5)',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#F4E0B9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    logoBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -1,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 10,
        color: '#F4E0B9',
        fontWeight: '700',
        letterSpacing: 4,
        marginTop: 8,
        opacity: 0.8,
        textAlign: 'center',
    },
    cardWrapper: {
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        overflow: 'hidden',
    },
    card: {
        padding: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 6,
        borderRadius: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    toggleBtnActive: {
        backgroundColor: '#F4E0B9',
    },
    toggleText: {
        fontSize: 11,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 1.5,
    },
    toggleTextActive: {
        color: '#050505',
    },
    form: {
        gap: 8,
    },
    mainButton: {
        marginTop: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginVertical: 8,
    },
    errorText: {
        color: '#fca5a5',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    dividerText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 10,
        fontWeight: '800',
        marginHorizontal: 16,
        letterSpacing: 2,
    },
    googleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    googleText: {
        color: '#050505',
        fontWeight: '800',
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    guestButton: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
    },
    guestText: {
        color: '#F4E0B9',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        opacity: 0.7,
    },
    footerText: {
        textAlign: 'center',
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.3)',
        fontWeight: '600',
        letterSpacing: 1,
        marginTop: 32,
        lineHeight: 18,
    },
});

/*
// ──────────────────────────────────────────────────────────────────────────────
// OLD AUTH SCREEN VERSION (REMOVED FOR CLEANLINESS AS REQUESTED)
// ──────────────────────────────────────────────────────────────────────────────
// ... (Preserving logic but redesigning interface)
*/
