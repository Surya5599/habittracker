import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NeoButton } from '../components/NeoComponents';

export const DashboardScreen = ({ onLogout }) => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        await AsyncStorage.removeItem('habit_guest_mode');
        if (onLogout) onLogout();
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-[#e5e5e5] items-center justify-center p-4`}>
            <View style={tw`w-full max-w-sm`}>
                <Text style={tw`text-2xl font-black uppercase text-center mb-8`}>Dashboard</Text>

                <View style={tw`bg-white border-2 border-black p-4 mb-4`}>
                    <Text style={tw`font-bold mb-2`}>Welcome!</Text>
                    <Text>This is the mobile version of HabiCard.</Text>
                </View>

                <NeoButton onPress={handleLogout} variant="secondary">
                    Sign Out
                </NeoButton>
            </View>
        </SafeAreaView>
    );
};
