import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Sparkles, Lock, ChevronRight, Zap } from 'lucide-react-native';
import tw from 'twrnc';

export const AIAnalysisView = ({
    theme,
    isPremium,
    analysisCount,
    maxAnalyses,
    incrementAnalysis,
    togglePremiumMock // For demo purposes
}) => {
    const primaryColor = theme?.primary || '#a18e78';

    const renderPremiumGate = () => (
        <View style={tw`flex-1 items-center justify-center px-6`}>
            <View style={[tw`p-6 bg-white rounded-3xl border-[3px] border-black items-center w-full relative`]}>
                <View style={[tw`absolute bg-black rounded-3xl`, { top: 8, left: 8, right: -8, bottom: -8, zIndex: -1 }]} />

                <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: primaryColor + '20' }]}>
                    <Lock size={32} color={primaryColor} />
                </View>

                <Text style={tw`text-2xl font-black text-gray-800 uppercase text-center mb-2`}>Premium Only</Text>
                <Text style={tw`text-gray-500 text-center mb-8 font-medium`}>
                    Get deep insights into your habits and life patterns with AI analysis. Unlock this feature with a premium subscription.
                </Text>

                <TouchableOpacity
                    onPress={togglePremiumMock}
                    style={[tw`w-full py-4 rounded-2xl flex-row items-center justify-center border-2 border-black`, { backgroundColor: primaryColor }]}
                >
                    <Zap size={20} color="white" fill="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-black uppercase tracking-widest`}>Upgrade to Premium</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderAnalysis = () => (
        <ScrollView style={tw`flex-1 p-4`} showsVerticalScrollIndicator={false}>
            {/* Header / Stats */}
            <View style={tw`mb-8`}>
                <View style={[tw`p-5 bg-white rounded-3xl border-[3px] border-black relative mb-4`]}>
                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />

                    <View style={tw`flex-row justify-between items-center mb-2`}>
                        <Text style={tw`text-xs font-black uppercase text-gray-400 tracking-widest`}>Weekly Usage</Text>
                        <Text style={[tw`text-xs font-black uppercase tracking-widest`, { color: primaryColor }]}>
                            {analysisCount} / {maxAnalyses} Analyses
                        </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden border-2 border-black`}>
                        <View
                            style={[
                                tw`h-full`,
                                {
                                    backgroundColor: primaryColor,
                                    width: `${(analysisCount / maxAnalyses) * 100}%`
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>

            {/* Analysis Actions */}
            <TouchableOpacity
                onPress={() => {
                    if (analysisCount < maxAnalyses) {
                        incrementAnalysis();
                    }
                }}
                disabled={analysisCount >= maxAnalyses}
                style={[
                    tw`p-6 rounded-3xl border-[3px] border-black relative mb-10 items-center overflow-hidden`,
                    analysisCount >= maxAnalyses ? tw`bg-gray-100 opacity-70` : { backgroundColor: primaryColor }
                ]}
            >
                <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />

                <Sparkles size={32} color="white" strokeWidth={2.5} style={tw`mb-2`} />
                <Text style={tw`text-white text-xl font-black uppercase tracking-widest mb-1 text-center`}>
                    {analysisCount >= maxAnalyses ? 'Limit Reached' : 'Generate New Analysis'}
                </Text>
                <Text style={tw`text-white/80 text-xs font-bold text-center`}>
                    {analysisCount >= maxAnalyses ? 'Resets next Monday' : 'AI will analyze your recent habits & notes'}
                </Text>
            </TouchableOpacity>

            {/* Recent Analysis Feed (Mock) - Using a carousel-like feel */}
            <Text style={tw`text-xs font-black uppercase text-gray-400 tracking-widest mb-4 ml-2`}>Insights History</Text>

            {[1, 2].map((i) => (
                <View key={i} style={tw`mb-6`}>
                    <View style={[tw`p-5 bg-white rounded-3xl border-[3px] border-black relative`]}>
                        <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />

                        <View style={tw`flex-row justify-between items-start mb-3`}>
                            <View>
                                <Text style={tw`text-lg font-black text-gray-800 uppercase leading-5 mb-1`}>Patterns & Energy</Text>
                                <Text style={tw`text-[10px] font-black uppercase text-gray-400`}>Jan {10 - i}, 2026</Text>
                            </View>
                            <View style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: primaryColor + '10' }]}>
                                <Text style={[tw`text-[10px] font-black uppercase`, { color: primaryColor }]}>Insight #{i}</Text>
                            </View>
                        </View>

                        <Text style={tw`text-sm text-gray-600 font-medium leading-5`}>
                            You tend to complete more habits on days when you record a "productive" mood early in the morning. Your consistency with "Reading" has improved by 15% this week.
                        </Text>

                        <TouchableOpacity style={tw`flex-row items-center mt-4`}>
                            <Text style={[tw`text-xs font-black uppercase mr-1`, { color: primaryColor }]}>View Full Report</Text>
                            <ChevronRight size={14} color={primaryColor} strokeWidth={3} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <View style={tw`h-24`} />
        </ScrollView>
    );

    return (
        <View style={tw`flex-1 bg-[#f5f5f4]`}>
            {!isPremium ? renderPremiumGate() : renderAnalysis()}
        </View>
    );
};
