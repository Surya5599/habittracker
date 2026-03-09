import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Globe, Palette, Calendar, Sparkles } from 'lucide-react-native';
import tw from 'twrnc';
import { THEMES } from '../constants';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
  { code: 'fr', label: 'Francais' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Portugues' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' }
];

const STEPS = [
  {
    key: 'language',
    title: 'Choose language',
    subtitle: 'Set your app language. You can change this later in Settings.',
    icon: Globe
  },
  {
    key: 'theme',
    title: 'Choose theme',
    subtitle: 'Pick colors for your cards and highlights.',
    icon: Palette
  },
  {
    key: 'weekStart',
    title: 'Start of week',
    subtitle: 'Choose whether your week starts on Sunday or Monday.',
    icon: Calendar
  },
  {
    key: 'firstHabit',
    title: 'Create your first habit',
    subtitle: 'Start with one habit now. You can add more anytime.',
    icon: Sparkles
  }
];

export const OnboardingModal = ({
  visible,
  isDark,
  theme,
  initialLanguage,
  initialWeekStart,
  onLanguageChange,
  onThemeChange,
  onWeekStartChange,
  onCreateFirstHabit,
  onComplete
}) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage || 'en');
  const [selectedTheme, setSelectedTheme] = useState(theme || THEMES[1]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(initialWeekStart || 'MON');
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setStep(0);
    setSelectedLanguage(initialLanguage || 'en');
    setSelectedTheme(theme || THEMES[1]);
    setSelectedWeekStart(initialWeekStart || 'MON');
    setHabitName('');
    setHabitDescription('');
    setSubmitting(false);
  }, [visible, initialLanguage, initialWeekStart, theme]);

  const stepMeta = useMemo(() => STEPS[step], [step]);

  const handleNext = async () => {
    if (submitting) return;

    if (step === 0) {
      await onLanguageChange(selectedLanguage);
    }

    if (step === 1) {
      await onThemeChange(selectedTheme);
    }

    if (step === 2) {
      await onWeekStartChange(selectedWeekStart);
    }

    if (step < STEPS.length - 1) {
      setStep(prev => prev + 1);
      return;
    }

    setSubmitting(true);
    try {
      if (habitName.trim()) {
        await onCreateFirstHabit({
          name: habitName.trim(),
          description: habitDescription.trim(),
          color: selectedTheme.primary
        });
      }
      await onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue =
    step === 3 ? habitName.trim().length > 0 && !submitting : !submitting;

  const Icon = stepMeta.icon;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f5f5f4' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[tw`flex-1 px-5 pb-4`, { paddingTop: Math.max(10, insets.top * 0.35) }]}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={[tw`text-[11px] font-black uppercase tracking-widest`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Step {step + 1} / {STEPS.length}
              </Text>
              <View style={[tw`px-2 py-1 rounded-full`, { backgroundColor: isDark ? '#141414' : '#e5e7eb' }]}>
                <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#d1d5db' : '#4b5563' }]}>Onboarding</Text>
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
                </View>
              </View>

              {step === 0 && (
                <View style={tw`mt-2 flex-1`}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={tw`flex-1`}
                    contentContainerStyle={{ paddingBottom: 8 }}
                  >
                    {LANGUAGES.map(lang => {
                      const selected = selectedLanguage === lang.code;
                      return (
                        <TouchableOpacity
                          key={lang.code}
                          onPress={() => setSelectedLanguage(lang.code)}
                          style={[
                            tw`px-4 py-3 rounded-xl mb-2 border-2`,
                            {
                              borderColor: selected ? selectedTheme.primary : (isDark ? '#2a2a2a' : '#d1d5db'),
                              backgroundColor: selected
                                ? (isDark ? '#111827' : '#eef2ff')
                                : (isDark ? '#0b0b0b' : '#ffffff')
                            }
                          ]}
                        >
                          <Text style={[tw`font-black uppercase text-xs`, { color: isDark ? '#f3f4f6' : '#111827' }]}>{lang.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {step === 1 && (
                <View style={tw`mt-2 flex-1`}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={tw`flex-1`}
                    contentContainerStyle={{ paddingBottom: 8 }}
                  >
                    {THEMES.map(item => {
                      const selected = selectedTheme.name === item.name;
                      return (
                        <TouchableOpacity
                          key={item.name}
                          onPress={() => setSelectedTheme(item)}
                          style={[
                            tw`p-3 rounded-xl mb-2 border-2 flex-row items-center justify-between`,
                            {
                              borderColor: selected ? item.primary : (isDark ? '#2a2a2a' : '#d1d5db'),
                              backgroundColor: selected
                                ? (isDark ? '#111827' : '#ecfeff')
                                : (isDark ? '#0b0b0b' : '#ffffff')
                            }
                          ]}
                        >
                          <Text style={[tw`font-black uppercase text-xs`, { color: isDark ? '#f3f4f6' : '#111827' }]}>{item.name}</Text>
                          <View style={tw`flex-row`}>
                            <View style={[tw`w-6 h-6 rounded-full border-2 border-black`, { backgroundColor: item.primary }]} />
                            <View style={[tw`w-6 h-6 rounded-full border-2 border-black -ml-2`, { backgroundColor: item.secondary }]} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {step === 2 && (
                <View style={tw`mt-2 flex-row`}>
                  <TouchableOpacity
                    onPress={() => setSelectedWeekStart('SUN')}
                    style={[
                      tw`flex-1 mr-2 rounded-2xl py-5 items-center border-2`,
                      {
                        borderColor: selectedWeekStart === 'SUN' ? selectedTheme.primary : (isDark ? '#2a2a2a' : '#d1d5db'),
                        backgroundColor: selectedWeekStart === 'SUN' ? selectedTheme.primary : (isDark ? '#0b0b0b' : '#ffffff')
                      }
                    ]}
                  >
                    <Text style={[tw`text-xs font-black uppercase tracking-widest`, { color: selectedWeekStart === 'SUN' ? '#ffffff' : (isDark ? '#f3f4f6' : '#111827') }]}>SUN</Text>
                    <Text style={[tw`text-[11px] font-bold mt-1`, { color: selectedWeekStart === 'SUN' ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280') }]}>Sunday first</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedWeekStart('MON')}
                    style={[
                      tw`flex-1 ml-2 rounded-2xl py-5 items-center border-2`,
                      {
                        borderColor: selectedWeekStart === 'MON' ? selectedTheme.primary : (isDark ? '#2a2a2a' : '#d1d5db'),
                        backgroundColor: selectedWeekStart === 'MON' ? selectedTheme.primary : (isDark ? '#0b0b0b' : '#ffffff')
                      }
                    ]}
                  >
                    <Text style={[tw`text-xs font-black uppercase tracking-widest`, { color: selectedWeekStart === 'MON' ? '#ffffff' : (isDark ? '#f3f4f6' : '#111827') }]}>MON</Text>
                    <Text style={[tw`text-[11px] font-bold mt-1`, { color: selectedWeekStart === 'MON' ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280') }]}>Monday first</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 3 && (
                <View style={tw`mt-2`}>
                  <Text style={[tw`text-[11px] font-black uppercase tracking-wider mb-1`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Habit name</Text>
                  <TextInput
                    value={habitName}
                    onChangeText={setHabitName}
                    placeholder="Ex: Morning walk"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    style={[
                      tw`border-2 rounded-xl px-4 py-3 text-sm font-bold mb-3`,
                      {
                        borderColor: isDark ? '#2a2a2a' : '#d1d5db',
                        color: isDark ? '#f3f4f6' : '#111827',
                        backgroundColor: isDark ? '#0b0b0b' : '#ffffff'
                      }
                    ]}
                  />

                  <Text style={[tw`text-[11px] font-black uppercase tracking-wider mb-1`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Description (optional)</Text>
                  <TextInput
                    value={habitDescription}
                    onChangeText={setHabitDescription}
                    placeholder="Why this habit matters"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    style={[
                      tw`border-2 rounded-xl px-4 py-3 text-sm font-bold`,
                      {
                        borderColor: isDark ? '#2a2a2a' : '#d1d5db',
                        color: isDark ? '#f3f4f6' : '#111827',
                        backgroundColor: isDark ? '#0b0b0b' : '#ffffff'
                      }
                    ]}
                  />
                </View>
              )}
            </View>

            <View style={tw`pt-4 mt-2 flex-row items-center justify-between`}>
              <TouchableOpacity
                onPress={() => setStep(prev => Math.max(prev - 1, 0))}
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
                <Text style={[tw`ml-1 text-xs font-black uppercase`, { color: isDark ? '#d1d5db' : '#374151' }]}>Back</Text>
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
                  {step === STEPS.length - 1 ? (submitting ? 'Saving...' : 'Finish') : 'Next'}
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
