import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Globe, Palette, Calendar, Sparkles, X, CheckSquare, ListTodo, Check, Save } from 'lucide-react-native';
import tw from 'twrnc';
import { THEMES, MOODS } from '../constants';

const THEME_NAME_KEYS = {
  'Sage & Rose': 'sageRose',
  'Ocean & Sky': 'oceanSky',
  'Sunset & Clay': 'sunsetClay',
  'Lavender & Slate': 'lavenderSlate',
  'Forest & Earth': 'forestEarth',
  'Peach & Mint': 'peachMint',
  'Lilac & Cream': 'lilacCream',
  'Dusty Blue & Mauve': 'dustyBlueMauve',
  'Coral & Sand': 'coralSand',
  'Mint & Blush': 'mintBlush',
  'Honey & Fog': 'honeyFog',
  'Plum & Sage': 'plumSage',
  Monochrome: 'monochrome'
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' }
];

const STEP_CONFIG = [
  {
    key: 'language',
    title: 'Choose language',
    subtitle: 'Set your app language. You can change this later in Settings.',
    icon: Globe
  },
  {
    key: 'theme',
    title: 'Choose color',
    subtitle: 'Pick the same HabiCard color pairing used across the app.',
    icon: Palette
  },
  {
    key: 'cardStyle',
    title: 'Choose card size',
    subtitle: 'Preview both card layouts and pick the one you want as default.',
    icon: CheckSquare
  },
  {
    key: 'habitsDemo',
    title: 'Habits in one place',
    subtitle: 'Check off all your habits in one place.',
    icon: CheckSquare
  },
  {
    key: 'tasksDemo',
    title: 'Tasks made simple',
    subtitle: 'Create Tasks and Check them off as you are done.',
    icon: ListTodo
  },
  {
    key: 'journalDemo',
    title: 'Journal every day',
    subtitle: 'Update daily Journal. This is where you can type into the journal.',
    icon: Sparkles
  },
  {
    key: 'weekStart',
    title: 'Start of week',
    subtitle: 'Choose whether your week starts on Sunday or Monday.',
    icon: Calendar
  }
];

