import { Theme } from '../types';
import { ColorScheme } from '../components/ShareCustomizationModal';

interface ShareCardData {
    dayName: string;
    dateString: string;
    completedCount: number;
    totalCount: number;
    progress: number;
    theme: Theme;
    colorScheme?: ColorScheme;
    message?: string;
}

export const generateShareCard = async (data: ShareCardData): Promise<Blob> => {
    const { dayName, dateString, completedCount, totalCount, progress, theme, colorScheme, message } = data;

    // Use custom color scheme or fall back to theme
    const headerColor = colorScheme?.primary || theme.primary;
    const progressColor = colorScheme?.gradient
        ? colorScheme.primary
        : (colorScheme?.primary || theme.primary);
    const useGradient = colorScheme?.gradient || false;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Set canvas size (Instagram story size: 1080x1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // Background
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Main card
    const cardX = 140;
    const cardY = 400;
    const cardWidth = 800;
    const cardHeight = 1120;

    // Card shadow
    ctx.fillStyle = '#000000';
    ctx.fillRect(cardX + 12, cardY + 12, cardWidth, cardHeight);

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    // Card border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

    // Header background
    const headerHeight = 180;
    if (useGradient && colorScheme) {
        const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + headerHeight);
        gradient.addColorStop(0, colorScheme.primary);
        gradient.addColorStop(1, colorScheme.secondary);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = headerColor;
    }
    ctx.fillRect(cardX, cardY, cardWidth, headerHeight);

    // Header border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cardX, cardY + headerHeight);
    ctx.lineTo(cardX + cardWidth, cardY + headerHeight);
    ctx.stroke();

    // Day name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(dayName.toUpperCase(), cardX + cardWidth / 2, cardY + 90);

    // Date
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(dateString, cardX + cardWidth / 2, cardY + 145);

    // Progress circle
    const circleY = cardY + headerHeight + 250;
    const circleRadius = 160;
    const circleLineWidth = 24;

    // Background circle
    ctx.beginPath();
    ctx.arc(cardX + cardWidth / 2, circleY, circleRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = circleLineWidth;
    ctx.stroke();

    // Progress circle
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * progress) / 100;
    ctx.arc(cardX + cardWidth / 2, circleY, circleRadius, startAngle, endAngle);
    if (useGradient && colorScheme) {
        const gradient = ctx.createLinearGradient(
            cardX + cardWidth / 2 - circleRadius,
            circleY,
            cardX + cardWidth / 2 + circleRadius,
            circleY
        );
        gradient.addColorStop(0, colorScheme.primary);
        gradient.addColorStop(1, colorScheme.secondary);
        ctx.strokeStyle = gradient;
    } else {
        ctx.strokeStyle = progressColor;
    }
    ctx.lineWidth = circleLineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress percentage
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(progress)}%`, cardX + cardWidth / 2, circleY + 30);

    // Completion stats
    const statsY = circleY + 220;
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText(`${completedCount}/${totalCount} HABITS`, cardX + cardWidth / 2, statsY);

    ctx.font = 'bold 56px Arial';
    if (useGradient && colorScheme) {
        const gradient = ctx.createLinearGradient(cardX, statsY + 70, cardX + cardWidth, statsY + 70);
        gradient.addColorStop(0, colorScheme.primary);
        gradient.addColorStop(1, colorScheme.secondary);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = progressColor;
    }
    ctx.fillText('COMPLETED', cardX + cardWidth / 2, statsY + 70);

    // Motivational message (use custom or random)
    const displayMessage = message || '🔥 CRUSHING IT!';

    ctx.font = 'bold 52px Arial';
    ctx.fillStyle = '#444444';
    ctx.fillText(displayMessage, cardX + cardWidth / 2, statsY + 180);

    // Footer
    const footerY = cardY + cardHeight - 80;
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#999999';
    ctx.fillText('HABICARD', cardX + cardWidth / 2, footerY);

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to generate image'));
            }
        }, 'image/png');
    });
};

export const shareCard = async (blob: Blob, dayName: string) => {
    const fileName = `habit-tracker-${dayName.toLowerCase()}.png`;

    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
        try {
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'My Habit Progress',
                    text: `Completed all my habits! 🎉`
                });
                return;
            }
        } catch (error) {
            // If sharing fails, fall through to download
            console.log('Share failed, downloading instead:', error);
        }
    }

    // Fallback: Download the image
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
