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

    const isInvalidRefreshTokenError = (error) => {
        const message = (error?.message || '').toLowerCase();
        return message.includes('invalid refresh token') || message.includes('refresh token not found');
    };

    const isExistingAccountError = (message = '') => {
        const normalized = message.toLowerCase();
        return normalized.includes('already registered')
            || normalized.includes('already exists')
            || normalized.includes('user already registered');
    };

    const isWrongPasswordError = (message = '') => {
        const normalized = message.toLowerCase();
        return normalized.includes('invalid login credentials')
            || normalized.includes('invalid password')
            || normalized.includes('wrong password');
    };

    const lookupEmailStatus = async (candidateEmail) => {
        const { data, error } = await supabase.functions.invoke('auth-email-status', {
            body: { email: candidateEmail }
        });

        if (error) throw error;

        return {
            exists: Boolean(data?.exists),
            confirmed: Boolean(data?.confirmed),
        };
    };

    const getFriendlyAuthMessage = (error, fallbackKey = 'auth.genericError') => {
        const message = String(error?.message || '').toLowerCase();

        if (isInvalidRefreshTokenError(error)) {
            return t('auth.sessionExpired');
        }

        if (message.includes('email not confirmed')) {
            return t('auth.checkEmail');
        }

        if (isWrongPasswordError(message)) {
            return t('auth.incorrectPassword');
        }

        if (isExistingAccountError(message)) {
            return t('auth.accountExists');
        }

        return t(fallbackKey);
    };

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
            if (error) {
                Alert.alert('Error', getFriendlyAuthMessage(error, 'auth.resetFailed'));
            }
            else Alert.alert('Success', t('auth.resetSent'));
            setLoading(false);
            return;
        }

        if (!password) {
            Alert.alert('Error', t('auth.enterPassword'));
            setLoading(false);
            return;
        }

        // Try logging in first. Only show the confirmation prompt when the account is truly unconfirmed.
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (!loginError) {
            setLoading(false);
            return;
        }

        if (loginError.message.toLowerCase().includes('email not confirmed')) {
            Alert.alert('Info', t('auth.checkEmail'));
            setLoading(false);
            return;
        }

        if (isWrongPasswordError(loginError.message)) {
            try {
                const status = await lookupEmailStatus(email);
                if (status.exists && !status.confirmed) {
                    Alert.alert('Info', t('auth.checkEmail'));
                } else {
                    Alert.alert('Error', t('auth.incorrectPassword'));
                }
            } catch {
                Alert.alert('Error', t('auth.incorrectPassword'));
            }
            setLoading(false);
            return;
        }

        // If login failed because the account might not exist, try sign up.
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({ email, password });

        if (!signUpError) {
            if (signUpData?.user && Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
                Alert.alert('Error', getFriendlyAuthMessage(loginError));
                setLoading(false);
                return;
            }

            if (!signUpData?.session) {
                try {
                    const status = await lookupEmailStatus(email);
                    if (status.exists && !status.confirmed) {
                        Alert.alert('Info', t('auth.checkEmail'));
                    } else {
                        Alert.alert('Error', getFriendlyAuthMessage(loginError));
                    }
                } catch {
                    Alert.alert('Info', t('auth.checkEmail'));
                }
            }
            setLoading(false);
            return;
        }

        if (isExistingAccountError(signUpError.message)) {
            Alert.alert('Error', getFriendlyAuthMessage(loginError));
        } else {
            Alert.alert('Error', getFriendlyAuthMessage(signUpError));
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
