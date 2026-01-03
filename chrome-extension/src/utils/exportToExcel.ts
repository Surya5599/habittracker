import ExcelJS from 'exceljs';
import { Habit, HabitCompletion, Theme } from '../types';

interface ExportOptions {
    habits: Habit[];
    completions: HabitCompletion;
    currentYear: number;
    currentMonthIndex: number;
    theme: Theme;
    userName?: string;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const exportToExcel = async ({
    habits,
    completions,
    currentYear,
    currentMonthIndex,
    theme,
    userName = 'User'
}: ExportOptions): Promise<void> => {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = userName;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create Monthly Tracking Sheet
    const monthSheet = workbook.addWorksheet(`${MONTH_NAMES[currentMonthIndex]} ${currentYear}`);

    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const themeColor = hexToRgb(theme.primary);
    const secondaryColor = hexToRgb(theme.secondary);

    // Set up headers
    monthSheet.columns = [
        { header: 'Habit Name', key: 'habitName', width: 25 },
        { header: 'Goal %', key: 'goal', width: 10 },
        ...monthDates.map(day => ({
            header: day.toString(),
            key: `day${day}`,
            width: 4
        })),
        { header: 'Completed', key: 'completed', width: 12 },
        { header: 'Missed', key: 'missed', width: 10 },
        { header: 'Success %', key: 'percentage', width: 12 }
    ];

    // Style header row
    const headerRow = monthSheet.getRow(1);
    headerRow.height = 25;
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${theme.primary.replace('#', '')}` }
    };

    // Add a second header row for day of week
    const dayRow = monthSheet.insertRow(2, []);
    dayRow.height = 20;
    dayRow.font = { bold: true, size: 9 };
    dayRow.alignment = { vertical: 'middle', horizontal: 'center' };
    dayRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${theme.secondary.replace('#', '')}40` }
    };

    // Fill in day of week
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    monthDates.forEach((day, index) => {
        const date = new Date(currentYear, currentMonthIndex, day);
        const dayOfWeek = daysOfWeek[date.getDay()];
        dayRow.getCell(index + 3).value = dayOfWeek;
    });

    // Add habits data
    habits.forEach((habit, habitIndex) => {
        const rowIndex = habitIndex + 3; // Start after header rows
        const row = monthSheet.getRow(rowIndex);

        // Habit name
        row.getCell(1).value = habit.name || 'Untitled Habit';
        row.getCell(1).font = { bold: true, size: 10 };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

        // Goal
        row.getCell(2).value = habit.goal;
        row.getCell(2).numFmt = '0"%"';
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).font = { bold: true, color: { argb: `FF${theme.secondary.replace('#', '')}` } };

        // Add checkboxes for each day
        monthDates.forEach((day, dayIndex) => {
            const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isCompleted = completions[habit.id]?.[dateKey] || false;

            const cell = row.getCell(dayIndex + 3);
            cell.value = isCompleted;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };

            // Add data validation for checkbox
            cell.dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: ['TRUE,FALSE'],
                showErrorMessage: true,
                errorTitle: 'Invalid Entry',
                error: 'Please select TRUE or FALSE'
            };

            // Style based on completion
            if (isCompleted) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: `FF${theme.secondary.replace('#', '')}` }
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            }

            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
            };
        });

        // Calculate stats with formulas
        const firstDayCol = 3;
        const lastDayCol = firstDayCol + daysInMonth - 1;
        const firstDayAddress = monthSheet.getColumn(firstDayCol).letter;
        const lastDayAddress = monthSheet.getColumn(lastDayCol).letter;

        // Completed count
        const completedCell = row.getCell(daysInMonth + 3);
        completedCell.value = {
            formula: `COUNTIF(${firstDayAddress}${rowIndex}:${lastDayAddress}${rowIndex},TRUE)`
        };
        completedCell.font = { bold: true, color: { argb: `FF${theme.primary.replace('#', '')}` } };
        completedCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Missed count
        const missedCell = row.getCell(daysInMonth + 4);
        missedCell.value = {
            formula: `COUNTIF(${firstDayAddress}${rowIndex}:${lastDayAddress}${rowIndex},FALSE)`
        };
        missedCell.font = { bold: true, color: { argb: 'FFEF4444' } };
        missedCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Success percentage
        const percentCell = row.getCell(daysInMonth + 5);
        percentCell.value = {
            formula: `COUNTIF(${firstDayAddress}${rowIndex}:${lastDayAddress}${rowIndex},TRUE)/${daysInMonth}`
        };
        percentCell.numFmt = '0.0"%"';
        percentCell.font = { bold: true };
        percentCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Conditional formatting for percentage
        percentCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' }
        };

        row.height = 22;
    });

    // Add borders to all cells
    monthSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            if (!cell.border) {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                };
            }
        });
    });

    // Create Statistics Sheet
    const statsSheet = workbook.addWorksheet('Statistics');

    // Stats header
    statsSheet.mergeCells('A1:D1');
    const statsTitle = statsSheet.getCell('A1');
    statsTitle.value = `${MONTH_NAMES[currentMonthIndex]} ${currentYear} - Habit Statistics`;
    statsTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    statsTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    statsTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${theme.primary.replace('#', '')}` }
    };
    statsSheet.getRow(1).height = 30;

    // Column headers
    statsSheet.getRow(3).values = ['Rank', 'Habit Name', 'Days Completed', 'Success Rate'];
    statsSheet.getRow(3).font = { bold: true, size: 11 };
    statsSheet.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' };
    statsSheet.getRow(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${theme.secondary.replace('#', '')}40` }
    };

    statsSheet.columns = [
        { key: 'rank', width: 8 },
        { key: 'name', width: 30 },
        { key: 'completed', width: 18 },
        { key: 'rate', width: 15 }
    ];

    // Calculate and sort habits by completion
    const habitStats = habits.map(habit => {
        let completed = 0;
        monthDates.forEach(day => {
            const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (completions[habit.id]?.[dateKey]) {
                completed++;
            }
        });
        return {
            name: habit.name || 'Untitled Habit',
            completed,
            rate: (completed / daysInMonth) * 100
        };
    }).sort((a, b) => b.completed - a.completed);

    // Add stats data
    habitStats.forEach((stat, index) => {
        const row = statsSheet.getRow(index + 4);
        row.values = [
            index + 1,
            stat.name,
            stat.completed,
            stat.rate / 100
        ];

        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(1).font = { bold: true, color: { argb: 'FF999999' } };

        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
        row.getCell(2).font = { bold: true };

        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(3).font = { bold: true, color: { argb: `FF${theme.primary.replace('#', '')}` } };

        row.getCell(4).numFmt = '0.0"%"';
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(4).font = { bold: true };

        // Color code success rate
        if (stat.rate >= 80) {
            row.getCell(4).font = { bold: true, color: { argb: 'FF10B981' } };
        } else if (stat.rate >= 60) {
            row.getCell(4).font = { bold: true, color: { argb: 'FFF59E0B' } };
        } else {
            row.getCell(4).font = { bold: true, color: { argb: 'FFEF4444' } };
        }

        row.height = 22;
    });

    // Add borders to stats sheet
    statsSheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 3) {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                };
            });
        }
    });

    // Create Dashboard Sheet with Visual Analytics
    const dashSheet = workbook.addWorksheet('Dashboard');

    // Dashboard Title
    dashSheet.mergeCells('A1:H1');
    const dashTitle = dashSheet.getCell('A1');
    dashTitle.value = `📊 ${MONTH_NAMES[currentMonthIndex]} ${currentYear} - Live Dashboard`;
    dashTitle.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    dashTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    dashTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${theme.primary.replace('#', '')}` }
    };
    dashSheet.getRow(1).height = 40;

    // Key Metrics Section
    dashSheet.mergeCells('A3:D3');
    const metricsHeader = dashSheet.getCell('A3');
    metricsHeader.value = '📈 KEY METRICS';
    metricsHeader.font = { bold: true, size: 14, color: { argb: `FF${theme.primary.replace('#', '')}` } };
    metricsHeader.alignment = { vertical: 'middle', horizontal: 'left' };

    // Calculate overall stats
    const totalPossible = habits.length * daysInMonth;
    let totalCompleted = 0;
    habits.forEach(habit => {
        monthDates.forEach(day => {
            const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (completions[habit.id]?.[dateKey]) {
                totalCompleted++;
            }
        });
    });
    const overallRate = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;

    // Metric cards with data bars
    const metrics = [
        { label: 'Total Habits', value: habits.length, color: 'FF6366F1' },
        { label: 'Days in Month', value: daysInMonth, color: 'FF8B5CF6' },
        { label: 'Total Completed', value: totalCompleted, color: `FF${theme.primary.replace('#', '')}` },
        { label: 'Success Rate', value: `${overallRate.toFixed(1)}%`, color: 'FF10B981' }
    ];

    metrics.forEach((metric, index) => {
        const row = 5 + index;
        dashSheet.getCell(`A${row}`).value = metric.label;
        dashSheet.getCell(`A${row}`).font = { bold: true, size: 11 };
        dashSheet.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'left' };

        dashSheet.getCell(`B${row}`).value = metric.value;
        dashSheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: metric.color } };
        dashSheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'right' };
        dashSheet.getCell(`B${row}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: `${metric.color}20` }
        };
    });

    // Daily Progress with Data Bars
    dashSheet.mergeCells('A10:H10');
    const progressHeader = dashSheet.getCell('A10');
    progressHeader.value = '📅 DAILY PROGRESS (with visual bars)';
    progressHeader.font = { bold: true, size: 14, color: { argb: `FF${theme.primary.replace('#', '')}` } };
    progressHeader.alignment = { vertical: 'middle', horizontal: 'left' };

    // Headers for daily progress
    dashSheet.getCell('A12').value = 'Day';
    dashSheet.getCell('B12').value = 'Completions';
    dashSheet.getCell('C12').value = 'Visual Progress';
    dashSheet.getCell('D12').value = 'Rate %';
    dashSheet.getRow(12).font = { bold: true };
    dashSheet.getRow(12).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${theme.secondary.replace('#', '')}40` }
    };

    // Add daily data with conditional formatting
    monthDates.forEach((day, index) => {
        const rowNum = 13 + index;
        let dayCompletions = 0;

        habits.forEach(habit => {
            const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (completions[habit.id]?.[dateKey]) {
                dayCompletions++;
            }
        });

        const dayRate = habits.length > 0 ? (dayCompletions / habits.length) * 100 : 0;

        dashSheet.getCell(`A${rowNum}`).value = day;
        dashSheet.getCell(`A${rowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };

        dashSheet.getCell(`B${rowNum}`).value = dayCompletions;
        dashSheet.getCell(`B${rowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };

        // Create visual bar using repeated characters
        const barLength = Math.round((dayCompletions / (habits.length || 1)) * 20);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        dashSheet.getCell(`C${rowNum}`).value = bar;
        dashSheet.getCell(`C${rowNum}`).font = { name: 'Consolas', size: 10, color: { argb: `FF${theme.primary.replace('#', '')}` } };

        dashSheet.getCell(`D${rowNum}`).value = dayRate / 100;
        dashSheet.getCell(`D${rowNum}`).numFmt = '0.0"%"';
        dashSheet.getCell(`D${rowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };

        // Conditional formatting with colors
        if (dayRate >= 80) {
            dashSheet.getCell(`D${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF10B98140' }
            };
            dashSheet.getCell(`D${rowNum}`).font = { bold: true, color: { argb: 'FF10B981' } };
        } else if (dayRate >= 60) {
            dashSheet.getCell(`D${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF59E0B40' }
            };
            dashSheet.getCell(`D${rowNum}`).font = { bold: true, color: { argb: 'FFF59E0B' } };
        } else if (dayRate > 0) {
            dashSheet.getCell(`D${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEF444440' }
            };
            dashSheet.getCell(`D${rowNum}`).font = { bold: true, color: { argb: 'FFEF4444' } };
        }
    });

    // Weekly Summary Section
    const weeklyStartRow = 13 + daysInMonth + 2;
    dashSheet.mergeCells(`A${weeklyStartRow}:H${weeklyStartRow}`);
    const weeklyHeader = dashSheet.getCell(`A${weeklyStartRow}`);
    weeklyHeader.value = '📊 WEEKLY BREAKDOWN';
    weeklyHeader.font = { bold: true, size: 14, color: { argb: `FF${theme.primary.replace('#', '')}` } };
    weeklyHeader.alignment = { vertical: 'middle', horizontal: 'left' };

    dashSheet.getCell(`A${weeklyStartRow + 2}`).value = 'Week';
    dashSheet.getCell(`B${weeklyStartRow + 2}`).value = 'Total';
    dashSheet.getCell(`C${weeklyStartRow + 2}`).value = 'Avg/Day';
    dashSheet.getCell(`D${weeklyStartRow + 2}`).value = 'Trend';
    dashSheet.getRow(weeklyStartRow + 2).font = { bold: true };
    dashSheet.getRow(weeklyStartRow + 2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${theme.primary.replace('#', '')}40` }
    };

    // Calculate weekly data
    let weekNum = 1;
    let weekTotal = 0;
    let weekDays = 0;
    const weeklyTotals: number[] = [];

    monthDates.forEach((day, index) => {
        let dayCompletions = 0;
        habits.forEach(habit => {
            const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (completions[habit.id]?.[dateKey]) {
                dayCompletions++;
            }
        });

        weekTotal += dayCompletions;
        weekDays++;

        if ((index + 1) % 7 === 0 || index === monthDates.length - 1) {
            const avg = weekTotal / weekDays;
            weeklyTotals.push(weekTotal);

            const rowNum = weeklyStartRow + 2 + weekNum;
            dashSheet.getCell(`A${rowNum}`).value = `Week ${weekNum}`;
            dashSheet.getCell(`B${rowNum}`).value = weekTotal;
            dashSheet.getCell(`B${rowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };
            dashSheet.getCell(`B${rowNum}`).font = { bold: true };

            dashSheet.getCell(`C${rowNum}`).value = avg;
            dashSheet.getCell(`C${rowNum}`).numFmt = '0.0';
            dashSheet.getCell(`C${rowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };

            // Trend indicator
            let trend = '→';
            if (weekNum > 1 && weeklyTotals[weekNum - 1] > weeklyTotals[weekNum - 2]) {
                trend = '↗';
                dashSheet.getCell(`D${rowNum}`).font = { bold: true, size: 16, color: { argb: 'FF10B981' } };
            } else if (weekNum > 1 && weeklyTotals[weekNum - 1] < weeklyTotals[weekNum - 2]) {
                trend = '↘';
                dashSheet.getCell(`D${rowNum}`).font = { bold: true, size: 16, color: { argb: 'FFEF4444' } };
            } else {
                dashSheet.getCell(`D${rowNum}`).font = { bold: true, size: 16, color: { argb: 'FFF59E0B' } };
            }
            dashSheet.getCell(`D${rowNum}`).value = trend;
            dashSheet.getCell(`D${rowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };

            weekNum++;
            weekTotal = 0;
            weekDays = 0;
        }
    });

    // Habit Performance Heatmap
    const heatmapStartRow = weeklyStartRow + 2 + weekNum + 2;
    dashSheet.mergeCells(`F3:H3`);
    const heatmapHeader = dashSheet.getCell('F3');
    heatmapHeader.value = '🔥 TOP PERFORMERS';
    heatmapHeader.font = { bold: true, size: 14, color: { argb: `FF${theme.primary.replace('#', '')}` } };
    heatmapHeader.alignment = { vertical: 'middle', horizontal: 'left' };

    dashSheet.getCell('F5').value = 'Habit';
    dashSheet.getCell('G5').value = 'Days';
    dashSheet.getCell('H5').value = 'Score';
    dashSheet.getRow(5).font = { bold: true };

    // Sort and display top habits
    const habitPerformance = habits.map(habit => {
        let completed = 0;
        monthDates.forEach(day => {
            const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (completions[habit.id]?.[dateKey]) {
                completed++;
            }
        });
        return { name: habit.name || 'Untitled', completed, rate: (completed / daysInMonth) * 100 };
    }).sort((a, b) => b.completed - a.completed).slice(0, 10);

    habitPerformance.forEach((habit, index) => {
        const rowNum = 6 + index;
        dashSheet.getCell(`F${rowNum}`).value = habit.name;
        dashSheet.getCell(`F${rowNum}`).font = { bold: true, size: 10 };

        dashSheet.getCell(`G${rowNum}`).value = habit.completed;
        dashSheet.getCell(`G${rowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };

        dashSheet.getCell(`H${rowNum}`).value = habit.rate / 100;
        dashSheet.getCell(`H${rowNum}`).numFmt = '0"%"';
        dashSheet.getCell(`H${rowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };

        // Color coding
        if (habit.rate >= 80) {
            dashSheet.getCell(`H${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF10B981' }
            };
            dashSheet.getCell(`H${rowNum}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        } else if (habit.rate >= 60) {
            dashSheet.getCell(`H${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF59E0B' }
            };
            dashSheet.getCell(`H${rowNum}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        }
    });

    // Set column widths for dashboard
    dashSheet.getColumn('A').width = 18;
    dashSheet.getColumn('B').width = 15;
    dashSheet.getColumn('C').width = 25;
    dashSheet.getColumn('D').width = 12;
    dashSheet.getColumn('F').width = 25;
    dashSheet.getColumn('G').width = 10;
    dashSheet.getColumn('H').width = 12;

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HabitTracker_${MONTH_NAMES[currentMonthIndex]}_${currentYear}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
