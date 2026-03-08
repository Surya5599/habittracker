import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { X, Shield, Eye, Server, Lock, Mail, MessageSquare } from 'lucide-react-native';
import tw from 'twrnc';

export const PrivacyPolicyModal = ({
    isVisible,
    onClose,
    onOpenFeedback,
    colorMode = 'light',
    theme
}) => {
    const isDark = colorMode === 'dark';
    const outlineColor = isDark ? '#ffffff' : '#000000';
    const panelBg = isDark ? '#0b0b0b' : '#ffffff';
    const appBg = isDark ? '#000000' : '#f5f5f4';
    const textPrimary = isDark ? '#e5e7eb' : '#2a2a2a';
    const textMuted = isDark ? '#a3a3a3' : '#78716c';
    const softBg = isDark ? '#111111' : '#f5f5f4';

    const SectionTitle = ({ icon: Icon, children }) => (
        <View style={tw`flex-row items-center mb-3`}>
            <Icon size={18} color={textPrimary} strokeWidth={2.5} />
            <Text style={[tw`ml-2 text-base font-black uppercase`, { color: textPrimary }]}>{children}</Text>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 justify-end bg-black/60`}>
                <View style={[tw`rounded-t-3xl h-[92%] overflow-hidden`, { backgroundColor: appBg }]}>
                    <View style={[tw`p-5 border-b flex-row items-center justify-between`, { backgroundColor: panelBg, borderColor: outlineColor }]}>
                        <Text style={[tw`text-lg font-black uppercase tracking-widest`, { color: textPrimary }]}>Privacy Policy</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[tw`p-2 rounded-full`, { backgroundColor: softBg }]}
                        >
                            <X size={20} color={textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={tw`p-4`} contentContainerStyle={tw`pb-10`} showsVerticalScrollIndicator={false}>
                        <View style={tw`mb-5`}>
                            <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />
                            <View style={[tw`rounded-3xl border-[3px] p-4`, { backgroundColor: panelBg, borderColor: outlineColor }]}>
                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-1`, { color: textMuted }]}>Last Updated</Text>
                                <Text style={[tw`font-black mb-2`, { color: textPrimary }]}>January 14, 2026</Text>
                                <Text style={[tw`text-sm leading-5`, { color: textMuted }]}>
                                    Your privacy is important to us. We respect your privacy regarding any information we may collect from you across HabiCard.
                                </Text>
                            </View>
                        </View>

                        <View style={tw`mb-5`}>
                            <SectionTitle icon={Eye}>1. Information We Collect</SectionTitle>
                            <Text style={[tw`text-sm leading-6`, { color: textMuted }]}>
                                We only ask for personal information when needed to provide service. This includes account verification details, habit/journal usage data, and local on-device storage for guest mode.
                            </Text>
                        </View>

                        <View style={tw`mb-5`}>
                            <SectionTitle icon={Server}>2. How We Store Your Data</SectionTitle>
                            <Text style={[tw`text-sm leading-6`, { color: textMuted }]}>
                                Signed-in user data is stored in Supabase with Row Level Security enabled. Data in transit is protected by SSL/TLS. We retain information only as long as required to provide the service.
                            </Text>
                        </View>

                        <View style={tw`mb-5`}>
                            <SectionTitle icon={Shield}>3. Third-Party Services</SectionTitle>
                            <Text style={[tw`text-sm leading-6`, { color: textMuted }]}>
                                We may rely on third-party services for authentication, infrastructure, and analytics. These providers are required to handle your data only for service-related purposes.
                            </Text>
                        </View>

                        <View style={tw`mb-5`}>
                            <SectionTitle icon={Lock}>4. Your Rights</SectionTitle>
                            <Text style={[tw`text-sm leading-6`, { color: textMuted }]}>
                                You can refuse certain data requests, understanding some features may become unavailable. You may request access to your data or deletion of your account data at any time.
                            </Text>
                        </View>

                        <View style={tw`mb-5`}>
                            <SectionTitle icon={Mail}>5. Contact Us</SectionTitle>
                            <Text style={[tw`text-sm leading-6 mb-3`, { color: textMuted }]}>
                                Questions about this policy can be sent through feedback in the app.
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    onClose();
                                    onOpenFeedback && onOpenFeedback();
                                }}
                                style={[tw`rounded-xl border-[3px] px-4 py-3 flex-row items-center justify-center`, { backgroundColor: theme?.primary || '#a18e78', borderColor: outlineColor }]}
                            >
                                <MessageSquare size={16} color="white" strokeWidth={2.5} />
                                <Text style={tw`ml-2 text-white text-xs font-black uppercase tracking-widest`}>Bug or Suggestion</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