export const OnboardingModal = ({
  visible,
  isDark,
  theme,
  initialLanguage,
  initialWeekStart,
  initialCardStyle,
  onLanguageChange,
  onThemeChange,
  onCardStyleChange,
  onWeekStartChange,
  onComplete,
  onClose
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage || 'en');
  const [selectedTheme, setSelectedTheme] = useState(theme || THEMES[1]);
  const [selectedCardStyle, setSelectedCardStyle] = useState(initialCardStyle || 'compact');
  const [selectedWeekStart, setSelectedWeekStart] = useState(initialWeekStart || 'MON');
  const [submitting, setSubmitting] = useState(false);

  const [habitDemoDone, setHabitDemoDone] = useState([false, false, false, false, false]);
  const [taskDraft, setTaskDraft] = useState('');
  const [taskItems, setTaskItems] = useState([]);
  const [journalMoodIdx, setJournalMoodIdx] = useState(0);
  const [journalDemoText, setJournalDemoText] = useState('');
  const tt = (key, options = {}) => t(key, { lng: selectedLanguage, ...options });
  const steps = useMemo(
    () => STEP_CONFIG.map((item) => ({
      ...item,
      title: tt(`onboarding.steps.${item.key}.title`),
      subtitle: tt(`onboarding.steps.${item.key}.subtitle`)
    })),
    [selectedLanguage, t]
  );
  const stepMeta = useMemo(() => steps[step], [step, steps]);
  const Icon = stepMeta.icon;
  const habitDemoItems = useMemo(() => tt('onboarding.habits', { returnObjects: true }), [selectedLanguage, t]);
  const habitInstructionRows = useMemo(() => ([
    {
      key: 'tap',
      label: tt('onboarding.habitInstructions.tap'),
      box: (
        <View style={[tw`w-5 h-5 rounded-sm border-2 border-black items-center justify-center`, { backgroundColor: '#000000' }]}>
          <Check size={12} color="#ffffff" strokeWidth={3.5} />
        </View>
      )
    },
    {
      key: 'hold',
      label: tt('onboarding.habitInstructions.hold'),
      box: (
        <View style={[tw`w-5 h-5 rounded-sm border-2 border-black items-center justify-center`, { backgroundColor: '#facc15' }]} />
      )
    },
    {
      key: 'empty',
      label: tt('onboarding.habitInstructions.empty'),
      box: (
        <View style={[tw`w-5 h-5 rounded-sm border-2 border-black items-center justify-center`, { backgroundColor: '#ffffff' }]} />
      )
    }
  ]), [t, selectedLanguage]);
  const taskSamples = useMemo(() => tt('onboarding.taskSamples', { returnObjects: true }), [selectedLanguage, t]);
  const journalSample = tt('onboarding.journalSample');

  useEffect(() => {
    if (!visible) return;

    setStep(0);
    setSelectedLanguage(initialLanguage || 'en');
    setSelectedTheme(theme || THEMES[1]);
    setSelectedCardStyle(initialCardStyle || 'compact');
    setSelectedWeekStart(initialWeekStart || 'MON');
    setSubmitting(false);

    setHabitDemoDone([false, false, false, false, false]);
    setTaskDraft('');
    setTaskItems([]);
    setJournalMoodIdx(0);
    setJournalDemoText('');
  }, [visible, initialCardStyle, initialLanguage, initialWeekStart, theme]);

  useEffect(() => {
    if (!visible || stepMeta.key !== 'habitsDemo') return undefined;

    let cancelled = false;
    const run = async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      while (!cancelled) {
        setHabitDemoDone([false, false, false, false, false]);
        await wait(500);
        if (cancelled) break;
        setHabitDemoDone((prev) => prev.map((v, i) => (i === 0 ? true : v)));
        await wait(550);
        if (cancelled) break;
        setHabitDemoDone((prev) => prev.map((v, i) => (i === 1 ? true : v)));
        await wait(550);
        if (cancelled) break;
        setHabitDemoDone((prev) => prev.map((v, i) => (i === 2 ? true : v)));
        await wait(1150);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [stepMeta.key, visible]);

  useEffect(() => {
    if (!visible || stepMeta.key !== 'tasksDemo') return undefined;

    let cancelled = false;
    const run = async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      while (!cancelled) {
        setTaskItems([]);
        setTaskDraft('');

        const first = taskSamples[0];
        for (let i = 1; i <= first.length; i += 1) {
          if (cancelled) return;
          setTaskDraft(first.slice(0, i));
          await wait(45);
        }

        await wait(250);
        if (cancelled) return;
        setTaskItems([{ text: first, done: false }]);
        setTaskDraft('');

        await wait(550);
        if (cancelled) return;
        setTaskItems([{ text: first, done: true }]);

        await wait(350);
        if (cancelled) return;

        const second = taskSamples[1];
        for (let i = 1; i <= second.length; i += 1) {
          if (cancelled) return;
          setTaskDraft(second.slice(0, i));
          await wait(40);
        }

        await wait(250);
        if (cancelled) return;
        setTaskItems((prev) => [...prev, { text: second, done: false }]);
        setTaskDraft('');

        await wait(500);
        if (cancelled) return;
        setTaskItems((prev) => prev.map((item, idx) => (idx === 1 ? { ...item, done: true } : item)));

        await wait(1000);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [stepMeta.key, taskSamples, visible]);

  useEffect(() => {
    if (!visible || stepMeta.key !== 'journalDemo') return undefined;

    let cancelled = false;
    const run = async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const sample = journalSample;

      while (!cancelled) {
        setJournalMoodIdx(0);
        setJournalDemoText('');
        await wait(350);
        if (cancelled) return;

        setJournalMoodIdx(1);
        await wait(450);
        if (cancelled) return;
        setJournalMoodIdx(2);
        await wait(450);
        if (cancelled) return;
        setJournalMoodIdx(3);
        await wait(350);
        if (cancelled) return;

        for (let i = 1; i <= sample.length; i += 1) {
          if (cancelled) return;
          setJournalDemoText(sample.slice(0, i));
          await wait(32);
        }
        await wait(1100);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [journalSample, stepMeta.key, visible]);

  const handleNext = async () => {
    if (submitting) return;

    if (stepMeta.key === 'language') {
      await onLanguageChange(selectedLanguage);
    }

    if (stepMeta.key === 'theme') {
      await onThemeChange(selectedTheme);
    }

    if (stepMeta.key === 'cardStyle') {
      await onCardStyleChange(selectedCardStyle);
    }

    if (stepMeta.key === 'weekStart') {
      await onWeekStartChange(selectedWeekStart);
    }

    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    setSubmitting(true);
    try {
      await onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = !submitting;
  const demoDate = new Date();
  const localeTag = selectedLanguage === 'pt' ? 'pt-PT' : selectedLanguage;
  const demoDay = demoDate.toLocaleDateString(localeTag, { weekday: 'long' });
  const demoDateText = demoDate.toLocaleDateString(localeTag, { month: 'short', day: 'numeric', year: 'numeric' });
  const completedDemoHabits = habitDemoDone.filter(Boolean).length;
  const demoHabitPercent = Math.round((completedDemoHabits / habitDemoItems.length) * 100);
  const isShortScreen = screenHeight < 760;
  const pickerTileWidth = isShortScreen ? '48%' : '31%';
  const outlineColor = isDark ? '#ffffff' : '#000000';
  const styleOptionWidth = '100%';
  const pickerMaxHeight = isShortScreen ? 300 : 420;
  const pickerHeaderFont = isShortScreen ? tw`text-base` : tw`text-lg`;
  const styleCardWidth = isCompactPreview => (isShortScreen ? (isCompactPreview ? 164 : 148) : (isCompactPreview ? 192 : 176));
  const renderCardStylePreview = (styleKey) => {
    const selected = selectedCardStyle === styleKey;
    const isCompactPreview = styleKey === 'compact';
    const panelBorderColor = selected ? outlineColor : (isDark ? '#525252' : '#a8a29e');
    const panelBg = isDark ? '#111111' : '#f5f5f4';
    const cardBg = isDark ? '#171717' : '#f8f7f5';
    const mutedLine = isDark ? '#3f3f46' : '#d6d3d1';

    return (
      <TouchableOpacity
        key={styleKey}
        onPress={() => setSelectedCardStyle(styleKey)}
        style={[
          tw`rounded-[28px] border-2 overflow-hidden mb-3`,
          {
            width: styleOptionWidth,
            borderColor: panelBorderColor,
            backgroundColor: panelBg
          }
        ]}
      >
        <View style={[tw`p-4`, isShortScreen && { padding: 12 }]}>
          <View
            style={[
              tw`rounded-[22px] border-2 overflow-hidden self-center`,
              {
                width: styleCardWidth(isCompactPreview),
                backgroundColor: cardBg,
                borderColor: outlineColor
              }
            ]}
          >
            <View style={[tw`px-3 py-3`, { backgroundColor: selectedTheme.secondary }]}>
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`pr-2`}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[tw`text-white font-black uppercase`, isCompactPreview ? tw`text-[15px]` : tw`text-[16px]`]}
                  >
                    {demoDay}
                  </Text>
                  <Text numberOfLines={1} style={tw`text-white/90 font-bold text-[10px] mt-1`}>{demoDateText}</Text>
                </View>
                {isCompactPreview ? (
                  <View
                    style={[
                      tw`rounded-full items-center justify-center border-[5px]`,
                      {
                        width: isShortScreen ? 46 : 56,
                        height: isShortScreen ? 46 : 56,
                        borderColor: 'rgba(255,255,255,0.75)',
                        borderRightColor: '#ffffff'
                      }
                    ]}
                  >
                    <Text style={[tw`text-white font-black`, isShortScreen ? tw`text-[13px]` : tw`text-base`]}>40</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={[tw`items-center justify-center`, { paddingVertical: isCompactPreview ? (isShortScreen ? 18 : 24) : (isShortScreen ? 18 : 26), paddingHorizontal: isShortScreen ? 12 : 16 }]}>
              {isCompactPreview ? null : (
                <View
                  style={[
                    tw`rounded-full items-center justify-center mb-4`,
                    {
                      width: isShortScreen ? 76 : 96,
                      height: isShortScreen ? 76 : 96,
                      borderWidth: isShortScreen ? 8 : 10,
                      borderColor: '#d6d3d1',
                      borderRightColor: selectedTheme.secondary
                    }
                  ]}
                >
                  <Text style={[tw`font-black`, { color: isDark ? '#f3f4f6' : '#44403c', fontSize: isShortScreen ? 16 : 18 }]}>40%</Text>
                </View>
              )}

              <View style={[tw`rounded-full`, { width: isCompactPreview ? (isShortScreen ? 110 : 128) : (isShortScreen ? 118 : 136), height: 14, backgroundColor: mutedLine }]} />
              <View style={[tw`rounded-full mt-3`, { width: isCompactPreview ? (isShortScreen ? 82 : 96) : (isShortScreen ? 92 : 112), height: 14, backgroundColor: mutedLine }]} />
            </View>
          </View>

          <View style={[tw`pt-4`, isShortScreen && { paddingTop: 12 }]}>
            <Text style={[tw`font-black uppercase`, isCompactPreview ? (isShortScreen ? tw`text-[24px]` : tw`text-2xl`) : (isShortScreen ? tw`text-[26px]` : tw`text-[30px]`), { color: isDark ? '#f3f4f6' : '#44403c' }]}>
              {tt(`onboarding.cardStyleLabels.${styleKey}`)}
            </Text>
            <Text style={[tw`mt-2 font-medium`, { color: isDark ? '#d6d3d1' : '#78716c', fontSize: isShortScreen ? 14 : 16, lineHeight: isShortScreen ? 22 : 28 }]}>
              {isCompactPreview
                ? tt('onboarding.cardStyleDescriptions.compact')
                : tt('onboarding.cardStyleDescriptions.large')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f5f5f4' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[tw`flex-1 px-5 pb-4`, { paddingTop: Math.max(16, insets.top + 8) }]}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={[tw`text-[11px] font-black uppercase tracking-widest`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {tt('onboarding.step')} {step + 1} / {steps.length}
              </Text>
              <View style={tw`flex-row items-center`}>
                <View style={[tw`px-2 py-1 rounded-full`, { backgroundColor: isDark ? '#141414' : '#e5e7eb' }]}>
                  <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#d1d5db' : '#4b5563' }]}>{tt('onboarding.badge')}</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[tw`ml-2 w-8 h-8 rounded-full items-center justify-center border-2`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#2a2a2a' : '#d1d5db' }]}
                >
                  <X size={14} color={isDark ? '#d1d5db' : '#4b5563'} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[tw`flex-1 rounded-3xl p-5 border-2`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#2a2a2a' : '#000000' }]}>
              <View style={tw`flex-row items-center mb-3`}>
                <View style={[tw`w-9 h-9 rounded-full items-center justify-center mr-3`, { backgroundColor: selectedTheme.primary }]}>
                  <Icon size={18} color="#ffffff" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-lg font-black`, { color: isDark ? '#f3f4f6' : '#111827' }]}>{stepMeta.title}</Text>
                  <Text style={[tw`text-xs font-bold mt-1`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{stepMeta.subtitle}</Text>
                  {stepMeta.key === 'habitsDemo' ? (
                    <View style={tw`mt-3`}>
                      {habitInstructionRows.map((item) => (
                        <View key={item.key} style={tw`flex-row items-center mb-2`}>
                          {item.box}
                          <Text style={[tw`text-[11px] font-bold ml-2 flex-1`, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                            {item.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>

              {stepMeta.key === 'language' && (
                <View style={tw`mt-2 flex-1`}>
                  <View style={tw`mb-6`}>
                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />
                    <View style={[tw`rounded-3xl overflow-hidden border-[3px] border-black`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#ffffff' : '#000000' }]}>
                      <View style={[tw`p-4 border-b-[3px] border-black`, { backgroundColor: selectedTheme.primary, borderBottomColor: isDark ? '#ffffff' : '#000000' }]}>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[tw`font-black uppercase text-white tracking-widest`, pickerHeaderFont]}
                        >
                          {tt('onboarding.languageTitle')}
                        </Text>
                      </View>
                      <ScrollView style={{ maxHeight: pickerMaxHeight }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                        <View style={tw`flex-row flex-wrap justify-between`}>
                          {LANGUAGES.map((lang) => {
                            const selected = selectedLanguage === lang.code;
                            return (
                              <TouchableOpacity
                                key={lang.code}
                                onPress={() => setSelectedLanguage(lang.code)}
                                style={[
                                  tw`aspect-square rounded-2xl items-center justify-center border-2 mb-3`,
                                  {
                                    width: pickerTileWidth,
                                    borderColor: selected ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#262626' : '#f3f4f6'),
                                    backgroundColor: selected ? (isDark ? '#111827' : '#f9fafb') : (isDark ? '#0b0b0b' : '#ffffff')
                                  }
                                ]}
                              >
                                <Text style={[tw`text-base font-black uppercase mb-1`, { color: selectedTheme.primary }]}>{lang.code.toUpperCase()}</Text>
                                <Text style={[tw`text-[10px] font-bold text-center px-2`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{lang.label}</Text>
                                {selected ? (
                                  <View style={tw`absolute top-1 right-1`}>
                                    <Check size={10} color={isDark ? '#ffffff' : '#000000'} strokeWidth={4} />
                                  </View>
                                ) : null}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}

              {stepMeta.key === 'theme' && (
                <View style={tw`mt-2 flex-1`}>
                  <View style={tw`mb-6`}>
                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />
                    <View style={[tw`rounded-3xl overflow-hidden border-[3px] border-black`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#ffffff' : '#000000' }]}>
                      <View style={[tw`p-4 border-b-[3px] border-black`, { backgroundColor: selectedTheme.primary, borderBottomColor: isDark ? '#ffffff' : '#000000' }]}>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[tw`font-black uppercase text-white tracking-widest`, pickerHeaderFont]}
                        >
                          {tt('settings.theme.select')}
                        </Text>
                      </View>
                      <ScrollView style={{ maxHeight: pickerMaxHeight }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                        <View style={tw`flex-row flex-wrap justify-between`}>
                          {THEMES.map((item) => {
                            const selected = selectedTheme.name === item.name;
                            return (
                              <TouchableOpacity
                                key={item.name}
                                onPress={() => setSelectedTheme(item)}
                                style={[
                                  tw`aspect-square rounded-2xl items-center justify-center border-2 mb-3`,
                                  {
                                    width: pickerTileWidth,
                                    borderColor: selected ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#262626' : '#f3f4f6'),
                                    backgroundColor: selected ? (isDark ? '#111827' : '#f9fafb') : (isDark ? '#0b0b0b' : '#ffffff')
                                  }
                                ]}
                              >
                                <View style={tw`flex-row mb-2`}>
                                  <View style={[tw`w-5 h-5 rounded-full border border-black z-10`, { backgroundColor: item.primary }]} />
                                  <View style={[tw`w-5 h-5 rounded-full border border-black -ml-2`, { backgroundColor: item.secondary }]} />
                                </View>
                                <Text
                                  numberOfLines={2}
                                  style={[tw`text-[10px] font-black uppercase text-center px-2`, { color: item.primary }]}
                                >
                                  {tt(`onboarding.themeNames.${THEME_NAME_KEYS[item.name] || 'monochrome'}`)}
                                </Text>
                                {selected ? (
                                  <View style={tw`absolute top-1 right-1`}>
                                    <Check size={10} color={isDark ? '#ffffff' : '#000000'} strokeWidth={4} />
                                  </View>
                                ) : null}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}

              {stepMeta.key === 'cardStyle' && (
                <View style={tw`mt-2 flex-1`}>
                  <View style={tw`mb-6`}>
                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />
                    <View style={[tw`rounded-3xl overflow-hidden border-[3px] border-black`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: outlineColor }]}>
                      <View style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}>
                        <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#161616' }]}>{tt('onboarding.cardStyleTitle')}</Text>
                        <View style={[tw`flex-row p-1 rounded-xl border-2 border-black`, { backgroundColor: isDark ? '#161616' : '#f3f4f6', borderColor: outlineColor }]}>
                          <TouchableOpacity
                            onPress={() => setSelectedCardStyle('compact')}
                            style={[tw`px-3 py-1.5 rounded-lg`, selectedCardStyle === 'compact' && { backgroundColor: selectedTheme.primary }]}
                          >
                            <Text style={[tw`text-[10px] font-black uppercase`, selectedCardStyle === 'compact' ? tw`text-white` : { color: isDark ? '#9ca3af' : '#9ca3af' }]}>{tt('onboarding.cardStyleLabels.compact')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setSelectedCardStyle('large')}
                            style={[tw`px-3 py-1.5 rounded-lg`, selectedCardStyle === 'large' && { backgroundColor: selectedTheme.primary }]}
                          >
                            <Text style={[tw`text-[10px] font-black uppercase`, selectedCardStyle === 'large' ? tw`text-white` : { color: isDark ? '#9ca3af' : '#9ca3af' }]}>{tt('onboarding.cardStyleLabels.large')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <ScrollView
                        style={{ maxHeight: isShortScreen ? 350 : 430 }}
                        contentContainerStyle={{ padding: 16 }}
                        showsVerticalScrollIndicator={false}
                      >
                        <View>
                          {renderCardStylePreview(selectedCardStyle)}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}

              {stepMeta.key === 'habitsDemo' && (
                <View style={tw`flex-1 items-center justify-center`}>
                  <View style={[tw`w-full max-w-[320px] rounded-2xl border-[3px] border-black overflow-hidden`, { backgroundColor: '#ffffff' }]}>
                    <View style={[tw`px-4 py-3 border-b-[3px] border-black`, { backgroundColor: selectedTheme.primary }]}>
                      <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`pr-2`}>
                          <Text style={tw`text-white font-black text-lg leading-none`}>{demoDay}</Text>
                          <Text style={tw`text-white/90 font-bold text-[11px] tracking-wide mt-1`}>{demoDateText}</Text>
                        </View>
                        <View style={tw`w-11 h-11 rounded-full border-2 border-white items-center justify-center`}>
                          <Text style={tw`text-white text-[10px] font-black`}>{demoHabitPercent}%</Text>
                        </View>
                      </View>
                    </View>
                    <View style={tw`p-4`}>
                      {habitDemoItems.map((name, idx) => {
                        const done = habitDemoDone[idx];
                        return (
                          <View key={name} style={tw`flex-row items-center justify-between mb-3`}>
                            <Text style={[tw`font-black text-sm`, done ? tw`text-gray-400 line-through` : tw`text-gray-800`]}>{name}</Text>
                            <View style={[tw`w-6 h-6 rounded-sm border-2 border-black items-center justify-center`, { backgroundColor: done ? '#000000' : '#ffffff' }]}>
                              {done ? <Check size={14} color="#ffffff" strokeWidth={3.5} /> : null}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    <View style={tw`border-t-[3px] border-black flex-row`}>
                      <View style={tw`flex-1 items-center py-2 border-r-[1.5px] border-black`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('common.myHabits')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-900 mt-1`}>{completedDemoHabits}/{habitDemoItems.length}</Text>
                      </View>
                      <View style={tw`flex-1 items-center py-2 border-r-[1.5px] border-black`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('dailyCard.tasks')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-500 mt-1`}>+</Text>
                      </View>
                      <View style={tw`flex-1 items-center py-2`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('dailyCard.journal')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-500 mt-1`}>+</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {stepMeta.key === 'tasksDemo' && (
                <View style={tw`flex-1 items-center justify-center`}>
                  <View style={[tw`w-full max-w-[320px] rounded-2xl border-[3px] border-black overflow-hidden`, { backgroundColor: '#ffffff' }]}>
                    <View style={[tw`px-4 py-3 border-b-[3px] border-black`, { backgroundColor: selectedTheme.primary }]}>
                      <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`pr-2`}>
                          <Text style={tw`text-white font-black text-lg leading-none`}>{demoDay}</Text>
                          <Text style={tw`text-white/90 font-bold text-[11px] tracking-wide mt-1`}>{demoDateText}</Text>
                        </View>
                        <View style={tw`w-11 h-11 rounded-full border-2 border-white items-center justify-center`}>
                          <Text style={tw`text-white text-[10px] font-black`}>
                            {taskItems.length === 0 ? '0%' : `${Math.round((taskItems.filter((t) => t.done).length / taskItems.length) * 100)}%`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={tw`p-4`}>
                      <View style={[tw`mb-3 border-2 border-black rounded-xl px-3 py-2`, { backgroundColor: '#f9fafb' }]}>
                        <Text style={tw`text-xs font-bold text-gray-500`}>{taskDraft || tt('tasks.placeholder')}</Text>
                      </View>
                      {taskItems.map((task, idx) => (
                        <View key={`${task.text}-${idx}`} style={tw`flex-row items-center justify-between mb-2`}>
                          <Text style={[tw`font-black text-sm`, task.done ? tw`text-gray-400 line-through` : tw`text-gray-800`]}>{task.text}</Text>
                          <View style={[tw`w-5 h-5 rounded-sm border-2 border-black items-center justify-center`, { backgroundColor: task.done ? '#000000' : '#ffffff' }]}>
                            {task.done ? <Check size={12} color="#ffffff" strokeWidth={3.5} /> : null}
                          </View>
                        </View>
                      ))}
                    </View>
                    <View style={tw`border-t-[3px] border-black flex-row`}>
                      <View style={tw`flex-1 items-center py-2 border-r-[1.5px] border-black`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('common.myHabits')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-500 mt-1`}>+</Text>
                      </View>
                      <View style={tw`flex-1 items-center py-2 border-r-[1.5px] border-black`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('dailyCard.tasks')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-900 mt-1`}>
                          {taskItems.filter((t) => t.done).length}/{Math.max(taskItems.length, 1)}
                        </Text>
                      </View>
                      <View style={tw`flex-1 items-center py-2`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('dailyCard.journal')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-500 mt-1`}>+</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {stepMeta.key === 'journalDemo' && (
                <View style={tw`flex-1 items-center justify-center`}>
                  <View style={[tw`w-full max-w-[320px] rounded-2xl border-[3px] border-black overflow-hidden`, { backgroundColor: '#ffffff' }]}>
                    <View style={[tw`px-4 py-3 border-b-[3px] border-black`, { backgroundColor: selectedTheme.primary }]}>
                      <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`pr-2`}>
                          <Text style={tw`text-white font-black text-lg leading-none`}>{demoDay}</Text>
                          <Text style={tw`text-white/90 font-bold text-[11px] tracking-wide mt-1`}>{demoDateText}</Text>
                        </View>
                        <View style={tw`w-11 h-11 rounded-full border-2 border-white items-center justify-center`}>
                          <Text style={tw`text-white text-[10px] font-black`}>78%</Text>
                        </View>
                      </View>
                    </View>
                    <View style={tw`p-4`}>
                      <Text style={tw`text-xs font-black uppercase tracking-widest text-center mb-4 text-gray-500`}>
                        {tt('journal.prompt')}
                      </Text>
                      <View style={tw`flex-row justify-between mb-6`}>
                        {MOODS.map((mood) => {
                          const MoodIcon = mood.icon;
                          const isSelected = journalMoodIdx + 1 === mood.value;
                          return (
                            <TouchableOpacity
                              key={mood.value}
                              activeOpacity={1}
                              style={[
                                tw`items-center p-1.5 rounded-lg border-2`,
                                isSelected ? { borderColor: mood.color, backgroundColor: `${mood.color}20` } : tw`border-transparent`
                              ]}
                            >
                              <MoodIcon
                                size={26}
                                color={isSelected ? mood.color : '#d6d3d1'}
                                strokeWidth={isSelected ? 2.5 : 2}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={tw`relative mb-1`}>
                        <TextInput
                          editable={false}
                          multiline
                          value={journalDemoText || journalSample}
                          style={[
                            tw`border-[3px] p-4 pb-14 rounded-xl text-base font-medium leading-relaxed`,
                            {
                              height: 170,
                              backgroundColor: '#f9fafb',
                              borderColor: '#e5e7eb',
                              color: '#161616'
                            }
                          ]}
                        />
                        <View style={tw`absolute right-3 bottom-3 w-9 h-9 rounded-full border-2 border-black items-center justify-center bg-black`}>
                          <Save size={14} color="#ffffff" />
                        </View>
                      </View>
                    </View>
                    <View style={tw`border-t-[3px] border-black flex-row`}>
                      <View style={tw`flex-1 items-center py-2 border-r-[1.5px] border-black`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('common.myHabits')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-500 mt-1`}>+</Text>
                      </View>
                      <View style={tw`flex-1 items-center py-2 border-r-[1.5px] border-black`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('dailyCard.tasks')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-500 mt-1`}>+</Text>
                      </View>
                      <View style={tw`flex-1 items-center py-2`}>
                        <Text style={tw`text-[9px] font-black uppercase text-gray-600`}>{tt('dailyCard.journal')}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-900 mt-1`}>✓</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {stepMeta.key === 'weekStart' && (
                <View style={tw`mt-2`}>
                  <View style={tw`mb-6`}>
                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />
                    <View style={[tw`rounded-3xl overflow-hidden border-[3px] border-black`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#ffffff' : '#000000' }]}>
                      <View style={[tw`flex-row items-center justify-between p-4`, { borderBottomWidth: 3, borderBottomColor: isDark ? '#ffffff' : '#000000' }]}>
                        <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#161616' }]}>{tt('settings.general.startOfWeek')}</Text>
                        <View style={[tw`flex-row p-1 rounded-xl border-2 border-black`, { backgroundColor: isDark ? '#161616' : '#f3f4f6', borderColor: isDark ? '#ffffff' : '#000000' }]}>
                          <TouchableOpacity
                            onPress={() => setSelectedWeekStart('SUN')}
                            style={[tw`px-3 py-1.5 rounded-lg`, selectedWeekStart === 'SUN' && { backgroundColor: selectedTheme.primary }]}
                          >
                            <Text style={[tw`text-[10px] font-black`, selectedWeekStart === 'SUN' ? tw`text-white` : { color: isDark ? '#9ca3af' : '#9ca3af' }]}>{tt('onboarding.weekStartOptions.sun')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setSelectedWeekStart('MON')}
                            style={[tw`px-3 py-1.5 rounded-lg`, selectedWeekStart === 'MON' && { backgroundColor: selectedTheme.primary }]}
                          >
                            <Text style={[tw`text-[10px] font-black`, selectedWeekStart === 'MON' ? tw`text-white` : { color: isDark ? '#9ca3af' : '#9ca3af' }]}>{tt('onboarding.weekStartOptions.mon')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={tw`pt-4 mt-2 flex-row items-center justify-between`}>
              <TouchableOpacity
                onPress={() => setStep((prev) => Math.max(prev - 1, 0))}
                disabled={step === 0 || submitting}
                style={[
                  tw`flex-row items-center px-4 py-3 rounded-xl border-2`,
                  {
                    borderColor: step === 0 ? (isDark ? '#1f2937' : '#d1d5db') : (isDark ? '#374151' : '#9ca3af'),
                    backgroundColor: isDark ? '#0b0b0b' : '#ffffff',
                    opacity: step === 0 ? 0.5 : 1
                  }
                ]}
              >
                <ChevronLeft size={16} color={isDark ? '#d1d5db' : '#374151'} />
                <Text style={[tw`ml-1 text-xs font-black uppercase`, { color: isDark ? '#d1d5db' : '#374151' }]}>{tt('onboarding.back')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                disabled={!canContinue}
                style={[
                  tw`flex-row items-center px-5 py-3 rounded-xl border-2 border-black`,
                  {
                    backgroundColor: selectedTheme.primary,
                    opacity: canContinue ? 1 : 0.6
                  }
                ]}
              >
                <Text style={tw`text-white text-xs font-black uppercase tracking-wide`}>
                  {step === steps.length - 1 ? (submitting ? tt('onboarding.saving') : tt('onboarding.finish')) : tt('onboarding.next')}
                </Text>
                <ChevronRight size={16} color="#ffffff" style={tw`ml-1`} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
