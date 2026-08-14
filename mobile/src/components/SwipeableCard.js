import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, useWindowDimensions, View } from 'react-native';
import tw from 'twrnc';

// The one swipe every card in the app uses.
//
// The three screens had grown three different gestures: Today followed your finger,
// Analytics had a PanResponder with no onPanResponderMove at all (nothing moved, it just
// snapped on release), and Review used a paged FlatList that took its feel from the
// platform. This is Today's original slide — the one that was known to feel right —
// lifted out so all three share it.
//
// The card follows your finger, slides out, swaps its content, and springs in from the
// far side. Straight lateral movement and nothing else — the way Review's paged list
// behaved. It briefly leaves the frame, which is fine: it moves fast enough that there is
// nothing to read in the gap, and the screen behind it is the app's own background rather
// than an empty card-shaped hole.
//
// (An index-card flip lived here for a while — the card pivoting in place on rotateY.
// It looked better on paper and worse on a device, so it is gone.)

const CAPTURE_DISTANCE = 14;      // px before we claim the gesture from a scroll
const HORIZONTAL_BIAS = 1.3;      // dx must beat dy by this much
const COMMIT_DISTANCE = 48;
const COMMIT_VELOCITY = 0.55;
const EDGE_RESISTANCE = 0.25;     // drag toward a card that isn't there and it resists

// The gap between the old card leaving and the new one arriving is the whole problem
// here. It used to exit a full screen-width and re-enter from 65% out on a soft spring —
// the card was off-frame for the exit and then most of a long spring settle, which reads
// as a pause with nothing in it. So: exit only just past the edge, re-enter from close in
// so the card's leading edge is already on screen at the first frame back, and use a
// timing curve rather than a spring, which has no slow settling tail.
const EXIT_RATIO = 1.02;          // how far past the edge the card leaves
const ENTER_RATIO = 0.34;         // how far out the replacement starts
const EXIT_DURATION = 100;
const ENTER_DURATION = 140;

const SNAP_BACK = { damping: 14, stiffness: 220, mass: 0.8 };

export const SwipeableCard = ({
    children,
    onPrev,
    onNext,
    // Reset the card whenever this changes — it's what tells us new content has mounted.
    resetKey,
    enabled = true,
    canPrev = true,
    canNext = true,
    style,
    onLayout,
}) => {
    const { width } = useWindowDimensions();
    const swipeX = useRef(new Animated.Value(0)).current;
    const lockRef = useRef(false);
    const onPrevRef = useRef(onPrev);
    const onNextRef = useRef(onNext);
    const boundsRef = useRef({ canPrev, canNext, enabled });

    useEffect(() => { onPrevRef.current = onPrev; onNextRef.current = onNext; }, [onPrev, onNext]);
    useEffect(() => { boundsRef.current = { canPrev, canNext, enabled }; }, [canPrev, canNext, enabled]);

    // Guarded by the lock: mid-transition the card is deliberately parked off-screen
    // waiting to spring in, and snapping it home here would cut that short.
    useEffect(() => {
        if (!lockRef.current) swipeX.setValue(0);
    }, [resetKey, swipeX]);

    const snapBack = useCallback(() => {
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: true, ...SNAP_BACK }).start();
    }, [swipeX]);

    const run = useCallback((direction) => {
        const isNext = direction === 'next';
        const exitTo = isNext ? -width * EXIT_RATIO : width * EXIT_RATIO;
        const enterFrom = isNext ? width * ENTER_RATIO : -width * ENTER_RATIO;

        Animated.timing(swipeX, {
            toValue: exitTo,
            duration: EXIT_DURATION,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (!finished) { lockRef.current = false; swipeX.setValue(0); return; }

            const handler = isNext ? onNextRef.current : onPrevRef.current;
            handler && handler();

            swipeX.setValue(enterFrom);
            Animated.timing(swipeX, {
                toValue: 0,
                duration: ENTER_DURATION,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => { lockRef.current = false; });
        });
    }, [swipeX, width]);

    const responder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => {
            if (lockRef.current || !boundsRef.current.enabled) return false;
            const absDx = Math.abs(g.dx);
            return absDx > CAPTURE_DISTANCE && absDx > Math.abs(g.dy) * HORIZONTAL_BIAS;
        },
        onPanResponderMove: (_, g) => {
            if (lockRef.current) return;
            const { canPrev: prevOk, canNext: nextOk } = boundsRef.current;
            const blocked = (g.dx > 0 && !prevOk) || (g.dx < 0 && !nextOk);
            swipeX.setValue(blocked ? g.dx * EDGE_RESISTANCE : g.dx);
        },
        onPanResponderRelease: (_, g) => {
            if (lockRef.current) return;
            const { canPrev: prevOk, canNext: nextOk } = boundsRef.current;
            const committed = Math.abs(g.dx) > COMMIT_DISTANCE || Math.abs(g.vx) > COMMIT_VELOCITY;
            const goingNext = g.dx < 0;
            if (!committed || (goingNext && !nextOk) || (!goingNext && !prevOk)) {
                snapBack();
                return;
            }
            lockRef.current = true;
            run(goingNext ? 'next' : 'prev');
        },
        onPanResponderTerminate: () => snapBack(),
    }), [run, snapBack, swipeX]);

    // Just the slide. Today's version also tilted, shrank and faded the card on its way
    // out; Review's paged list did none of that, and plain lateral movement is what reads
    // as pages going past. Nothing here but translateX.
    const cardStyle = useMemo(() => ({
        transform: [{ translateX: swipeX }],
    }), [swipeX]);

    return (
        <View style={style} onLayout={onLayout}>
            <Animated.View style={[tw`flex-1`, cardStyle]} {...responder.panHandlers}>
                {children}
            </Animated.View>
        </View>
    );
};
