import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import tw from 'twrnc';

const STEP_DEFS = [
  {
    key: 'add-habit',
    title: 'Create a Habit',
    description: 'Tap the real Add button in the top-left and create one new habit.',
    focus: { x: 0.02, y: 0.005, w: 0.18, h: 0.055 }
  },
  {
    key: 'complete-or-skip-habit',
    title: 'Complete Or Skip Habit',
    description: 'Check off the habit you created. Or long-press it to skip it for today.',
    focus: { x: 0.05, y: 0.33, w: 0.9, h: 0.12 }
  },
  {
    key: 'logs',
    title: 'Open Logs',
    description: 'Use bottom navigation and switch to Logs.',
    focus: { x: 0.44, y: 0.9, w: 0.23, h: 0.08 }
  },
  {
    key: 'analytics',
    title: 'Open Analytics',
    description: 'Use bottom navigation and switch to Analytics.',
    focus: { x: 0.24, y: 0.9, w: 0.23, h: 0.08 }
  },
  {
    key: 'badges',
    title: 'Open Badges',
    description: 'Use bottom navigation and switch to Badges.',
    focus: { x: 0.69, y: 0.9, w: 0.23, h: 0.08 }
  }
];

const isStepCompleted = ({ stepKey, currentView, habitsCount, baselineHabitsCount }) => {
  if (stepKey === 'add-habit') {
    return habitsCount > baselineHabitsCount;
  }
  if (stepKey === 'complete-or-skip-habit') return false;
  if (stepKey === 'logs') return currentView === 'monthly';
  if (stepKey === 'analytics') return currentView === 'dashboard';
  if (stepKey === 'badges') return currentView === 'badges';
  return false;
};

