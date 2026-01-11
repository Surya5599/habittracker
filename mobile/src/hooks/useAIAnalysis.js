import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const LOCAL_AI_KEY = 'habit_tracker_ai_usage';

export const useAIAnalysis = (session, guestMode) => {
    const [profile, setProfile] = useState(null);
    const [analysisCount, setAnalysisCount] = useState(0);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    const getWeekKey = () => {
        const d = new Date();
        const year = d.getFullYear();
        const oneJan = new Date(year, 0, 1);
        const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
        return `${year}-${week}`;
    };

    const fetchProfile = useCallback(async () => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // Profile doesn't exist yet, handle_new_user trigger might not have run or migration is fresh
                const { data: newData, error: insertError } = await supabase
                    .from('profiles')
                    .insert({ id: session.user.id })
                    .select()
                    .single();

                if (newData) setProfile(newData);
            } else if (data) {
                setProfile(data);
                setIsPremium(data.is_premium);

                const currentWeek = getWeekKey();
                if (data.last_analysis_week === currentWeek) {
                    setAnalysisCount(data.analysis_count || 0);
                } else {
                    setAnalysisCount(0);
                    // Reset count for new week in DB
                    await supabase
                        .from('profiles')
                        .update({ analysis_count: 0, last_analysis_week: currentWeek })
                        .eq('id', session.user.id);
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchProfile();
        } else if (guestMode) {
            // Guest mode logic
            const loadGuestAI = async () => {
                const stored = await AsyncStorage.getItem(LOCAL_AI_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const currentWeek = getWeekKey();
                    if (parsed.week === currentWeek) {
                        setAnalysisCount(parsed.count || 0);
                    } else {
                        setAnalysisCount(0);
                    }
                }
                setIsPremium(false); // Guest is never premium by default
                setLoading(false);
            };
            loadGuestAI();
        } else {
            setLoading(false);
        }
    }, [session, guestMode, fetchProfile]);

    const incrementAnalysis = async () => {
        const newCount = analysisCount + 1;
        setAnalysisCount(newCount);

        if (session) {
            await supabase
                .from('profiles')
                .update({
                    analysis_count: newCount,
                    last_analysis_week: getWeekKey()
                })
                .eq('id', session.user.id);
        } else if (guestMode) {
            await AsyncStorage.setItem(LOCAL_AI_KEY, JSON.stringify({
                count: newCount,
                week: getWeekKey()
            }));
        }
    };

    const togglePremiumMock = async () => {
        const nextState = !isPremium;
        setIsPremium(nextState);
        if (session) {
            await supabase
                .from('profiles')
                .update({ is_premium: nextState })
                .eq('id', session.user.id);
        }
    };

    return {
        isPremium,
        analysisCount,
        loading,
        incrementAnalysis,
        togglePremiumMock,
        maxAnalyses: 3
    };
};
