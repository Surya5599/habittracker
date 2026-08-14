import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send, AlertTriangle, Bot, Lock } from 'lucide-react-native';
import tw from 'twrnc';
import { AI_COACH_PERSONALITIES, AI_SUGGESTED_QUESTIONS, personalityMeta } from '../utils/aiCoach';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { BOTTOM_NAV_HEIGHT } from '../components/BottomNav';
import { getPalette } from '../constants/theme';

const CATEGORY_META = {
    solid: { label: '✓ Locked In', color: '#10b981' },
    dead: { label: '✕ Dead Weight', color: '#f43f5e' },
    auto: { label: '⚡ Automatic', color: '#3b82f6' },
    improve: { label: '↑ Track Smarter', color: '#f59e0b' },
    pattern: { label: '◈ Pattern', color: '#a855f7' },
};

// Renders **bold** spans the model emits without pulling in a markdown parser.
const RichText = ({ text, style, boldStyle }) => (
    <Text style={style}>
        {String(text || '').split(/(\*\*[^*]+\*\*)/).map((part, i) => (
            part.startsWith('**') && part.endsWith('**')
                ? <Text key={i} style={[style, boldStyle]}>{part.slice(2, -2)}</Text>
                : <Text key={i}>{part}</Text>
        ))}
    </Text>
);

