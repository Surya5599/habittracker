import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import tw from 'twrnc';

export const NeoCard = ({ children, style, className }) => {
    return (
        <View style={[tw.style(className), style]}>
            {/* Hard Shadow Layer */}
            <View
                style={tw`absolute top-[4px] left-[4px] w-full h-full bg-black`}
            />
            {/* Content Layer */}
            <View style={tw`bg-white border-2 border-black p-4`}>
                {children}
            </View>
        </View>
    );
};

export const NeoButton = ({ onPress, children, style, textStyle, variant = 'primary' }) => {
    const bg = variant === 'primary' ? 'bg-black' : 'bg-white';
    const text = variant === 'primary' ? 'text-white' : 'text-black';
    const border = variant === 'secondary' ? 'border-2 border-black' : '';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[tw`relative mb-[4px] mr-[4px]`, style]}
        >
            <View style={tw`absolute top-[4px] left-[4px] w-full h-full bg-black border-2 border-black`} />
            <View style={tw`${bg} border-2 border-black px-6 py-3 flex items-center justify-center`}>
                <Text style={[tw`${text} text-sm font-bold uppercase tracking-widest`, textStyle]}>
                    {children}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export const NeoInput = ({ value, onChangeText, placeholder, secureTextEntry, style }) => {
    return (
        <View style={[tw`relative mb-4`, style]}>
            <View style={tw`absolute top-[4px] left-[4px] w-full h-full bg-black`} />
            <View style={tw`bg-white border-2 border-black`}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    secureTextEntry={secureTextEntry}
                    style={tw`p-4 font-bold text-black`}
                    placeholderTextColor="#999"
                />
            </View>
        </View>
    );
};
