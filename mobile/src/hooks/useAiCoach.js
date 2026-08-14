import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
    AI_COACH_PERSONALITIES,
    AI_DAILY_LIMIT,
    GEMINI_TOOLS,
    buildChatSystemPrompt,
    buildInsightPrompt,
    computeAnnualContext,
    computeDeltas,
    computeRichContext,
    executeTool,
} from '../utils/aiCoach';
import { todayKey } from '../utils/dateKeys';

const ENABLED_KEY = 'habit_ai_coach_enabled';
const PERSONALITY_KEY = 'habit_ai_personality';
const DISCLAIMER_KEY = 'habit_ai_disclaimer_accepted';
const usageKeyFor = (dateKey) => `habicard_ai_${dateKey}`;
const personalityPickedKeyFor = (dateKey) => `habit_ai_personality_picked_${dateKey}`;

// Matches the web app: one chat message may fan out into several tool-call rounds.
const MAX_TOOL_ROUNDS = 5;

/**
 * AI Coach state for mobile — mirrors the web app's model:
 * one auto-generated daily insight plus AI_DAILY_LIMIT (5) chat messages a day.
 * Day state (insight/messages/personality) is stored per date in `ai_coach_chats`;
 * quota, personality and disclaimer flags live in AsyncStorage.
 */
