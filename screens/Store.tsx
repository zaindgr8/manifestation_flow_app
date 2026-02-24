import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { BlurView } from 'expo-blur';
import { Sparkles, Zap, ShieldCheck, Crown, ArrowLeft, Check, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

/**
 * THE COSMIC EXCHANGE (Premium Store)
 * High-aesthetic marketplace for Cosmic Energy and Manifestor Pro.
 */
export const StoreScreen: React.FC = () => {
    const { setScreen, purchasePro, purchaseCredits, user, restorePurchases } = useManifest();
    const [loading, setLoading] = useState<string | null>(null);

    const isPro = user.subscription?.plan === 'PRO';

    const handlePurchasePro = async () => {
        setLoading('pro');
        await purchasePro();
        setLoading(null);
    };

    const handlePurchaseCredits = async (pack: '10' | '50') => {
        setLoading(pack);
        await purchaseCredits(pack);
        setLoading(null);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setScreen('PROFILE');
                        }}
                        style={styles.backButton}
                    >
                        <ArrowLeft size={24} color="#F4E0B9" />
                    </TouchableOpacity>
                    <View style={styles.titleWrapper}>
                        <Text style={styles.kicker}>UPGRADE YOUR JOURNEY</Text>
                        <Text style={styles.title}>Premium Features</Text>
                    </View>
                </View>

                {/* Balance Card */}
                <BlurView intensity={30} tint="dark" style={styles.balanceCard}>
                    <View style={styles.balanceInfo}>
                        <Text style={styles.balanceLabel}>AVAILABLE CREDITS</Text>
                        <View style={styles.balanceRow}>
                            <Zap size={28} color="#F4E0B9" fill="#F4E0B9" />
                            <Text style={styles.balanceValue}>{user.credits?.balance || 0}</Text>
                        </View>
                    </View>
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusLabel}>STATUS</Text>
                        <View style={styles.statusBadge}>
                           <Text style={styles.statusBadgeText}>{isPro ? 'ManifestFlow Pro' : 'SEEKER'}</Text>
                        </View>
                    </View>
                </BlurView>

                {/* Pro Tier Card */}
                {!isPro && (
                    <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={handlePurchasePro}
                        style={styles.proCard}
                    >
                        <View style={styles.proHeader}>
                            <Crown size={32} color="#050505" fill="#050505" />
                            <View style={styles.proPriceBadge}>
                                <Text style={styles.proPriceText}>$9.99/mo</Text>
                            </View>
                        </View>
                        <Text style={styles.proTitle}>ManifestFlow Pro</Text>
                        <Text style={styles.proSubtitle}>The ultimate toolkit to visualize your dream reality.</Text>
                        
                        <View style={styles.benefitsList}>
                            {[
                                'Unlimited Vision Goals',
                                'Unlimited Affirmation Refreshes',
                                '10 Weekly Credits Refills',
                                'Priority Image Generation',
                                'Early Access to New Realities'
                            ].map((benefit, i) => (
                                <View key={i} style={styles.benefitItem}>
                                    <View style={styles.benefitDot}>
                                        <Check size={12} color="#050505" strokeWidth={4} />
                                    </View>
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.proButton}>
                            {loading === 'pro' ? (
                                <ActivityIndicator color="#050505" />
                            ) : (
                                <Text style={styles.proButtonText}>UPGRADE TO PRO</Text>
                            )}
                        </View>
                        <Text style={styles.cancelAnytime}>Cancel anytime. Billed monthly.</Text>
                    </TouchableOpacity>
                )}

                {/* Credit Packs */}
                <Text style={styles.sectionTitle}>BUY CREDITS</Text>
                
                <View style={styles.packsContainer}>
                    {/* Pack 1 */}
                    <TouchableOpacity 
                        style={styles.packCard} 
                        onPress={() => handlePurchaseCredits('10')}
                        disabled={!!loading}
                    >
                        <View style={styles.packIconWrapper}>
                            <Zap size={24} color="#F4E0B9" />
                        </View>
                        <View style={styles.packInfo}>
                            <Text style={styles.packAmount}>10 Credits</Text>
                            <Text style={styles.packDesc}>Perfect for small shifts.</Text>
                        </View>
                        <View style={styles.packPrice}>
                            {loading === '10' ? (
                                <ActivityIndicator color="#F4E0B9" />
                            ) : (
                                <Text style={styles.packPriceText}>$2.99</Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Pack 2 */}
                    <TouchableOpacity 
                        style={[styles.packCard, styles.packCardPremium]} 
                        onPress={() => handlePurchaseCredits('50')}
                        disabled={!!loading}
                    >
                        <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>BEST VALUE</Text>
                        </View>
                        <View style={styles.packIconWrapperPremium}>
                            <Flame size={24} color="#050505" fill="#050505" />
                        </View>
                        <View style={styles.packInfo}>
                            <Text style={[styles.packAmount, styles.packAmountPremium]}>50 Credits</Text>

<Text style={[styles.packDesc, styles.packDescPremium]}>Full reality transformation.</Text>

                        </View>
                        <View style={styles.packPricePremium}>
                            {loading === '50' ? (
                                <ActivityIndicator color="#050505" />
                            ) : (
                                <Text style={styles.packPriceTextPremium}>$9.99</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Usage Guide */}
                <View style={styles.usageGuide}>
                    <Text style={styles.guideTitle}>HOW TO USE CREDITS</Text>
                    <View style={styles.guideItem}>
                        <Text style={styles.guideText}>Generate a new vision </Text>
                        <Text style={styles.guideCost}>1 CREDIT</Text>
                    </View>
                    <View style={styles.guideItem}>
                        <Text style={styles.guideText}>Put yourself in the vision</Text>
                        <Text style={styles.guideCost}>3 CREDITS</Text>
                    </View>
                    <View style={styles.guideItem}>
                        <Text style={styles.guideText}>Custom Prompt Image</Text>
                        <Text style={styles.guideCost}>5 CREDITS</Text>
                    </View>
                </View>

                {/* Footer */}
                <TouchableOpacity onPress={restorePurchases} style={styles.restoreButton}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>
                <Text style={styles.disclaimer}>
                    Purchases are charged to your App Store account. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    scrollContent: {
        paddingTop: 64,
        paddingBottom: 60,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        gap: 16,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    titleWrapper: {
        flex: 1,
    },
    kicker: {
        fontSize: 10,
        fontWeight: '900',
        color: '#F4E0B9',
        letterSpacing: 2,
        opacity: 0.7,
        marginBottom: 4,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -1,
    },
    balanceCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(244, 224, 185, 0.1)',
        overflow: 'hidden',
    },
    balanceInfo: {
        flex: 1,
    },
    balanceLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 2,
        marginBottom: 8,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
    },
    statusInfo: {
        alignItems: 'flex-end',
    },
    statusLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 2,
        marginBottom: 8,
    },
    statusBadge: {
        backgroundColor: 'rgba(244, 224, 185, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(244, 224, 185, 0.2)',
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#F4E0B9',
    },
    proCard: {
        backgroundColor: '#F4E0B9',
        borderRadius: 32,
        padding: 32,
        marginBottom: 48,
        shadowColor: '#F4E0B9',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
    },
    proHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    proPriceBadge: {
        backgroundColor: 'rgba(5,5,5,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    proPriceText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#050505',
    },
    proTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#050505',
        marginBottom: 4,
    },
    proSubtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(5,5,5,0.6)',
        marginBottom: 24,
    },
    benefitsList: {
        gap: 14,
        marginBottom: 32,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitDot: {
        width: 20,
        height: 20,
        borderRadius: 6,
        backgroundColor: 'rgba(5,5,5,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    benefitText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#050505',
    },
    proButton: {
        backgroundColor: '#050505',
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    proButtonText: {
        color: '#F4E0B9',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
    },
    cancelAnytime: {
        fontSize: 10,
        color: 'rgba(5,5,5,0.4)',
        textAlign: 'center',
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#F4E0B9',
        letterSpacing: 3,
        marginBottom: 24,
        opacity: 0.6,
    },
    packsContainer: {
        gap: 16,
        marginBottom: 48,
    },
    packCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 20,
    },
    packCardPremium: {
        backgroundColor: '#F4E0B9',
        borderColor: '#F4E0B9',
    },
    packIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(244, 224, 185, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    packIconWrapperPremium: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(5, 5, 5, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    packInfo: {
        flex: 1,
    },
    packAmount: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 2,
    },
    packAmountPremium: {
        color: '#050505',
    },
    packDesc: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.4)',
    },
    packDescPremium: {
        color: 'rgba(5,5,5,0.6)',
    },
    packPrice: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    packPricePremium: {
        backgroundColor: 'rgba(5,5,5,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    packPriceText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#F4E0B9',
    },
    packPriceTextPremium: {
        fontSize: 15,
        fontWeight: '800',
        color: '#050505',
    },
    bestValueBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bestValueText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#050505',
    },
    usageGuide: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    guideTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 2,
        marginBottom: 24,
    },
    guideItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    guideText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    guideCost: {
        fontSize: 11,
        fontWeight: '900',
        color: '#F4E0B9',
    },
    restoreButton: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    restoreText: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        textDecorationLine: 'underline',
    },
    disclaimer: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 10,
    }
});
