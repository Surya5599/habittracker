import React, { useEffect, useState } from 'react';
import { View, Text, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import tw from 'twrnc';
import { getPalette, alpha } from '../constants/theme';
import { BOTTOM_NAV_HEIGHT } from './BottomNav';

// Owns the four things every tab screen was hand-rolling — and getting wrong.
//
// The bottom nav is absolutely positioned over the active screen, so anything pinned to
// the bottom has to reserve its height or it renders behind it. That bug shipped twice
// (the AI Coach composer and the To-Do composer) with identical fixes, plus a third
// variant in DailyCard's journal. Screens should not be able to write it again: pass a
// `bottomBar` and the padding is handled here.
//
// The keyboard rule is the non-obvious part. On iOS the keyboard overlays the window
// and KeyboardAvoidingView lifts the bar over it — the nav is already hidden behind the
// keyboard, so reserving its height would leave a dead gap. On Android the window
// resizes and the nav rides up with it, so the reservation must stay.
//
// `children` may be a node or a render function receiving { contentBottomInset }. Use
// the function form for scroll containers: it returns how much bottom padding the
// content needs to clear the nav (or the bottom bar, when one is present).
const CONTENT_BREATHING_ROOM = 24;

export const ScreenScaffold = ({
    colorMode = 'light',
    theme,
    title,
    icon: Icon,
    count,
    headerRight,
    headerExtra,
    bottomBar,
    bottomNavHeight = BOTTOM_NAV_HEIGHT,
    children,
}) => {
    const palette = getPalette(colorMode);
    const accent = theme?.primary || '#C19A9A';
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    const navReserve = keyboardVisible && Platform.OS === 'ios' ? 0 : bottomNavHeight;
    // With a bottom bar, the bar itself reserves the nav; without one, the scroll
    // content has to.
    const contentBottomInset = (bottomBar ? 0 : bottomNavHeight) + CONTENT_BREATHING_ROOM;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[tw`flex-1`, { backgroundColor: palette.pageBg }]}
        >
            {(title || headerExtra) && (
                <View style={[tw`px-5 pt-4 pb-4 border-b`, { backgroundColor: palette.panelBg, borderColor: palette.cardBorder }]}>
                    {title && (
                        <View style={[tw`flex-row items-center gap-2`, headerExtra && tw`mb-3`]}>
                            {Icon && <Icon size={20} color={accent} />}
                            <Text style={[tw`text-lg font-black uppercase tracking-widest flex-1`, { color: palette.textPrimary }]}>
                                {title}
                            </Text>
                            {count > 0 && (
                                <View style={[tw`px-2.5 py-0.5 rounded-full`, { backgroundColor: accent + alpha.medium }]}>
                                    <Text style={[tw`text-xs font-black`, { color: palette.textPrimary }]}>{count}</Text>
                                </View>
                            )}
                            {headerRight}
                        </View>
                    )}
                    {headerExtra}
                </View>
            )}

            {typeof children === 'function' ? children({ contentBottomInset }) : children}

            {bottomBar && (
                <View style={[
                    tw`px-4 pt-3 border-t`,
                    { backgroundColor: palette.panelBg, borderColor: palette.cardBorder, paddingBottom: 12 + navReserve },
                ]}>
                    {bottomBar}
                </View>
            )}
        </KeyboardAvoidingView>
    );
};