export const HelpTutorialModal = ({
  visible,
  onClose,
  currentView,
  habitsCount = 0,
  baselineHabitsCount = 0,
  habitIds = [],
  baselineHabitIds = [],
  completions = {},
  notes = {},
  colorMode = 'light',
  theme
}) => {
  const isDark = colorMode === 'dark';
  const [stepIndex, setStepIndex] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const pulse = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!visible) return;
    setStepIndex(0);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, visible]);

  const step = useMemo(() => STEP_DEFS[stepIndex], [stepIndex]);
  const createdHabitIds = useMemo(
    () => (habitIds || []).filter((id) => !(baselineHabitIds || []).includes(id)),
    [baselineHabitIds, habitIds]
  );
  const createdHabitCompleted = useMemo(
    () => createdHabitIds.some((id) => Object.values(completions?.[id] || {}).some(Boolean)),
    [completions, createdHabitIds]
  );
  const createdHabitSkipped = useMemo(
    () =>
      createdHabitIds.some((id) =>
        Object.values(notes || {}).some((dayData) => {
          if (!dayData || Array.isArray(dayData)) return false;
          return Array.isArray(dayData.inactiveHabits) && dayData.inactiveHabits.includes(id);
        })
      ),
    [createdHabitIds, notes]
  );

  const baseDone = isStepCompleted({
    stepKey: step?.key,
    currentView,
    habitsCount,
    baselineHabitsCount
  });
  const currentDone = step?.key === 'complete-or-skip-habit'
    ? (createdHabitCompleted || createdHabitSkipped)
    : baseDone;
  const isLast = stepIndex === STEP_DEFS.length - 1;
  const width = containerSize.width || 1;
  const height = containerSize.height || 1;
  const focus = {
    left: Math.round((step?.focus?.x || 0) * width),
    top: Math.round((step?.focus?.y || 0) * height),
    boxWidth: Math.round((step?.focus?.w || 0) * width),
    boxHeight: Math.round((step?.focus?.h || 0) * height)
  };

  if (!visible || !step) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}
      pointerEvents="box-none"
    >
      <SafeAreaView pointerEvents="box-none" style={tw`flex-1`} edges={['top', 'left', 'right', 'bottom']}>
        <View
          style={tw`flex-1 justify-end px-4 pb-4`}
          pointerEvents="box-none"
          onLayout={(e) => {
            const { width: w, height: h } = e.nativeEvent.layout;
            setContainerSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              tw`absolute rounded-2xl border-2`,
              {
                left: focus.left - 2,
                top: focus.top - 2,
                width: focus.boxWidth + 4,
                height: focus.boxHeight + 4,
                borderColor: theme?.primary || '#C19A9A',
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] })
              }
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              tw`absolute rounded-2xl border-2`,
              {
                left: focus.left,
                top: focus.top,
                width: focus.boxWidth,
                height: focus.boxHeight,
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255,255,255,0.05)'
              }
            ]}
          />
          <View
            pointerEvents="auto"
            style={[
              tw`rounded-3xl border-2 p-4`,
              {
                backgroundColor: isDark ? '#0b0b0b' : '#ffffff',
                borderColor: theme?.primary || '#C19A9A',
                marginBottom: step?.key === 'add-habit' ? 58 : 26
              }
            ]}
          >
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Guided Tutorial {stepIndex + 1}/{STEP_DEFS.length}
              </Text>
              <TouchableOpacity onPress={onClose} style={tw`p-1`}>
                <X size={16} color={isDark ? '#d1d5db' : '#374151'} />
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row items-center mt-2`}>
              <Text style={[tw`text-xl font-black`, { color: isDark ? '#f3f4f6' : '#111827' }]}>{step.title}</Text>
              {currentDone ? <CheckCircle2 size={18} color={theme?.primary || '#22c55e'} style={tw`ml-2`} /> : null}
            </View>

            <Text style={[tw`text-sm font-bold mt-2`, { color: isDark ? '#d1d5db' : '#4b5563' }]}>{step.description}</Text>
            <Text style={[tw`text-xs font-black uppercase mt-3 tracking-wide`, { color: currentDone ? (theme?.primary || '#22c55e') : (isDark ? '#f59e0b' : '#b45309') }]}>
              {currentDone ? 'Step completed' : 'Complete this action in the app to continue'}
            </Text>

            <View style={tw`mt-4 flex-row items-center justify-between`}>
              <TouchableOpacity
                onPress={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={stepIndex === 0}
                style={[tw`px-3 py-2 rounded-xl border flex-row items-center`, { borderColor: isDark ? '#374151' : '#d1d5db', opacity: stepIndex === 0 ? 0.5 : 1 }]}
              >
                <ChevronLeft size={14} color={isDark ? '#d1d5db' : '#374151'} />
                <Text style={[tw`text-xs font-black uppercase ml-1`, { color: isDark ? '#d1d5db' : '#374151' }]}>Back</Text>
              </TouchableOpacity>

              <View style={tw`flex-row items-center gap-2`}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[tw`px-3 py-2 rounded-xl border`, { borderColor: isDark ? '#374151' : '#d1d5db' }]}
                >
                  <Text style={[tw`text-xs font-black uppercase`, { color: isDark ? '#d1d5db' : '#374151' }]}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (!currentDone) return;
                    if (isLast) {
                      onClose?.();
                      return;
                    }
                    setStepIndex((prev) => Math.min(STEP_DEFS.length - 1, prev + 1));
                  }}
                  disabled={!currentDone}
                  style={[
                    tw`px-3 py-2 rounded-xl flex-row items-center border`,
                    { borderColor: isDark ? '#374151' : '#d1d5db', opacity: currentDone ? 1 : 0.5 }
                  ]}
                >
                  <Text style={[tw`text-xs font-black uppercase mr-1`, { color: isDark ? '#f3f4f6' : '#111827' }]}>
                    {isLast ? 'Finish' : 'Next'}
                  </Text>
                  {!isLast ? <ChevronRight size={14} color={isDark ? '#f3f4f6' : '#111827'} /> : null}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};
