import { supabase } from '../supabase';
import { DailyNote, Habit, MonthlyGoals } from '../types';

interface ExportContext {
    userId?: string;
    userEmail?: string;
    guestMode: boolean;
    habits: Habit[];
    completions: Record<string, Record<string, boolean>>;
    notes: DailyNote;
    monthlyGoals: MonthlyGoals;
}

interface ExportRow {
    record_type: string;
    record_id: string;
    parent_id: string;
    user_id: string;
    date_key: string;
    month_key: string;
    habit_id: string;
    habit_name: string;
    created_at: string;
    updated_at: string;
    title: string;
    status: string;
    value: string;
    payload_json: string;
}

const CSV_COLUMNS: Array<keyof ExportRow> = [
    'record_type',
    'record_id',
    'parent_id',
    'user_id',
    'date_key',
    'month_key',
    'habit_id',
    'habit_name',
    'created_at',
    'updated_at',
    'title',
    'status',
    'value',
    'payload_json'
];

const escapeCsvCell = (value: string) => {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};

const stringifyPayload = (value: unknown) => JSON.stringify(value ?? {});

const toCsv = (rows: ExportRow[]) => {
    const header = CSV_COLUMNS.join(',');
    const body = rows
        .map((row) => CSV_COLUMNS.map((column) => escapeCsvCell(row[column] || '')).join(','))
        .join('\n');

    return `${header}\n${body}`;
};

const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};

const sanitizeFileSegment = (value: string) => value.replace(/[^a-zA-Z0-9-_]+/g, '_');

const createRow = (partial: Partial<ExportRow> & Pick<ExportRow, 'record_type' | 'record_id'>): ExportRow => ({
    record_type: partial.record_type,
    record_id: partial.record_id,
    parent_id: partial.parent_id || '',
    user_id: partial.user_id || '',
    date_key: partial.date_key || '',
    month_key: partial.month_key || '',
    habit_id: partial.habit_id || '',
    habit_name: partial.habit_name || '',
    created_at: partial.created_at || '',
    updated_at: partial.updated_at || '',
    title: partial.title || '',
    status: partial.status || '',
    value: partial.value || '',
    payload_json: partial.payload_json || '{}'
});

