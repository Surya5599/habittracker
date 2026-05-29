import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { JournalPdfPreviewModal } from '../components/JournalPdfPreviewModal';
import type { DailyNote, Theme } from '../types';

// ResizeObserver is not available in jsdom
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const theme: Theme = { name: 'default', primary: '#6366f1', secondary: '#a5b4fc' };

const notes: DailyNote = {
    '2024-01-01': { tasks: [], journal: 'Happy New Year!' },
    '2024-01-02': { tasks: [], journal: 'Second entry' },
    '2024-01-03': { tasks: [], journal: 'Third entry' },
};

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    notes,
    theme,
    userName: 'Tester',
};

describe('JournalPdfPreviewModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders when open', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        expect(screen.getByText('Export Journal')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<JournalPdfPreviewModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Export Journal')).not.toBeInTheDocument();
    });

    it('shows correct total page count (cover + entries)', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        // 3 entries + 1 cover = 4 pages; bottom bar shows "1 / 4"
        expect(screen.getAllByText('1 / 4').length).toBeGreaterThan(0);
    });

    it('advances to next page on Next button click', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const nextBtn = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextBtn);
        expect(screen.getAllByText('2 / 4').length).toBeGreaterThan(0);
    });

    it('goes back to previous page on Prev button click', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const nextBtn = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextBtn);
        fireEvent.click(nextBtn);
        const prevBtn = screen.getByRole('button', { name: /prev/i });
        fireEvent.click(prevBtn);
        expect(screen.getAllByText('2 / 4').length).toBeGreaterThan(0);
    });

    it('Prev button is disabled on first page', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const prevBtn = screen.getByRole('button', { name: /prev/i });
        expect(prevBtn).toBeDisabled();
    });

    it('Next button is disabled on last page', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const nextBtn = screen.getByRole('button', { name: /next/i });
        // Click to last page (4 pages total, need 3 clicks)
        fireEvent.click(nextBtn);
        fireEvent.click(nextBtn);
        fireEvent.click(nextBtn);
        expect(nextBtn).toBeDisabled();
    });

    it('navigates with keyboard arrow keys', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        fireEvent.keyDown(window, { key: 'ArrowRight' });
        expect(screen.getAllByText('2 / 4').length).toBeGreaterThan(0);
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
        expect(screen.getAllByText('1 / 4').length).toBeGreaterThan(0);
    });

    it('filters entries by search query', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const searchInput = screen.getByPlaceholderText('Filter entries…');
        fireEvent.change(searchInput, { target: { value: 'Second' } });
        // 1 matching entry + cover = 2 pages
        expect(screen.getAllByText('1 / 2').length).toBeGreaterThan(0);
    });

    it('clears search filter with X button', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const searchInput = screen.getByPlaceholderText('Filter entries…');
        fireEvent.change(searchInput, { target: { value: 'Second' } });
        // Scope to the search box container so we pick the right X button
        const searchBox = searchInput.closest('div')!;
        const clearBtn = within(searchBox).getByRole('button');
        fireEvent.click(clearBtn);
        // Back to 4 pages
        expect(screen.getAllByText('1 / 4').length).toBeGreaterThan(0);
    });

    it('calls onClose when backdrop is clicked', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const backdrop = document.querySelector('.fixed.inset-0');
        if (backdrop) fireEvent.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when X button in header is clicked', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        // The top-bar X button closes the modal
        const topBar = document.querySelector('.border-b-\\[3px\\]');
        const xBtn = topBar?.querySelector('button:last-child');
        if (xBtn) fireEvent.click(xBtn);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('zoom in button increases zoom and shows percentage', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const zoomInBtn = screen.getByTitle('Zoom in');
        fireEvent.click(zoomInBtn);
        // After one click: 125%
        expect(screen.getByTitle('Reset to fit')).toHaveTextContent('125%');
    });

    it('zoom out button decreases zoom', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const zoomInBtn = screen.getByTitle('Zoom in');
        fireEvent.click(zoomInBtn); // 125%
        fireEvent.click(zoomInBtn); // 150%
        const zoomOutBtn = screen.getByTitle('Zoom out');
        fireEvent.click(zoomOutBtn); // 125%
        expect(screen.getByTitle('Reset to fit')).toHaveTextContent('125%');
    });

    it('zoom out is disabled at minimum (25%)', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const zoomOutBtn = screen.getByTitle('Zoom out');
        // Click 3 times: 100% → 75% → 50% → 25% (disabled at next click)
        fireEvent.click(zoomOutBtn);
        fireEvent.click(zoomOutBtn);
        fireEvent.click(zoomOutBtn);
        expect(zoomOutBtn).toBeDisabled();
    });

    it('reset button resets zoom to fit and shows fit icon', () => {
        render(<JournalPdfPreviewModal {...defaultProps} />);
        const zoomInBtn = screen.getByTitle('Zoom in');
        fireEvent.click(zoomInBtn); // 125%
        const resetBtn = screen.getByTitle('Reset to fit');
        fireEvent.click(resetBtn);
        // Back to fit icon (no percentage text)
        expect(screen.getByTitle('Reset to fit').querySelector('svg')).toBeInTheDocument();
    });

    it('shows "No entries to preview" message when notes are empty', () => {
        render(<JournalPdfPreviewModal {...defaultProps} notes={{}} />);
        // totalPages = 0, so page indicator shows —
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
});
