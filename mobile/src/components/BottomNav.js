import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, BarChart2, Cookie, Sparkles } from 'lucide-react-native';
import tw from 'twrnc';

export const BottomNav = ({ view, setView, resetWeekOffset, theme }) => {

    // Color palette matching the image
    const activeColor = theme?.primary || '#a18e78'; // Use theme primary or fallback to Brownish/Taupe
    const inactiveColor = '#78716c'; // Stone 500 equivalent

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
                    fill={isActive ? activeColor : 'transparent'} // Filled icon check? Image icons look slightly filled or thick. 
                // Actually image icons look like solid glyphs or thick lines. 
                // Let's use standard stroke for now.
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
        <View style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 pb-8 flex-row justify-between items-center z-50 rounded-t-3xl shadow-lg`}>

            <NavItem
                label="Today"
                icon={Home}
                targetView="weekly"
                onPress={() => { resetWeekOffset(); setView('weekly'); }}
            />

            <NavItem
                label="Analytics"
                icon={BarChart2}
                targetView="dashboard"
            />

            <NavItem
                label="Logs"
                icon={Cookie}
                targetView="monthly"
            />

            <NavItem
                label="Analysis"
                icon={Sparkles}
                targetView="analysis"
            />

        </View>
    );
};
