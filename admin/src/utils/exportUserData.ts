import { supabase } from '../supabase';

type Row = Record<string, unknown>;

interface DatasetConfig {
    key: string;
    filename: string;
    rows: Row[];
}

const escapeCsvCell = (value: unknown): string => {
    if (value === null || value === undefined) return '';

    const stringValue = typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
            ? String(value)
            : JSON.stringify(value);

    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
};

const rowsToCsv = (rows: Row[]): string => {
    if (rows.length === 0) return '';

    const columns = Array.from(
        rows.reduce((set, row) => {
            Object.keys(row).forEach((key) => set.add(key));
            return set;
        }, new Set<string>())
    );

    const header = columns.join(',');
    const body = rows
        .map((row) => columns.map((column) => escapeCsvCell(row[column])).join(','))
        .join('\n');

    return `${header}\n${body}`;
};

const downloadCsv = (filename: string, csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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

export const exportUserDataAsCsv = async (userId: string) => {
    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
        throw new Error('User ID is required.');
    }

    const [
        habitsResult,
        completionsResult,
        notesResult,
        goalsResult,
        profilesResult,
        feedbackResult
    ] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', trimmedUserId).order('sort_order', { ascending: true }),
        supabase.from('completions').select('*').eq('user_id', trimmedUserId).order('date_key', { ascending: true }),
        supabase.from('daily_notes').select('*').eq('user_id', trimmedUserId).order('date_key', { ascending: true }),
        supabase.from('monthly_goals').select('*').eq('user_id', trimmedUserId).order('month_key', { ascending: true }),
        supabase.from('profiles').select('*').eq('id', trimmedUserId).limit(1),
        supabase.from('feedback').select('*').eq('user_id', trimmedUserId).order('created_at', { ascending: true })
    ]);

    const coreResults = [
        { name: 'habits', error: habitsResult.error },
        { name: 'completions', error: completionsResult.error },
        { name: 'daily_notes', error: notesResult.error },
        { name: 'monthly_goals', error: goalsResult.error },
        { name: 'profiles', error: profilesResult.error },
        { name: 'feedback', error: feedbackResult.error }
    ];

    const failed = coreResults.find((result) => result.error);
    if (failed?.error) {
        throw new Error(`Failed to export ${failed.name}: ${failed.error.message}`);
    }

    const feedbackIds = (feedbackResult.data || []).map((row: any) => row.id).filter(Boolean);
    const repliesResult = feedbackIds.length > 0
        ? await supabase.from('feedback_replies').select('*').in('feedback_id', feedbackIds).order('created_at', { ascending: true })
        : { data: [], error: null };

    if (repliesResult.error) {
        throw new Error(`Failed to export feedback_replies: ${repliesResult.error.message}`);
    }

    const fileBase = `user-${sanitizeFileSegment(trimmedUserId)}`;
    const datasets: DatasetConfig[] = [
        { key: 'habits', filename: `${fileBase}-habits.csv`, rows: habitsResult.data || [] },
        { key: 'completions', filename: `${fileBase}-completions.csv`, rows: completionsResult.data || [] },
        { key: 'daily-notes', filename: `${fileBase}-daily-notes.csv`, rows: notesResult.data || [] },
        { key: 'monthly-goals', filename: `${fileBase}-monthly-goals.csv`, rows: goalsResult.data || [] },
        { key: 'profile', filename: `${fileBase}-profile.csv`, rows: profilesResult.data || [] },
        { key: 'feedback', filename: `${fileBase}-feedback.csv`, rows: feedbackResult.data || [] },
        { key: 'feedback-replies', filename: `${fileBase}-feedback-replies.csv`, rows: repliesResult.data || [] }
    ];

    let downloadedFiles = 0;
    datasets.forEach((dataset) => {
        if (dataset.rows.length === 0) return;
        downloadCsv(dataset.filename, rowsToCsv(dataset.rows));
        downloadedFiles += 1;
    });

    if (downloadedFiles === 0) {
        throw new Error('No rows found for this user.');
    }

    return {
        downloadedFiles,
        exportedDatasets: datasets.filter((dataset) => dataset.rows.length > 0).map((dataset) => dataset.key)
    };
};
