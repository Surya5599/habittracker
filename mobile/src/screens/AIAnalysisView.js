import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Sparkles, Lock, ChevronRight, Zap } from 'lucide-react-native';
import tw from 'twrnc';

export const AIAnalysisView = ({
    theme,
    colorMode = 'light',
    isPremium,
    analysisCount,
    maxAnalyses,
    incrementAnalysis,
    startPremiumCheckout,
    checkoutLoading
}) => {
    const { t, i18n } = useTranslation();
    const primaryColor = theme?.primary || '#a18e78';
    const isDark = colorMode === 'dark';
    const panelBg = isDark ? '#0a0a0a' : '#ffffff';
    const panelBorder = isDark ? '#ffffff' : '#000000';
    const textPrimary = isDark ? '#f5f5f5' : '#1f2937';
    const textMuted = isDark ? '#a3a3a3' : '#6b7280';
    const subtleBg = isDark ? '#111111' : '#f3f4f6';

    const renderPremiumGate = () => (
        <View style={tw`flex-1 items-center justify-center px-6`}>
            <View style={[tw`p-6 rounded-3xl border-[3px] items-center w-full relative`, { backgroundColor: panelBg, borderColor: panelBorder }]}>
                <View style={[tw`absolute bg-black rounded-3xl`, { top: 8, left: 8, right: -8, bottom: -8, zIndex: -1 }]} />

                <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: primaryColor + '20' }]}>
                    <Lock size={32} color={primaryColor} />
                </View>

                <Text style={[tw`text-2xl font-black uppercase text-center mb-2`, { color: textPrimary }]}>{t('aiAnalysis.premiumOnly')}</Text>
                <Text style={[tw`text-center mb-8 font-medium`, { color: textMuted }]}>
                    {t('aiAnalysis.premiumDesc')}
                </Text>

                <TouchableOpacity
                    onPress={async () => {
                        try {
                            await startPremiumCheckout?.();
                        } catch (err) {
                            Alert.alert('Upgrade unavailable', err?.message || 'Unable to start checkout right now.');
                        }
                    }}
                    disabled={checkoutLoading}
                    style={[tw`w-full py-4 rounded-2xl flex-row items-center justify-center border-2`, { backgroundColor: primaryColor, borderColor: panelBorder, opacity: checkoutLoading ? 0.75 : 1 }]}
                >
                    <Zap size={20} color="white" fill="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-black uppercase tracking-widest`}>
                        {checkoutLoading ? 'Opening Checkout...' : t('aiAnalysis.upgrade')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderAnalysis = () => (
        <ScrollView style={tw`flex-1 p-4`} showsVerticalScrollIndicator={false}>
            {/* Header / Stats */}
            <View style={tw`mb-8`}>
                <View style={[tw`p-5 rounded-3xl border-[3px] relative mb-4`, { backgroundColor: panelBg, borderColor: panelBorder }]}>
                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />

                    <View style={tw`flex-row justify-between items-center mb-2`}>
                        <Text style={[tw`text-xs font-black uppercase tracking-widest`, { color: textMuted }]}>{t('aiAnalysis.weeklyUsage')}</Text>
                        <Text style={[tw`text-xs font-black uppercase tracking-widest`, { color: primaryColor }]}>
                            {analysisCount} / {maxAnalyses} {t('aiAnalysis.analyses')}
                        </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={[tw`h-3 rounded-full overflow-hidden border-2`, { backgroundColor: subtleBg, borderColor: panelBorder }]}>
                        <View
                            style={[
                                tw`h-full`,
                                {
                                    backgroundColor: primaryColor,
                                    width: `${(analysisCount / maxAnalyses) * 100}%`
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>

            {/* Analysis Actions */}
            <TouchableOpacity
                onPress={() => {
                    if (analysisCount < maxAnalyses) {
                        incrementAnalysis();
                    }
                }}
                disabled={analysisCount >= maxAnalyses}
                style={[
                    tw`p-6 rounded-3xl border-[3px] border-black relative mb-10 items-center overflow-hidden`,
                    {
                        borderColor: panelBorder,
                        backgroundColor: analysisCount >= maxAnalyses ? subtleBg : primaryColor,
                        opacity: analysisCount >= maxAnalyses ? 0.75 : 1
                    }
                ]}
            >
                <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />

                <Sparkles size={32} color="white" strokeWidth={2.5} style={tw`mb-2`} />
                <Text style={tw`text-white text-xl font-black uppercase tracking-widest mb-1 text-center`}>
                    {analysisCount >= maxAnalyses ? t('aiAnalysis.limitReached') : t('aiAnalysis.generateNew')}
                </Text>
                <Text style={tw`text-white/80 text-xs font-bold text-center`}>
                    {analysisCount >= maxAnalyses ? t('aiAnalysis.resetMessage') : t('aiAnalysis.analyzeMessage')}
                </Text>
            </TouchableOpacity>

            {/* Recent Analysis Feed (Mock) - Using a carousel-like feel */}
            <Text style={[tw`text-xs font-black uppercase tracking-widest mb-4 ml-2`, { color: textMuted }]}>{t('aiAnalysis.history')}</Text>

            {[1, 2].map((i) => (
                <View key={i} style={tw`mb-6`}>
                    <View style={[tw`p-5 rounded-3xl border-[3px] relative`, { backgroundColor: panelBg, borderColor: panelBorder }]}>
                        <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />

                        <View style={tw`flex-row justify-between items-start mb-3`}>
                            <View>
                                <Text style={[tw`text-lg font-black uppercase leading-5 mb-1`, { color: textPrimary }]}>{t('aiAnalysis.mockTitle')}</Text>
                                <Text style={[tw`text-[10px] font-black uppercase`, { color: textMuted }]}>
                                    {new Date(2026, 0, 10 - i).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </View>
                            <View style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: isDark ? primaryColor + '30' : primaryColor + '10' }]}>
                                <Text style={[tw`text-[10px] font-black uppercase`, { color: primaryColor }]}>{t('aiAnalysis.insight')} #{i}</Text>
                            </View>
                        </View>

                        <Text style={[tw`text-sm font-medium leading-5`, { color: textMuted }]}>
                            {t('aiAnalysis.mockContent')}
                        </Text>

                        <TouchableOpacity style={tw`flex-row items-center mt-4`}>
                            <Text style={[tw`text-xs font-black uppercase mr-1`, { color: primaryColor }]}>{t('aiAnalysis.viewReport')}</Text>
                            <ChevronRight size={14} color={primaryColor} strokeWidth={3} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <View style={tw`h-24`} />
        </ScrollView>
    );

    return (
        <View style={[tw`flex-1`, { backgroundColor: isDark ? '#000000' : '#f5f5f4' }]}>
            {!isPremium ? renderPremiumGate() : renderAnalysis()}
        </View>
    );
};