export const exportUserDataCsv = async ({
    userId,
    userEmail,
    guestMode,
    habits,
    completions,
    notes,
    monthlyGoals
}: ExportContext) => {
    const effectiveUserId = userId || (guestMode ? 'guest' : '');
    const habitNameById = new Map(habits.map((habit) => [habit.id, habit.name || 'Untitled Habit']));
    const rows: ExportRow[] = [];

    rows.push(createRow({
        record_type: 'account',
        record_id: effectiveUserId || 'unknown',
        user_id: effectiveUserId,
        title: userEmail || (guestMode ? 'Guest User' : 'User'),
        status: guestMode ? 'guest' : 'authenticated',
        value: userEmail || '',
        payload_json: stringifyPayload({
            userEmail: userEmail || null,
            guestMode
        })
    }));

    habits.forEach((habit) => {
        rows.push(createRow({
            record_type: 'habit',
            record_id: habit.id,
            user_id: effectiveUserId,
            habit_id: habit.id,
            habit_name: habit.name || 'Untitled Habit',
            created_at: habit.createdAt || '',
            updated_at: habit.archivedAt || '',
            title: habit.name || 'Untitled Habit',
            status: habit.archivedAt ? 'archived' : 'active',
            value: String(habit.goal),
            payload_json: stringifyPayload({
                description: habit.description || '',
                type: habit.type,
                color: habit.color,
                goal: habit.goal,
                frequency: habit.frequency || [],
                weeklyTarget: habit.weeklyTarget ?? null,
                sortOrder: habit.sortOrder ?? null,
                archivedAt: habit.archivedAt || null,
                createdAt: habit.createdAt || null
            })
        }));
    });

    Object.entries(completions).forEach(([habitId, dates]) => {
        Object.entries(dates).forEach(([dateKey, completed]) => {
            if (!completed) return;
            rows.push(createRow({
                record_type: 'completion',
                record_id: `${habitId}:${dateKey}`,
                user_id: effectiveUserId,
                date_key: dateKey,
                habit_id: habitId,
                habit_name: habitNameById.get(habitId) || '',
                title: habitNameById.get(habitId) || '',
                status: 'completed',
                value: 'true',
                payload_json: stringifyPayload({
                    completed: true
                })
            }));
        });
    });

    Object.entries(notes).forEach(([dateKey, dayData]) => {
        if (!dayData) return;

        rows.push(createRow({
            record_type: 'daily_note',
            record_id: dateKey,
            user_id: effectiveUserId,
            date_key: dateKey,
            title: dateKey,
            status: 'saved',
            value: String(dayData.mood ?? ''),
            payload_json: stringifyPayload(dayData)
        }));

        (dayData.tasks || []).forEach((task) => {
            rows.push(createRow({
                record_type: 'task',
                record_id: task.id,
                parent_id: dateKey,
                user_id: effectiveUserId,
                date_key: dateKey,
                title: task.text,
                status: task.completed ? 'completed' : 'open',
                value: task.completed ? 'true' : 'false',
                payload_json: stringifyPayload(task)
            }));
        });

        (dayData.inactiveHabits || []).forEach((habitId) => {
            rows.push(createRow({
                record_type: 'inactive_habit',
                record_id: `${dateKey}:${habitId}`,
                parent_id: dateKey,
                user_id: effectiveUserId,
                date_key: dateKey,
                habit_id: habitId,
                habit_name: habitNameById.get(habitId) || '',
                title: habitNameById.get(habitId) || habitId,
                status: 'inactive',
                value: 'true',
                payload_json: stringifyPayload({ habitId, dateKey })
            }));
        });
    });

    Object.entries(monthlyGoals).forEach(([monthKey, goals]) => {
        goals.forEach((goal) => {
            rows.push(createRow({
                record_type: 'monthly_goal',
                record_id: goal.id,
                parent_id: monthKey,
                user_id: effectiveUserId,
                month_key: monthKey,
                title: goal.text,
                status: goal.completed ? 'completed' : 'open',
                value: goal.completed ? 'true' : 'false',
                payload_json: stringifyPayload(goal)
            }));
        });
    });

    if (userId) {
        const [profileResult, feedbackResult] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
            supabase
                .from('feedback')
                .select(`
                    *,
                    replies:feedback_replies(*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: true })
        ]);

        if (profileResult.error) {
            throw new Error(profileResult.error.message);
        }

        if (feedbackResult.error) {
            throw new Error(feedbackResult.error.message);
        }

        if (profileResult.data) {
            rows.push(createRow({
                record_type: 'profile',
                record_id: profileResult.data.id,
                user_id: userId,
                updated_at: profileResult.data.updated_at || '',
                title: 'Profile',
                status: profileResult.data.is_premium ? 'premium' : 'free',
                value: String(profileResult.data.analysis_count ?? ''),
                payload_json: stringifyPayload(profileResult.data)
            }));
        }

        (feedbackResult.data || []).forEach((feedback: any) => {
            rows.push(createRow({
                record_type: 'feedback',
                record_id: feedback.id,
                user_id: userId,
                created_at: feedback.created_at || '',
                title: feedback.content || '',
                status: feedback.status || '',
                value: feedback.type || '',
                payload_json: stringifyPayload({
                    id: feedback.id,
                    type: feedback.type,
                    content: feedback.content,
                    status: feedback.status,
                    created_at: feedback.created_at,
                    metadata: feedback.metadata || null
                })
            }));

            (feedback.replies || []).forEach((reply: any) => {
                rows.push(createRow({
                    record_type: 'feedback_reply',
                    record_id: reply.id,
                    parent_id: feedback.id,
                    user_id: userId,
                    created_at: reply.created_at || '',
                    title: reply.content || '',
                    status: reply.is_admin_reply ? 'admin_reply' : 'user_reply',
                    value: reply.feedback_id || '',
                    payload_json: stringifyPayload(reply)
                }));
            });
        });
    }

    if (rows.length === 0) {
        throw new Error('No data available to export.');
    }

    const filename = `habit-tracker-export-${sanitizeFileSegment(userEmail || effectiveUserId || 'user')}.csv`;
    downloadTextFile(filename, toCsv(rows));

    return {
        filename,
        rowCount: rows.length
    };
};