export const useAiCoach = ({ session, guestMode, habits, completions, language }) => {
    const dateKey = todayKey();
    const userId = session?.user?.id || null;

    const [enabled, setEnabled] = useState(true);
    const [personality, setPersonality] = useState('direct');
    const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
    const [hasPickedPersonalityToday, setHasPickedPersonalityToday] = useState(false);
    const [prefsLoaded, setPrefsLoaded] = useState(false);

    const [insight, setInsight] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dayLoaded, setDayLoaded] = useState(false);
    const [remaining, setRemaining] = useState(AI_DAILY_LIMIT);
    const [insightError, setInsightError] = useState(false);

    // Set before the request goes out and left set on failure: the auto-fetch
    // effect re-runs whenever `loading` flips, so clearing it on error would
    // spin a persistent failure into an infinite retry loop. Retries are
    // explicit, via retryInsight().
    const insightFiredRef = useRef(false);

    // Persist AI Coach errors so they can be reviewed later, same table the web
    // app writes to. Never throws — logging must not break the chat.
    const logAiError = useCallback((context, message, detail) => {
        console.error(`[AI Coach] ${context}:`, message, detail);
        try {
            const safeDetail = detail === undefined
                ? null
                : JSON.parse(JSON.stringify(detail, (_k, v) => (
                    v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v
                )));
            // `ai_error_logs` has no platform column, so the context carries the
            // prefix — keeps mobile errors distinguishable from web without a migration.
            supabase.from('ai_error_logs')
                .insert({ user_id: userId, context: `mobile:${context}`, message, detail: safeDetail })
                .then(({ error }) => {
                    if (error) console.error('Failed to write ai_error_logs row:', error);
                });
        } catch (err) {
            console.error('Failed to serialize AI error detail:', err);
        }
    }, [userId]);

    // ── Preferences + daily quota ────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const loadPrefs = async () => {
            try {
                const [storedEnabled, storedPersonality, storedDisclaimer, storedPicked, storedUsage] =
                    await AsyncStorage.multiGet([
                        ENABLED_KEY,
                        PERSONALITY_KEY,
                        DISCLAIMER_KEY,
                        personalityPickedKeyFor(dateKey),
                        usageKeyFor(dateKey),
                    ]);
                if (cancelled) return;

                setEnabled(storedEnabled[1] !== 'false');
                if (storedPersonality[1] && AI_COACH_PERSONALITIES.some(p => p.id === storedPersonality[1])) {
                    setPersonality(storedPersonality[1]);
                }
                setHasAcceptedDisclaimer(storedDisclaimer[1] === 'true');
                setHasPickedPersonalityToday(storedPicked[1] === 'true');
                const used = parseInt(storedUsage[1] || '0', 10) || 0;
                setRemaining(Math.max(0, AI_DAILY_LIMIT - used));
            } catch (err) {
                logAiError('load_prefs', 'Failed to load AI Coach preferences', err);
            } finally {
                if (!cancelled) setPrefsLoaded(true);
            }
        };
        loadPrefs();
        return () => { cancelled = true; };
    }, [dateKey, logAiError]);

    // Drop yesterday's quota / picker keys so they don't accumulate.
    useEffect(() => {
        const prune = async () => {
            try {
                const keys = await AsyncStorage.getAllKeys();
                const stale = keys.filter(k => (
                    (k.startsWith('habicard_ai_') && k !== usageKeyFor(dateKey)) ||
                    (k.startsWith('habit_ai_personality_picked_') && k !== personalityPickedKeyFor(dateKey))
                ));
                if (stale.length > 0) await AsyncStorage.multiRemove(stale);
            } catch {
                // Housekeeping only — a failure here is not worth surfacing.
            }
        };
        prune();
    }, [dateKey]);

    const readUsage = useCallback(async () => {
        const raw = await AsyncStorage.getItem(usageKeyFor(dateKey));
        return parseInt(raw || '0', 10) || 0;
    }, [dateKey]);

    const spendUsage = useCallback(async () => {
        const used = (await readUsage()) + 1;
        await AsyncStorage.setItem(usageKeyFor(dateKey), String(used));
        setRemaining(Math.max(0, AI_DAILY_LIMIT - used));
    }, [dateKey, readUsage]);

    // Service failures shouldn't burn a message from the daily quota.
    const refundUsage = useCallback(async () => {
        const used = Math.max(0, (await readUsage()) - 1);
        await AsyncStorage.setItem(usageKeyFor(dateKey), String(used));
        setRemaining(Math.max(0, AI_DAILY_LIMIT - used));
    }, [dateKey, readUsage]);

    const setEnabledPersisted = useCallback(async (next) => {
        setEnabled(next);
        await AsyncStorage.setItem(ENABLED_KEY, String(next));
    }, []);

    const acceptDisclaimer = useCallback(async () => {
        setHasAcceptedDisclaimer(true);
        await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
    }, []);

    // ── Today's insight + chat history ───────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        setDayLoaded(false);
        insightFiredRef.current = false;

        const loadDay = async () => {
            if (!userId || guestMode) {
                if (cancelled) return;
                setInsight(null);
                setMessages([]);
                setDayLoaded(true);
                return;
            }

            const { data, error } = await supabase
                .from('ai_coach_chats')
                .select('insight, messages, personality')
                .eq('user_id', userId)
                .eq('date_key', dateKey)
                .maybeSingle();

            if (cancelled) return;
            if (error) logAiError('load_day_db', 'Failed to load AI coach day from DB', error);

            setInsight(data?.insight || null);
            insightFiredRef.current = !!data?.insight;
            setMessages(Array.isArray(data?.messages) ? data.messages : []);
            if (data?.personality) {
                setHasPickedPersonalityToday(true);
                if (AI_COACH_PERSONALITIES.some(p => p.id === data.personality)) {
                    setPersonality(data.personality);
                }
            }
            setDayLoaded(true);
        };

        loadDay().catch((err) => {
            if (cancelled) return;
            logAiError('load_day_exception', 'Loading AI coach day threw', err);
            setDayLoaded(true);
        });

        return () => { cancelled = true; };
    }, [userId, guestMode, dateKey, logAiError]);

    const saveDay = useCallback((updates) => {
        if (!userId || guestMode) return;
        supabase
            .from('ai_coach_chats')
            .upsert({ user_id: userId, date_key: dateKey, ...updates }, { onConflict: 'user_id,date_key' })
            .then(({ error }) => {
                if (error) logAiError('save_day_db', 'Failed to save AI coach day to DB', error);
            });
    }, [dateKey, guestMode, logAiError, userId]);

    const pickPersonality = useCallback(async (next) => {
        setPersonality(next);
        setHasPickedPersonalityToday(true);
        await AsyncStorage.multiSet([
            [PERSONALITY_KEY, next],
            [personalityPickedKeyFor(dateKey), 'true'],
        ]);
        saveDay({ personality: next });
    }, [dateKey, saveDay]);

    const buildContext = useCallback(() => {
        const annual = computeAnnualContext(habits, completions);
        const { weekDelta, monthDelta } = computeDeltas(habits, completions);
        return computeRichContext(habits, completions, annual, weekDelta, monthDelta);
    }, [habits, completions]);

    // ── Daily insight ────────────────────────────────────────────────────────
    const fetchInsight = useCallback(async () => {
        if (insightFiredRef.current || loading) return;
        if (!userId || guestMode || !dayLoaded || !hasAcceptedDisclaimer || !hasPickedPersonalityToday) return;

        insightFiredRef.current = true;
        setInsightError(false);
        setLoading(true);
        try {
            const { habits: richHabits, overall } = buildContext();
            const prompt = buildInsightPrompt(dateKey, richHabits, overall, personality, language);

            const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                body: { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
            });

            if (error) {
                logAiError('insight_fetch', 'Insight fetch returned an error', error);
                setInsight({ message: 'Could not load insights right now.', categories: [] });
                setInsightError(true);
                return;
            }

            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleaned = raw.replace(/```json|```/g, '').trim();
            try {
                const parsed = JSON.parse(cleaned);
                setInsight(parsed);
                saveDay({ insight: parsed, messages: [] });
            } catch (err) {
                logAiError('insight_parse', 'Failed to parse insight JSON', { err: err?.message, raw });
                const fallback = { message: cleaned, categories: [] };
                setInsight(fallback);
                saveDay({ insight: fallback, messages: [] });
            }
        } catch (err) {
            logAiError('insight_fetch_exception', 'Insight fetch threw', err);
            setInsight({ message: 'Could not load insights right now.', categories: [] });
            setInsightError(true);
        } finally {
            setLoading(false);
        }
    }, [buildContext, dateKey, dayLoaded, guestMode, hasAcceptedDisclaimer, hasPickedPersonalityToday,
        language, loading, logAiError, personality, saveDay, userId]);

    // Explicit user retry after a failed insight — the only path that re-arms the
    // one-shot guard.
    const retryInsight = useCallback(() => {
        if (loading) return;
        insightFiredRef.current = false;
        setInsight(null);
        setInsightError(false);
        fetchInsight();
    }, [fetchInsight, loading]);

    // ── Chat ─────────────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        const trimmed = String(text || '').trim();
        if (!trimmed || loading || remaining <= 0 || !dayLoaded || !hasAcceptedDisclaimer) return;
        if (!userId || guestMode) return;

        await spendUsage();
        const updated = [...messages, { role: 'user', text: trimmed }];
        setMessages(updated);
        saveDay({ messages: updated });
        setLoading(true);

        const pushReply = (reply) => {
            setMessages((prev) => {
                const next = [...prev, { role: 'model', text: reply }];
                saveDay({ messages: next });
                return next;
            });
        };

        try {
            const { habits: richHabits, overall } = buildContext();
            const systemPrompt = buildChatSystemPrompt(dateKey, richHabits, overall, personality, language);

            const contents = [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Got it, I'm ready to help." }] },
                ...updated.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            ];

            let done = false;
            for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
                const { data: invokeData, error: invokeError } = await supabase.functions.invoke('gemini-proxy', {
                    body: { contents, tools: GEMINI_TOOLS },
                });

                let httpStatus = 200;
                let data = invokeData;
                if (invokeError) {
                    httpStatus = invokeError.context?.status ?? 500;
                    try { data = await invokeError.context.json(); } catch { data = null; }
                }

                if (httpStatus < 200 || httpStatus >= 300 || data?.error) {
                    const status = data?.error?.status;
                    logAiError('chat_request_failed', 'Chat request returned an error', { httpStatus, status, data });
                    await refundUsage();
                    if (httpStatus === 429 || status === 'RESOURCE_EXHAUSTED') {
                        pushReply("I'm getting a lot of requests right now — give it a few seconds and try again.");
                    } else {
                        pushReply('The AI service had a hiccup. Please try again in a moment.');
                    }
                    done = true;
                    break;
                }

                const candidate = data?.candidates?.[0];
                const parts = candidate?.content?.parts || [];

                if (parts.length === 0 && candidate?.finishReason && candidate.finishReason !== 'STOP') {
                    logAiError('chat_blocked', 'Chat response was blocked or empty', { finishReason: candidate?.finishReason });
                    pushReply("I couldn't answer that one — try rephrasing your question.");
                    done = true;
                    break;
                }

                const toolCallPart = parts.find(p => p.functionCall);
                if (toolCallPart) {
                    const { name, args } = toolCallPart.functionCall;
                    const result = executeTool(name, args || {}, habits, completions);
                    // thoughtSignature must be echoed back on Gemini 3.x models or the
                    // next request 400s with "Function call is missing a thought_signature".
                    contents.push({
                        role: 'model',
                        parts: [{ functionCall: { name, args: args || {} }, thoughtSignature: toolCallPart.thoughtSignature }],
                    });
                    contents.push({ role: 'user', parts: [{ functionResponse: { name, response: result } }] });
                    continue;
                }

                const reply = parts.find(p => p.text)?.text || "I couldn't answer that one — try rephrasing your question.";
                pushReply(reply);
                done = true;
                break;
            }

            if (!done) {
                logAiError('chat_max_rounds', 'Chat exhausted MAX_TOOL_ROUNDS without a final reply');
                pushReply('That took too many steps to answer — try asking something more specific.');
            }
        } catch (err) {
            logAiError('chat_exception', 'Chat threw an unexpected error', err);
            await refundUsage();
            pushReply('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [buildContext, completions, dateKey, dayLoaded, guestMode, habits, hasAcceptedDisclaimer, language,
        loading, logAiError, messages, personality, refundUsage, remaining, saveDay, spendUsage, userId]);

    return {
        enabled,
        setEnabled: setEnabledPersisted,
        prefsLoaded,
        personality,
        pickPersonality,
        hasPickedPersonalityToday,
        hasAcceptedDisclaimer,
        acceptDisclaimer,
        insight,
        insightError,
        messages,
        loading,
        dayLoaded,
        remaining,
        dailyLimit: AI_DAILY_LIMIT,
        fetchInsight,
        retryInsight,
        sendMessage,
    };
};