export const AiCoachScreen = ({ coach, theme, colorMode = 'light', isGuest, onOpenSignIn, bottomNavHeight = BOTTOM_NAV_HEIGHT }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const isDark = colorMode === 'dark';
    const scrollRef = useRef(null);
    const [input, setInput] = useState('');
    const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    const {
        pageBg, panelBg, panelSoftBg, outline: outlineColor,
        textPrimary, textSecondary, textMuted,
    } = getPalette(colorMode);
    const accent = theme?.primary || '#C19A9A';

    const {
        personality, pickPersonality, hasPickedPersonalityToday,
        hasAcceptedDisclaimer, acceptDisclaimer,
        insight, insightError, messages, loading, dayLoaded, remaining, dailyLimit,
        fetchInsight, retryInsight, sendMessage,
    } = coach;

    const meta = personalityMeta(personality);

    // Gate order matches web: disclaimer → pick today's personality → insight.
    useEffect(() => {
        if (isGuest || !dayLoaded) return;
        if (!hasAcceptedDisclaimer) { setShowDisclaimer(true); return; }
        if (!hasPickedPersonalityToday) { setShowPersonalityPicker(true); return; }
        fetchInsight();
    }, [isGuest, dayLoaded, hasAcceptedDisclaimer, hasPickedPersonalityToday, fetchInsight]);

    useEffect(() => {
        if (messages.length === 0) return;
        const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
        return () => clearTimeout(timer);
    }, [messages.length, loading]);

    const handleSend = (override) => {
        const text = (override ?? input).trim();
        if (!text) return;
        setInput('');
        sendMessage(text);
    };

    if (isGuest) {
        return (
            <View style={[tw`flex-1 items-center justify-center px-8`, { backgroundColor: pageBg, paddingBottom: bottomNavHeight }]}>
                <View style={[tw`w-full rounded-3xl border-[3px] p-6 items-center`, { borderColor: outlineColor, backgroundColor: panelBg }]}>
                    <Lock size={28} color={accent} />
                    <Text style={[tw`mt-3 text-base font-black uppercase tracking-widest text-center`, { color: textPrimary }]}>
                        {t('aiCoach.title', { defaultValue: 'AI Coach' })}
                    </Text>
                    <Text style={[tw`mt-2 text-xs font-bold text-center leading-snug`, { color: textSecondary }]}>
                        {t('aiCoach.guestLocked', { defaultValue: 'Create an account or sign in to chat with your AI Coach and get personalized insight cards.' })}
                    </Text>
                    <TouchableOpacity
                        onPress={onOpenSignIn}
                        style={[tw`mt-5 px-5 py-3 rounded-xl border-[2px]`, { borderColor: outlineColor, backgroundColor: accent }]}
                    >
                        <Text style={tw`text-white text-xs font-black uppercase tracking-widest`}>
                            {t('header.signIn', { defaultValue: 'Sign In' })}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScreenScaffold
            colorMode={colorMode}
            theme={theme}
            title={t('aiCoach.title', { defaultValue: 'AI Coach' })}
            icon={Sparkles}
            bottomNavHeight={bottomNavHeight}
            headerRight={(
                <>
                    <TouchableOpacity
                        onPress={() => setShowPersonalityPicker(true)}
                        style={[tw`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border`, { borderColor: meta.color, backgroundColor: meta.color + '18' }]}
                    >
                        <Text style={tw`text-xs`}>{meta.emoji}</Text>
                        <Text style={[tw`text-[10px] font-black uppercase tracking-wider`, { color: meta.color }]}>{meta.label}</Text>
                    </TouchableOpacity>
                    <Text style={[tw`text-[10px] font-bold`, { color: textMuted }]}>
                        {t('aiCoach.remaining', { defaultValue: '{{count}} left', count: Math.max(0, remaining) })}
                    </Text>
                </>
            )}
            bottomBar={(
                <>
                    {insight && !loading && remaining > 0 && messages.length === 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-2`}>
                            {AI_SUGGESTED_QUESTIONS.map((q) => (
                                <TouchableOpacity
                                    key={q}
                                    onPress={() => handleSend(q)}
                                    style={[tw`mr-2 px-2.5 py-1.5 rounded-xl border-[2px]`, { borderColor: outlineColor, backgroundColor: panelSoftBg }]}
                                >
                                    <Text style={[tw`text-[10px] font-bold`, { color: textSecondary }]} numberOfLines={1}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {remaining <= 0 ? (
                        <Text style={[tw`text-[11px] font-bold text-center py-2.5`, { color: textMuted }]}>
                            {t('aiCoach.limitReached', { defaultValue: 'Daily limit reached. Come back tomorrow!' })}
                        </Text>
                    ) : (
                        <View style={tw`flex-row items-center gap-2`}>
                            <TextInput
                                value={input}
                                onChangeText={setInput}
                                onSubmitEditing={() => handleSend()}
                                placeholder={t('aiCoach.placeholder', { defaultValue: 'Ask your coach...' })}
                                placeholderTextColor={textMuted}
                                returnKeyType="send"
                                blurOnSubmit={false}
                                editable={!loading}
                                style={[
                                    tw`flex-1 text-sm font-medium px-3 py-2.5 rounded-xl border-[2px]`,
                                    { color: textPrimary, borderColor: outlineColor, backgroundColor: panelSoftBg },
                                ]}
                            />
                            <TouchableOpacity
                                onPress={() => handleSend()}
                                disabled={loading || !input.trim()}
                                style={[
                                    tw`p-3 rounded-xl border-[2px]`,
                                    { borderColor: outlineColor, backgroundColor: accent, opacity: loading || !input.trim() ? 0.4 : 1 },
                                ]}
                            >
                                <Send size={14} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <Text style={[tw`mt-2 text-[9px] font-bold text-center`, { color: textMuted }]}>
                        {t('aiCoach.footerNote', { defaultValue: 'AI can be wrong. {{limit}} messages per day.', limit: dailyLimit })}
                    </Text>
                </>
            )}
        >
            <ScrollView
                ref={scrollRef}
                style={tw`flex-1`}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Initial insight */}
                {loading && !insight && (
                    <View style={[tw`rounded-2xl border-[2px] p-4`, { borderColor: outlineColor, backgroundColor: panelBg }]}>
                        <ActivityIndicator size="small" color={accent} />
                        <Text style={[tw`mt-2 text-[11px] font-bold text-center`, { color: textMuted }]}>
                            {t('aiCoach.thinking', { defaultValue: 'Reading your history…' })}
                        </Text>
                    </View>
                )}

                {insight && (
                    <>
                        <View style={[
                            tw`rounded-2xl rounded-bl-none border-[2px] px-4 py-3`,
                            { borderColor: outlineColor, backgroundColor: (theme?.secondary || accent) + '22' },
                        ]}>
                            <Text style={[tw`text-[12px] font-medium leading-relaxed`, { color: textPrimary }]}>
                                {insight.message}
                            </Text>
                        </View>

                        {insightError && !loading && (
                            <TouchableOpacity
                                onPress={retryInsight}
                                style={[tw`mt-3 py-2.5 rounded-xl border-[2px] items-center`, { borderColor: outlineColor, backgroundColor: panelSoftBg }]}
                            >
                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: textSecondary }]}>
                                    {t('aiCoach.retry', { defaultValue: 'Try again' })}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {Array.isArray(insight.categories) && insight.categories.map((cat, i) => {
                            const catMeta = CATEGORY_META[cat.category] || CATEGORY_META.pattern;
                            return (
                                <View key={`${cat.category}-${i}`} style={tw`mt-3`}>
                                    <View style={tw`flex-row items-center flex-wrap gap-1.5`}>
                                        <View style={[tw`px-1.5 py-0.5 rounded border`, { borderColor: catMeta.color, backgroundColor: catMeta.color + '1a' }]}>
                                            <Text style={[tw`text-[9px] font-black`, { color: catMeta.color }]}>{catMeta.label}</Text>
                                        </View>
                                        {(cat.habits || []).length > 0 && (
                                            <Text style={[tw`text-[11px] font-black`, { color: textPrimary }]}>{cat.habits.join(', ')}</Text>
                                        )}
                                    </View>
                                    <Text style={[tw`mt-0.5 text-[11px] font-medium leading-snug`, { color: textSecondary }]}>{cat.note}</Text>
                                </View>
                            );
                        })}
                    </>
                )}

                {messages.length > 0 && (
                    <View style={tw`flex-row items-center gap-2 mt-5 mb-1`}>
                        <View style={[tw`flex-1 h-px`, { backgroundColor: panelSoftBg }]} />
                        <Text style={[tw`text-[9px] font-black uppercase tracking-widest`, { color: textMuted }]}>
                            {t('aiCoach.chat', { defaultValue: 'Chat' })}
                        </Text>
                        <View style={[tw`flex-1 h-px`, { backgroundColor: panelSoftBg }]} />
                    </View>
                )}

                {messages.map((msg, i) => (
                    <View key={i} style={[tw`mt-2 flex-row`, msg.role === 'user' ? tw`justify-end` : tw`justify-start`]}>
                        <View style={[
                            tw`max-w-[85%] px-3 py-2 border-[2px]`,
                            msg.role === 'user'
                                ? [tw`rounded-2xl rounded-br-none`, { borderColor: outlineColor, backgroundColor: accent }]
                                : [tw`rounded-2xl rounded-bl-none`, { borderColor: outlineColor, backgroundColor: (theme?.secondary || accent) + '22' }],
                        ]}>
                            <RichText
                                text={msg.text}
                                style={[tw`text-[12px] font-medium leading-snug`, { color: msg.role === 'user' ? '#ffffff' : textPrimary }]}
                                boldStyle={{ fontWeight: '900' }}
                            />
                        </View>
                    </View>
                ))}

                {loading && insight && (
                    <View style={tw`mt-2 flex-row justify-start`}>
                        <View style={[tw`rounded-2xl rounded-bl-none border-[2px] px-4 py-2.5`, { borderColor: outlineColor, backgroundColor: (theme?.secondary || accent) + '22' }]}>
                            <ActivityIndicator size="small" color={accent} />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Disclaimer gate */}
            <Modal visible={showDisclaimer} transparent animationType="fade" onRequestClose={() => setShowDisclaimer(false)}>
                <View style={tw`flex-1 items-center justify-center bg-black/60 px-6`}>
                    <View style={[tw`w-full rounded-3xl border-[3px] overflow-hidden`, { borderColor: outlineColor, backgroundColor: panelBg }]}>
                        <View style={[tw`h-1`, { backgroundColor: accent }]} />
                        <View style={[tw`flex-row items-center gap-2 px-4 py-3 border-b-[2px]`, { borderColor: outlineColor }]}>
                            <Bot size={16} color={textPrimary} />
                            <Text style={[tw`text-sm font-black uppercase tracking-wide flex-1`, { color: textPrimary }]}>
                                {t('aiCoach.disclaimerTitle', { defaultValue: 'Before you chat with AI Coach' })}
                            </Text>
                        </View>
                        <View style={tw`p-4`}>
                            <View style={[tw`flex-row items-start gap-2 p-2.5 rounded-xl border-2`, { borderColor: '#fcd34d', backgroundColor: '#fffbeb' }]}>
                                <AlertTriangle size={14} color="#d97706" />
                                <Text style={[tw`flex-1 text-[11px] font-medium leading-snug`, { color: '#92400e' }]}>
                                    {t('aiCoach.disclaimerWarning', { defaultValue: 'AI Coach can occasionally get things wrong, be slow, or be temporarily unavailable — it\'s a fun nudge, not professional advice.' })}
                                </Text>
                            </View>
                            <Text style={[tw`mt-3 text-[11px] leading-snug`, { color: textSecondary }]}>
                                {t('aiCoach.disclaimerPrivacy', { defaultValue: 'Your habit names, completion history, and chat messages are sent to a third-party AI service to generate responses. Don\'t share anything sensitive in the chat.' })}
                            </Text>
                            <TouchableOpacity
                                onPress={async () => { setShowDisclaimer(false); await acceptDisclaimer(); }}
                                style={[tw`mt-4 py-3 rounded-xl border-[2px] items-center`, { borderColor: outlineColor, backgroundColor: accent }]}
                            >
                                <Text style={tw`text-white text-xs font-black uppercase tracking-widest`}>
                                    {t('aiCoach.disclaimerAccept', { defaultValue: 'I understand, continue' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Daily personality picker */}
            <Modal visible={showPersonalityPicker} transparent animationType="slide" onRequestClose={() => setShowPersonalityPicker(false)}>
                <View style={tw`flex-1 justify-end bg-black/60`}>
                    <View style={[tw`rounded-t-3xl px-5 pt-5`, { backgroundColor: panelBg, paddingBottom: 20 + insets.bottom }]}>
                        <Text style={[tw`text-base font-black uppercase tracking-widest`, { color: textPrimary }]}>
                            {t('aiCoach.pickCoach', { defaultValue: "Pick today's coach" })}
                        </Text>
                        <Text style={[tw`mt-1 mb-4 text-[11px] font-bold`, { color: textMuted }]}>
                            {t('aiCoach.pickCoachHint', { defaultValue: 'Same data, same insight — only the tone changes.' })}
                        </Text>
                        {AI_COACH_PERSONALITIES.map((p) => (
                            <TouchableOpacity
                                key={p.id}
                                onPress={async () => { setShowPersonalityPicker(false); await pickPersonality(p.id); }}
                                style={[
                                    tw`flex-row items-center gap-3 p-3 mb-2 rounded-2xl border-[2px]`,
                                    { borderColor: personality === p.id ? p.color : (isDark ? '#262626' : '#e5e7eb'), backgroundColor: personality === p.id ? p.color + '14' : panelSoftBg },
                                ]}
                            >
                                <Text style={tw`text-lg`}>{p.emoji}</Text>
                                <View style={tw`flex-1`}>
                                    <Text style={[tw`text-xs font-black uppercase tracking-widest`, { color: p.color }]}>{p.label}</Text>
                                    <Text style={[tw`mt-0.5 text-[11px] font-medium leading-snug`, { color: textSecondary }]}>{p.description}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </ScreenScaffold>
    );
};
