import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { CalendarCheck, TrendingUp, ScrollText, ListTodo } from 'lucide-react-native';
import tw from 'twrnc';

export const BottomNav = ({ view, setView, resetWeekOffset, theme, colorMode = 'light' }) => {
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
                <View style={[
                    tw`flex-row items-center gap-1.5 px-4 py-2 rounded-2xl`,
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
                    ]}>
                        {label}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[
            tw`absolute bottom-0 left-0 right-0 flex-row justify-between items-center z-50 rounded-t-3xl px-2 pt-3 pb-8`,
            {
                backgroundColor: isDark ? '#000000' : '#ffffff',
                borderTopWidth: 1,
                borderColor: isDark ? '#262626' : '#f3f4f6',
            }
        ]}>
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

            <NavItem
                label={t('bottomNav.logs')}
                icon={ScrollText}
                targetView="monthly"
            />

            <NavItem
                label={t('bottomNav.todo')}
                icon={ListTodo}
                targetView="todo"
            />
        </View>
    );
};
