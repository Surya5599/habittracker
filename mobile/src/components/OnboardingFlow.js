import React, { useCallback, useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, ScrollView, Modal,
    ActivityIndicator, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Check, Plus, X, ArrowRight, Bell, Sparkles, Globe } from 'lucide-react-native';
import tw from 'twrnc';
import { getPalette, readableOn, alpha } from '../constants/theme';
import { STARTER_HABITS, STARTER_HABIT_COLORS, CADENCES, cadenceKeyFor } from '../constants/starterHabits';
import { HABIT_NAME_MAX_LENGTH } from '../constants';
import { LANGUAGES } from '../constants/languages';
import { todayKey } from '../utils/dateKeys';

// Onboarding that leaves you with a working app instead of a finished slideshow.
//
// The flow it replaces was seven screens: four preference pickers (language, theme,
// card size, week start) and three animated demos of features. It created nothing, so
// a new user landed on an empty Today screen with no habits — the blank-page problem
// onboarding exists to solve, left entirely intact.
//
// Preferences all live in Settings already and cost nothing to change later, so they
// are not what a first run should spend attention on. Watching an animation of a
// checkbox being ticked is also strictly worse than ticking a real one.
//
// So: three screens, each doing real work, ending on the activation moment —
//   1. Pick habits   → creates real habits
//   2. Set cadence   → one tap to accept the defaults
//   3. Tick one off  → the thing the app is for, done once, for real
// then the reminder ask, at the one moment intent is highest.

const SCREENS = ['pick', 'cadence', 'first', 'reminder'];

const Dots = ({ index, total, active, inactive }) => (
    <View style={tw`flex-row items-center justify-center gap-1.5`}>
        {Array.from({ length: total }).map((_, i) => (
            <View
                key={i}
                style={[
                    tw`rounded-full`,
                    i === index
                        ? { width: 20, height: 6, backgroundColor: active }
                        : { width: 6, height: 6, backgroundColor: inactive },
                ]}
            />
        ))}
    </View>
);

