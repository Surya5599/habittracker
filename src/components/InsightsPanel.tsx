import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, CalendarDays, RotateCcw, Clock, TrendingUp, Link2 } from 'lucide-react';
import { Insight } from '../utils/habitInsights';
import { Theme } from '../types';

interface InsightsPanelProps {
    insights: Insight[];
    theme: Theme;
    /**
     * Render only these categories. The stats card splits the insight list across
     * its four tabs — an at-risk habit belongs next to the leaderboard, a weekday
     * slip next to the heatmap — rather than pooling all six in one list where
     * they sit apart from the numbers they explain.
     */
    only?: Insight['category'][];
    /**
     * Drop the outer card chrome. Inside the stats card the surrounding panel
     * already supplies the border, the header and the scroll container, so the
     * embedded form renders the grouped list and nothing else. Returns null when
     * the filter matches nothing, so a tab never shows an empty insights box.
     */
    embedded?: boolean;
}

const CATEGORY_ORDER: Insight['category'][] = ['atRisk', 'consistency', 'weekday', 'resilience', 'timing', 'correlation'];

const CATEGORY_META: Record<Insight['category'], { label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; accent: string; chip: string }> = {
    atRisk: { label: 'At Risk', Icon: AlertTriangle, accent: 'border-amber-400', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    consistency: { label: 'Trend', Icon: TrendingUp, accent: 'border-purple-400', chip: 'bg-purple-50 text-purple-700 border-purple-200' },
    weekday: { label: 'Day Pattern', Icon: CalendarDays, accent: 'border-blue-400', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
    resilience: { label: 'Resilience', Icon: RotateCcw, accent: 'border-emerald-400', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    timing: { label: 'Cutting It Close', Icon: Clock, accent: 'border-rose-400', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    correlation: { label: 'Linked Habits', Icon: Link2, accent: 'border-indigo-400', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, theme, only, embedded }) => {
    const groups = useMemo(() => {
        const allowed = only ? CATEGORY_ORDER.filter(c => only.includes(c)) : CATEGORY_ORDER;
        return allowed
            .map(category => ({ category, items: insights.filter(i => i.category === category) }))
            .filter(g => g.items.length > 0);
    }, [insights, only]);

    // Shared by both forms: the standalone panel wraps this in card chrome, the
    // embedded form returns it bare.
    const renderGroups = () => {
        let revealIndex = 0;
        return groups.map(({ category, items }) => {
            const meta = CATEGORY_META[category];
            return (
                <div key={category} className="flex flex-col gap-2">
                    <motion.div
                        className="flex items-center gap-1.5 px-1"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: revealIndex++ * 0.09, ease: 'easeOut' }}
                    >
                        <meta.Icon size={12} strokeWidth={2.5} className="text-ink-muted" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-ink-muted">{meta.label}</span>
                        <span className="text-[9px] font-bold text-ink-muted">· {items.length}</span>
                    </motion.div>
                    <div className="flex flex-col gap-2">
                        {items.map(insight => (
                            <motion.div
                                key={insight.id}
                                className={`rounded-lg border-2 border-edge ${meta.accent} border-l-4 bg-surface-muted p-3`}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, delay: revealIndex++ * 0.09, ease: 'easeOut' }}
                            >
                                <p className="text-[12px] leading-relaxed text-ink">{insight.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            );
        });
    };

    if (embedded) {
        if (groups.length === 0) return null;
        return <div className="flex flex-col gap-4">{renderGroups()}</div>;
    }

    return (
        <div className="flex flex-col h-full min-h-[400px]">
            <div className="neo-border rounded-2xl overflow-hidden bg-surface flex flex-col flex-1 min-h-0">
                <div className="h-[3px]" style={{ backgroundColor: theme.primary }} />
                <div className="px-3 py-2 border-b-2 border-edge-strong flex items-center gap-2 shrink-0">
                    <Sparkles size={13} strokeWidth={2.5} className="text-ink-muted" />
                    <p className="flex-1 text-[9px] font-black uppercase tracking-[0.22em] text-ink-muted">Insights</p>
                    {insights.length > 0 && (
                        <span className="px-1.5 py-1 text-[9px] font-black bg-surface-inverse text-ink-inverse rounded">{insights.length}</span>
                    )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-4">
                    {groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center px-4 py-10">
                            <Sparkles size={20} className="text-ink-muted" />
                            <p className="text-sm font-bold text-ink-muted">Not enough history yet</p>
                            <p className="text-xs text-ink-muted max-w-[240px]">Keep logging your habits — patterns like weekday slip-ups, at-risk habits, and streak resilience will show up here once there's enough data.</p>
                        </div>
                    ) : (
                        renderGroups()
                    )}
                </div>
            </div>
        </div>
    );
};
