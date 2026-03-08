import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../lib/supabase';
import { NeoButton, NeoInput, NeoCard } from '../components/NeoComponents';

export const SignInScreen = ({ navigation, onGuestLogin }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);

    const handleContinueAsGuest = () => {
        if (onGuestLogin) onGuestLogin();
    };

    const handleSubmit = async () => {
        if (!email) {
            Alert.alert('Error', t('auth.enterEmail'));
            return;
        }

        setLoading(true);

        if (isResetMode) {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) Alert.alert('Error', error.message);
            else Alert.alert('Success', t('auth.resetSent'));
            setLoading(false);
            return;
        }

        if (!password) {
            Alert.alert('Error', t('auth.enterPassword'));
            setLoading(false);
            return;
        }

        // 1. Try Login first
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (!loginError) {
            // success, App.js should handle session change automatically via onAuthStateChange
            // But we might need to manually trigger loading state if needed
            setLoading(false);
            return;
        }

        // 2. If login fails, try Sign Up
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({ email, password });

        if (!signUpError) {
            if (!signUpData?.session) {
                // Maybe just signed up but requires email confirmation?
                // Try checking if we can sign in now (sometimes signup auto-logs in)
                const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
                if (retryError) {
                    Alert.alert('Info', t('auth.checkEmail'));
                }
            }
            setLoading(false);
            return;
        }

        if (signUpError.message.toLowerCase().includes('already registered')) {
            Alert.alert('Error', loginError.message); // Show original login error
        } else {
            Alert.alert('Error', signUpError.message);
        }

        setLoading(false);
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-[#e5e5e5]`}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1 justify-center p-4`}
            >
                <View style={tw`flex-1 justify-center items-center`}>

                    <View style={tw`mb-8 items-center`}>
                        <Text style={tw`text-5xl font-black uppercase tracking-tighter text-black`}>
                            Habi<Text style={tw`text-[#C19A9A]`}>Card</Text>
                        </Text>
                        <Text style={tw`text-sm font-medium opacity-60 text-center max-w-[240px]`}>
                            {t('auth.tagline')}
                        </Text>
                    </View>

                    <NeoCard className="w-full max-w-sm">
                        <View style={tw`gap-4`}>
                            <View>
                                <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#999] mb-1`}>
                                    {t('auth.email')}
                                </Text>
                                <NeoInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="USER@DOMAIN.COM"
                                    style={tw`mb-2`}
                                />
                            </View>

                            {!isResetMode && (
                                <View>
                                    <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#999] mb-1`}>
                                        {t('auth.password')}
                                    </Text>
                                    <NeoInput
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="••••••••"
                                        secureTextEntry
                                        style={tw`mb-2`}
                                    />
                                </View>
                            )}

                            {isResetMode ? (
                                <>
                                    <NeoButton onPress={handleSubmit} style={tw`mt-2`}>
                                        {loading ? t('auth.sending') : t('auth.requestReset')}
                                    </NeoButton>
                                    <TouchableOpacity onPress={() => setIsResetMode(false)}>
                                        <Text style={tw`text-center text-[10px] font-black uppercase tracking-widest text-[#999]`}>
                                            {t('auth.returnLogin')}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <NeoButton onPress={handleSubmit} style={tw`mt-2`}>
                                        {loading ? t('auth.verifying') : t('auth.signInSignUp')}
                                    </NeoButton>

                                    <TouchableOpacity onPress={() => setIsResetMode(true)} style={tw`mt-2`}>
                                        <Text style={tw`text-center text-[10px] font-black uppercase tracking-widest text-[#999]`}>
                                            {t('auth.forgotPassword')}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={tw`flex-row items-center py-4`}>
                                        <View style={tw`flex-1 border-t border-gray-200`} />
                                        <Text style={tw`mx-3 text-[10px] font-black uppercase text-gray-300`}>{t('auth.or')}</Text>
                                        <View style={tw`flex-1 border-t border-gray-200`} />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleContinueAsGuest}
                                        style={tw`w-full py-3 bg-white/50 border-2 border-dashed border-gray-300 items-center justify-center`}
                                    >
                                        <Text style={tw`text-[10px] font-black uppercase tracking-widest text-black`}>
                                            {t('auth.guestEntry')}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </NeoCard>

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