export const OnboardingFlow = ({
    visible,
    theme,
    colorMode = 'light',
    language = 'en',
    onLanguageChange,
    onCreateHabit,
    onToggleCompletion,
    onEnableReminder,
    onComplete,
    onSkip,
}) => {
    const { t } = useTranslation();
    const palette = getPalette(colorMode);
    const insets = useSafeAreaInsets();
    const accent = theme?.primary || '#8da18d';

    const [screenIndex, setScreenIndex] = useState(0);
    const [picked, setPicked] = useState([]);
    const [customText, setCustomText] = useState('');
    const [created, setCreated] = useState([]);        // habits actually written
    const [checkedIds, setCheckedIds] = useState([]);
    const [busy, setBusy] = useState(false);
    const [showLanguages, setShowLanguages] = useState(false);

    // Starter names resolve at render, not at pick time — otherwise switching language
    // after choosing a few would leave them stranded in the previous one. Custom names
    // are the user's own words and never get translated.
    const nameFor = useCallback((p) => (
        p.custom ? p.name : t(`onboardingFlow.starters.${p.key}`, { defaultValue: p.fallback })
    ), [t]);

    const screen = SCREENS[screenIndex];
    const celebrate = useRef(new Animated.Value(0)).current;

    const nextColor = useCallback(
        (n) => STARTER_HABIT_COLORS[n % STARTER_HABIT_COLORS.length],
        [],
    );

    const togglePick = useCallback((item) => {
        Haptics.selectionAsync().catch(() => { });
        setPicked((prev) => {
            const exists = prev.find(p => p.key === item.key);
            if (exists) return prev.filter(p => p.key !== item.key);
            return [...prev, {
                key: item.key,
                custom: false,
                fallback: item.fallback,
                emoji: item.emoji,
                frequency: item.frequency,
                weeklyTarget: null,
                color: nextColor(prev.length),
            }];
        });
    }, [nextColor]);

    const addCustom = useCallback(() => {
        const name = customText.trim();
        if (!name) return;
        Haptics.selectionAsync().catch(() => { });
        setPicked((prev) => [...prev, {
            key: `custom-${Date.now()}`,
            custom: true,
            name,
            emoji: '✨',
            frequency: undefined,
            weeklyTarget: null,
            color: nextColor(prev.length),
        }]);
        setCustomText('');
    }, [customText, nextColor]);

    const setCadence = useCallback((key, cadence) => {
        Haptics.selectionAsync().catch(() => { });
        setPicked(prev => prev.map(p => (
            p.key === key
                ? { ...p, frequency: cadence.frequency, weeklyTarget: cadence.weeklyTarget }
                : p
        )));
    }, []);

    // Habits are written once, on the way into the third screen, so the user ticks a
    // real habit rather than a mock that has to be reconciled afterwards.
    const commitHabits = useCallback(async () => {
        if (created.length > 0) return created;
        setBusy(true);
        const out = [];
        try {
            for (const p of picked) {
                const habit = await onCreateHabit?.({ ...p, name: nameFor(p) });
                if (habit) out.push(habit);
            }
            setCreated(out);
        } finally {
            setBusy(false);
        }
        return out;
    }, [created, picked, onCreateHabit, nameFor]);

    const goNext = useCallback(async () => {
        if (screen === 'cadence') await commitHabits();
        setScreenIndex(i => Math.min(i + 1, SCREENS.length - 1));
    }, [screen, commitHabits]);

    const handleFirstCheck = useCallback((habit) => {
        if (checkedIds.includes(habit.id)) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        setCheckedIds(prev => [...prev, habit.id]);
        onToggleCompletion?.(habit.id, todayKey());
        celebrate.setValue(0);
        Animated.timing(celebrate, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, [checkedIds, onToggleCompletion, celebrate]);

    const canContinue = screen === 'pick' ? picked.length > 0
        : screen === 'first' ? checkedIds.length > 0
            : true;

    const heading = {
        pick: t('onboardingFlow.pick.title', { defaultValue: 'What do you want to build?' }),
        cadence: t('onboardingFlow.cadence.title', { defaultValue: 'How often?' }),
        first: t('onboardingFlow.first.title', { defaultValue: 'Tick your first one' }),
        reminder: t('onboardingFlow.reminder.title', { defaultValue: 'One nudge a day?' }),
    }[screen];

    const sub = {
        pick: t('onboardingFlow.pick.sub', { defaultValue: 'Pick a few to start. You can add, rename or drop any of them later.' }),
        cadence: t('onboardingFlow.cadence.sub', { defaultValue: 'Days a habit isn\'t due never count against you.' }),
        first: t('onboardingFlow.first.sub', { defaultValue: 'This is the whole app, really. Tick one to see it land.' }),
        reminder: t('onboardingFlow.reminder.sub', { defaultValue: 'An evening reminder, only if something is still open.' }),
    }[screen];

    const primaryLabel = {
        pick: picked.length > 0
            ? t('onboardingFlow.continueWith', { defaultValue: 'Continue with {{count}}', count: picked.length })
            : t('onboardingFlow.pickAtLeastOne', { defaultValue: 'Pick at least one' }),
        cadence: t('onboardingFlow.looksRight', { defaultValue: 'Looks right' }),
        first: t('onboardingFlow.done', { defaultValue: "I'm set" }),
        reminder: t('onboardingFlow.enableReminder', { defaultValue: 'Turn on reminders' }),
    }[screen];

    const finish = useCallback(async (withReminder) => {
        if (withReminder) {
            try { await onEnableReminder?.(); } catch { /* declined is fine */ }
        }
        onComplete?.();
    }, [onEnableReminder, onComplete]);

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent navigationBarTranslucent>
            <View style={[
                tw`flex-1`,
                { backgroundColor: palette.pageBg, paddingTop: Math.max(insets.top, 12) },
            ]}>
                {/* Header */}
                <View style={tw`flex-row items-center px-5 pt-2 pb-4`}>
                    {/* Someone who can't read the app can't find this in Settings, so the
                        very first screen has to offer it — as a globe and a language code,
                        which need no English to understand. */}
                    {screen === 'pick' && onLanguageChange && (
                        <TouchableOpacity
                            onPress={() => setShowLanguages(true)}
                            accessibilityRole="button"
                            accessibilityLabel={t('settings.language.title')}
                            style={[
                                tw`absolute left-4 flex-row items-center gap-1.5 h-9 px-2.5 rounded-xl`,
                                { backgroundColor: palette.panelSoftBg },
                            ]}
                        >
                            <Globe size={14} color={palette.textSecondary} />
                            <Text style={[tw`text-[11px] font-black uppercase`, { color: palette.textPrimary }]}>
                                {language}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <View style={tw`flex-1`}>
                        <Dots index={screenIndex} total={SCREENS.length} active={accent} inactive={palette.divider} />
                    </View>
                    {screen !== 'first' && (
                        <TouchableOpacity
                            onPress={() => (screen === 'reminder' ? finish(false) : onSkip?.())}
                            accessibilityRole="button"
                            style={tw`absolute right-4 h-9 px-2 justify-center`}
                        >
                            <Text style={[tw`text-[11px] font-black uppercase tracking-widest`, { color: palette.textMuted }]}>
                                {t('onboardingFlow.skip', { defaultValue: 'Skip' })}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={tw`px-6`}>
                    <Text style={[tw`text-2xl font-black`, { color: palette.textPrimary }]}>{heading}</Text>
                    <Text style={[tw`mt-2 text-sm font-bold leading-snug`, { color: palette.textSecondary }]}>{sub}</Text>
                </View>

                <ScrollView
                    style={tw`flex-1 mt-5`}
                    contentContainerStyle={tw`px-6 pb-6`}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {screen === 'pick' && (
                        <>
                            <View style={tw`flex-row flex-wrap gap-2`}>
                                {STARTER_HABITS.map((item) => {
                                    const isPicked = !!picked.find(p => p.key === item.key);
                                    return (
                                        <TouchableOpacity
                                            key={item.key}
                                            onPress={() => togglePick(item)}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: isPicked }}
                                            style={[
                                                tw`flex-row items-center gap-2 px-3.5 h-11 rounded-2xl border-2`,
                                                isPicked
                                                    ? { borderColor: accent, backgroundColor: accent + alpha.soft }
                                                    : { borderColor: palette.cardBorder, backgroundColor: palette.panelBg },
                                            ]}
                                        >
                                            <Text style={tw`text-base`}>{item.emoji}</Text>
                                            <Text style={[
                                                tw`text-sm font-bold`,
                                                { color: isPicked ? palette.textPrimary : palette.textSecondary },
                                            ]}>
                                                {t(`onboardingFlow.starters.${item.key}`, { defaultValue: item.fallback })}
                                            </Text>
                                            {isPicked && <Check size={14} color={accent} strokeWidth={4} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Custom picks, listed under the grid so they read as chosen too. */}
                            {picked.filter(p => String(p.key).startsWith('custom-')).map((p) => (
                                <View
                                    key={p.key}
                                    style={[
                                        tw`flex-row items-center gap-2 mt-2 px-3.5 h-11 rounded-2xl border-2`,
                                        { borderColor: accent, backgroundColor: accent + alpha.soft },
                                    ]}
                                >
                                    <Text style={tw`text-base`}>{p.emoji}</Text>
                                    <Text style={[tw`flex-1 text-sm font-bold`, { color: palette.textPrimary }]}>{nameFor(p)}</Text>
                                    <TouchableOpacity
                                        onPress={() => setPicked(prev => prev.filter(x => x.key !== p.key))}
                                        accessibilityRole="button"
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <X size={15} color={palette.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <View style={[
                                tw`flex-row items-center mt-4 rounded-2xl border-2 pl-3.5 pr-1.5`,
                                { borderColor: palette.cardBorder, backgroundColor: palette.panelBg },
                            ]}>
                                <TextInput
                                    value={customText}
                                    maxLength={HABIT_NAME_MAX_LENGTH}
                                    onChangeText={setCustomText}
                                    onSubmitEditing={addCustom}
                                    placeholder={t('onboardingFlow.customPlaceholder', { defaultValue: 'Something else…' })}
                                    placeholderTextColor={palette.textMuted}
                                    returnKeyType="done"
                                    blurOnSubmit={false}
                                    style={[tw`flex-1 py-3 text-sm font-bold`, { color: palette.textPrimary }]}
                                />
                                <TouchableOpacity
                                    onPress={addCustom}
                                    disabled={!customText.trim()}
                                    accessibilityRole="button"
                                    style={[
                                        tw`w-9 h-9 rounded-xl items-center justify-center`,
                                        { backgroundColor: customText.trim() ? accent : 'transparent' },
                                    ]}
                                >
                                    <Plus size={17} color={customText.trim() ? readableOn(accent) : palette.textMuted} strokeWidth={3} />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {screen === 'cadence' && picked.map((p) => (
                        <View
                            key={p.key}
                            style={[tw`rounded-2xl p-3.5 mb-3`, { backgroundColor: palette.panelSoftBg }]}
                        >
                            <View style={tw`flex-row items-center gap-2`}>
                                <Text style={tw`text-base`}>{p.emoji}</Text>
                                <Text style={[tw`flex-1 text-sm font-black`, { color: palette.textPrimary }]}>{nameFor(p)}</Text>
                            </View>
                            <View style={tw`flex-row gap-2 mt-3`}>
                                {CADENCES.map((cadence) => {
                                    const isSel = cadenceKeyFor(p) === cadence.key;
                                    return (
                                        <TouchableOpacity
                                            key={cadence.key}
                                            onPress={() => setCadence(p.key, cadence)}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: isSel }}
                                            style={[
                                                tw`flex-1 h-10 rounded-xl items-center justify-center border-2`,
                                                isSel
                                                    ? { borderColor: p.color, backgroundColor: p.color + alpha.soft }
                                                    : { borderColor: palette.cardBorder, backgroundColor: palette.panelBg },
                                            ]}
                                        >
                                            <Text style={[
                                                tw`text-[10px] font-black uppercase tracking-wider`,
                                                { color: isSel ? palette.textPrimary : palette.textMuted },
                                            ]}>
                                                {t(`onboardingFlow.cadences.${cadence.key}`, { defaultValue: cadence.fallback })}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    ))}

                    {screen === 'first' && (
                        <>
                            {busy && created.length === 0 && (
                                <View style={tw`py-10 items-center`}>
                                    <ActivityIndicator size="small" color={accent} />
                                </View>
                            )}
                            {created.map((habit) => {
                                const isChecked = checkedIds.includes(habit.id);
                                return (
                                    <TouchableOpacity
                                        key={habit.id}
                                        onPress={() => handleFirstCheck(habit)}
                                        accessibilityRole="checkbox"
                                        accessibilityState={{ checked: isChecked }}
                                        accessibilityLabel={habit.name}
                                        style={[
                                            tw`flex-row items-center px-4 py-3.5 mb-2.5 rounded-2xl border-2`,
                                            {
                                                borderColor: isChecked ? habit.color : palette.cardBorder,
                                                backgroundColor: isChecked ? habit.color + alpha.faint : palette.panelBg,
                                            },
                                        ]}
                                    >
                                        <View style={[
                                            tw`w-7 h-7 rounded-md mr-3 items-center justify-center border-[2.5px]`,
                                            {
                                                borderColor: habit.color,
                                                backgroundColor: isChecked ? habit.color : 'transparent',
                                            },
                                        ]}>
                                            {isChecked && <Check size={15} color={readableOn(habit.color)} strokeWidth={4} />}
                                        </View>
                                        <Text style={[
                                            tw`flex-1 text-base font-bold`,
                                            isChecked
                                                ? { color: palette.textMuted, textDecorationLine: 'line-through' }
                                                : { color: palette.textPrimary },
                                        ]}>
                                            {habit.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                            {checkedIds.length > 0 && (
                                <Animated.View
                                    style={[
                                        tw`flex-row items-center justify-center gap-2 mt-4`,
                                        {
                                            opacity: celebrate,
                                            transform: [{
                                                translateY: celebrate.interpolate({
                                                    inputRange: [0, 1], outputRange: [8, 0],
                                                }),
                                            }],
                                        },
                                    ]}
                                >
                                    <Sparkles size={16} color={accent} />
                                    <Text style={[tw`text-sm font-black`, { color: palette.textPrimary }]}>
                                        {t('onboardingFlow.firstDone', { defaultValue: "That's day one." })}
                                    </Text>
                                </Animated.View>
                            )}
                        </>
                    )}

                    {screen === 'reminder' && (
                        <View style={[tw`rounded-2xl p-5 items-center`, { backgroundColor: palette.panelSoftBg }]}>
                            <View style={[tw`w-14 h-14 rounded-2xl items-center justify-center`, { backgroundColor: accent + alpha.soft }]}>
                                <Bell size={24} color={accent} />
                            </View>
                            <Text style={[tw`mt-4 text-sm font-bold text-center leading-snug`, { color: palette.textSecondary }]}>
                                {t('onboardingFlow.reminder.body', {
                                    defaultValue: 'We only send it when something is still unticked, and you can turn it off in Settings whenever.',
                                })}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={[tw`px-6 pt-3`, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
                    <TouchableOpacity
                        onPress={() => {
                            if (screen === 'reminder') return finish(true);
                            if (screen === 'first') return finish(false);
                            return goNext();
                        }}
                        disabled={!canContinue || busy}
                        accessibilityRole="button"
                        style={[
                            tw`h-13 rounded-2xl flex-row items-center justify-center gap-2`,
                            {
                                height: 52,
                                backgroundColor: canContinue ? accent : palette.panelSoftBg,
                                opacity: busy ? 0.6 : 1,
                            },
                        ]}
                    >
                        {busy
                            ? <ActivityIndicator size="small" color={readableOn(accent)} />
                            : (
                                <>
                                    <Text style={[
                                        tw`text-sm font-black uppercase tracking-widest`,
                                        { color: canContinue ? readableOn(accent) : palette.textMuted },
                                    ]}>
                                        {primaryLabel}
                                    </Text>
                                    {canContinue && screen !== 'first' && screen !== 'reminder' && (
                                        <ArrowRight size={16} color={readableOn(accent)} strokeWidth={3} />
                                    )}
                                </>
                            )}
                    </TouchableOpacity>

                    {screen === 'reminder' && (
                        <TouchableOpacity
                            onPress={() => finish(false)}
                            accessibilityRole="button"
                            style={tw`h-11 items-center justify-center mt-1`}
                        >
                            <Text style={[tw`text-[11px] font-black uppercase tracking-widest`, { color: palette.textMuted }]}>
                                {t('onboardingFlow.notNow', { defaultValue: 'Not now' })}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Modal
                    visible={showLanguages}
                    transparent
                    animationType="slide"
                    statusBarTranslucent
                    onRequestClose={() => setShowLanguages(false)}
                >
                    <View style={tw`flex-1 justify-end bg-black/50`}>
                        <View style={[
                            tw`rounded-t-3xl px-5 pt-5`,
                            { backgroundColor: palette.panelBg, paddingBottom: Math.max(insets.bottom, 16) + 8 },
                        ]}>
                            <Text style={[tw`text-base font-black uppercase tracking-widest mb-4`, { color: palette.textPrimary }]}>
                                {t('settings.language.title')}
                            </Text>
                            <View style={tw`flex-row flex-wrap gap-2`}>
                                {LANGUAGES.map((lang) => {
                                    const isSel = language === lang.code;
                                    return (
                                        <TouchableOpacity
                                            key={lang.code}
                                            onPress={() => {
                                                onLanguageChange?.(lang.code);
                                                setShowLanguages(false);
                                            }}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: isSel }}
                                            style={[
                                                tw`px-4 h-11 rounded-2xl items-center justify-center border-2`,
                                                isSel
                                                    ? { borderColor: accent, backgroundColor: accent + alpha.soft }
                                                    : { borderColor: palette.cardBorder, backgroundColor: palette.panelSoftBg },
                                            ]}
                                        >
                                            <Text style={[
                                                tw`text-sm font-bold`,
                                                { color: isSel ? palette.textPrimary : palette.textSecondary },
                                            ]}>
                                                {lang.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};
