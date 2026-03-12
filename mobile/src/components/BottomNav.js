import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, BarChart2, BookOpen, Award } from 'lucide-react-native';
import tw from 'twrnc';

export const BottomNav = ({ view, setView, resetWeekOffset, theme, colorMode = 'light' }) => {
    const { t } = useTranslation();
    const isDark = colorMode === 'dark';

    // Color palette matching the image
    // Color palette matching the image
    const activeColor = theme?.primary || '#a18e78'; // Use theme primary or fallback to Brownish/Taupe
    const inactiveColor = isDark ? '#9ca3af' : '#78716c'; // Stone 500 equivalent

    const NavItem = ({ label, icon: Icon, targetView, onPress }) => {
        const isActive = view === targetView;
        return (
            <TouchableOpacity
                onPress={onPress || (() => setView(targetView))}
                style={tw`items-center justify-center flex-1`}
            >
                <Icon
                    size={24}
                    color={isActive ? activeColor : inactiveColor}
                    strokeWidth={isActive ? 2.5 : 2}
                    fill="transparent"
                />
                <Text style={[
                    tw`text-[10px] mt-1`,
                    { color: isActive ? activeColor : inactiveColor, fontWeight: isActive ? '700' : '500' }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[tw`absolute bottom-0 left-0 right-0 p-2 pb-8 flex-row justify-between items-center z-50 rounded-t-3xl`, { backgroundColor: isDark ? '#000000' : '#ffffff', borderTopWidth: 1, borderColor: isDark ? '#ffffff' : '#f3f4f6' }]}>

            <NavItem
                label={t('bottomNav.today')}
                icon={Home}
                targetView="weekly"
                onPress={() => { resetWeekOffset(); setView('weekly'); }}
            />

            <NavItem
                label={t('bottomNav.analytics')}
                icon={BarChart2}
                targetView="dashboard"
            />

            <NavItem
                label={t('bottomNav.logs')}
                icon={BookOpen}
                targetView="monthly"
            />

            <NavItem
                label="Badges"
                icon={Award}
                targetView="badges"
            />

        </View>
    );
};
