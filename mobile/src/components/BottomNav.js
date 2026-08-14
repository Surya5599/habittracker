import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { CalendarCheck, TrendingUp, BookOpen, Sparkles } from 'lucide-react-native';
import tw from 'twrnc';

// Fallback used before the nav has laid itself out. Screens with content pinned
// to the bottom (AI Coach composer, etc.) need to reserve this much room because
// the nav is absolutely positioned and overlays them.
export const BOTTOM_NAV_HEIGHT = 86;

export const BottomNav = ({ view, setView, resetWeekOffset, theme, colorMode = 'light', showAiCoach = false, onLayout }) => {
    const { t } = useTranslation();
    const isDark = colorMode === 'dark';

    const activeColor = theme?.primary || '#a18e78';
    const inactiveColor = isDark ? '#9ca3af' : '#78716c';

    const NavItem = ({ label, icon: Icon, targetView, onPress }) => {
        const isActive = view === targetView;
        return (
            <TouchableOpacity
                onPress={onPress || (() => setView(targetView))}
                style={tw`items-center justify-center flex-1 py-1`}
                activeOpacity={0.75}
            >
                {/* The shrink-to-fit branch here existed because five tabs didn't fit at
                    full size. Consolidating Logs and To-Do into the Journal caps it at
                    four, so every tab gets the roomier treatment again. */}
                <View style={[
                    tw`flex-row items-center gap-1.5 px-3 py-2 rounded-2xl`,
                    isActive
                        ? { backgroundColor: activeColor }
                        : { backgroundColor: 'transparent' }
                ]}>
                    <Icon
                        size={18}
                        color={isActive ? '#ffffff' : inactiveColor}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                    <Text style={[
                        tw`text-[11px]`,
                        { color: isActive ? '#ffffff' : inactiveColor, fontWeight: isActive ? '800' : '500' }
                    ]} numberOfLines={1}>
                        {label}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View
            onLayout={onLayout}
            style={[
            tw`absolute bottom-0 left-0 right-0 flex-row justify-between items-center z-50 rounded-t-3xl px-2 pt-3 pb-8`,
            {
                backgroundColor: isDark ? '#000000' : '#ffffff',
                borderTopWidth: 1,
                borderColor: isDark ? '#262626' : '#f3f4f6',
            }
        ]}
        >
            <NavItem
                label={t('bottomNav.today')}
                icon={CalendarCheck}
                targetView="weekly"
                onPress={() => { resetWeekOffset(); setView('weekly'); }}
            />

            <NavItem
                label={t('bottomNav.analytics')}
                icon={TrendingUp}
                targetView="dashboard"
            />

            {/* Logs and To-Do consolidated into Review: it pages through days, each page
                a read-only account of that day's habits, tasks and entries. Logs lives on
                as its index, To-Do's backlog as its inbox. */}
            <NavItem
                label={t('bottomNav.review', { defaultValue: 'Review' })}
                icon={BookOpen}
                targetView="journal"
            />

            {showAiCoach && (
                <NavItem
                    label={t('bottomNav.coach', { defaultValue: 'Coach' })}
                    icon={Sparkles}
                    targetView="coach"
                />
            )}
        </View>
    );
};
