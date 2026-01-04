import { Theme } from '../types';
import { ColorScheme } from '../components/ShareCustomizationModal';
import toast from 'react-hot-toast';

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

    // Draw rounded rectangle helper (moved up for reuse)
    const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    // Helper: Draw Cloud
    const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 60 * scale, 0, Math.PI * 2);
        ctx.arc(x + 50 * scale, y - 20 * scale, 70 * scale, 0, Math.PI * 2);
        ctx.arc(x + 110 * scale, y, 60 * scale, 0, Math.PI * 2);
        ctx.fill();
    };

    // Helper: Draw Geometric Petal
    const drawPetal = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotate: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotate);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    };

    // Background Base
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, '#f8f8f8');
    bgGradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Background Elements (Clouds & Petals)
    drawCloud(ctx, 100, 200, 2.5, 'rgba(255, 255, 255, 0.6)');
    drawCloud(ctx, 900, 1600, 3, 'rgba(255, 255, 255, 0.6)');

    // Abstract Petal Patterns (Modern Aesthetic)
    drawPetal(ctx, 900, 300, 150, theme.secondary + '20', Math.PI / 4);
    drawPetal(ctx, 900, 300, 150, theme.secondary + '20', -Math.PI / 4);

    drawPetal(ctx, 200, 1500, 180, theme.primary + '20', Math.PI / 3);
    drawPetal(ctx, 200, 1500, 180, theme.primary + '20', -Math.PI / 3);

    // Floating Squares (Confetti)
    ctx.fillStyle = theme.primary + '40';
    ctx.fillRect(100, 600, 40, 40);
    ctx.fillRect(950, 900, 60, 60);
    ctx.fillStyle = theme.secondary + '40';
    ctx.fillRect(800, 200, 50, 50);
    ctx.fillRect(150, 1300, 30, 30);

    // Use loop for grid pattern
    ctx.fillStyle = '#d4d4d4';
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
            if (x % (gridSize * 2) === 0 && y % (gridSize * 2) === 0) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    // Draw sparkle helper
    const drawSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.quadraticCurveTo(x, y, x + size, y);
        ctx.quadraticCurveTo(x, y, x, y + size);
        ctx.quadraticCurveTo(x, y, x - size, y);
        ctx.quadraticCurveTo(x, y, x, y - size);
        ctx.closePath();
        ctx.fill();
    };

    // Draw some shiny sparkles
    drawSparkle(ctx, 100, 300, 30, '#000000');
    drawSparkle(ctx, 900, 500, 40, theme.primary);
    drawSparkle(ctx, 950, 1600, 25, '#000000');
    drawSparkle(ctx, 150, 1700, 35, theme.secondary);


    // Main card
    const cardX = 140;
    const cardY = 400;
    const cardWidth = 800;
    const cardHeight = 1120;
    const borderRadius = 50;

    // Card shadow (Soft & Hard Combo)
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#000000';
    roundRect(ctx, cardX + 10, cardY + 10, cardWidth, cardHeight, borderRadius);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset

    // Card background
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
    ctx.fill();

    // Card border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
    ctx.stroke();

    // Header background
    const headerHeight = 220;
    ctx.save();
    // Clip to the top part of the rounded card
    ctx.beginPath();
    ctx.moveTo(cardX + borderRadius, cardY);
    ctx.lineTo(cardX + cardWidth - borderRadius, cardY);
    ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + borderRadius);
    ctx.lineTo(cardX + cardWidth, cardY + headerHeight);
    ctx.lineTo(cardX, cardY + headerHeight);
    ctx.lineTo(cardX, cardY + borderRadius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + borderRadius, cardY);
    ctx.closePath();
    ctx.clip();

    if (useGradient && colorScheme) {
        const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + headerHeight);
        gradient.addColorStop(0, colorScheme.primary);
        gradient.addColorStop(1, colorScheme.secondary);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = headerColor;
    }
    ctx.fillRect(cardX, cardY, cardWidth, headerHeight);

    // Header Shine (Gloss)
    const glossGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + headerHeight);
    glossGradient.addColorStop(0, 'rgba(255,255,255,0.4)');
    glossGradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    glossGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glossGradient;
    ctx.fillRect(cardX, cardY, cardWidth, headerHeight);

    // Header Noise/Texture (Subtle lines)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    for (let i = 0; i < cardWidth; i += 30) {
        ctx.beginPath();
        ctx.moveTo(cardX + i, cardY);
        ctx.lineTo(cardX + i - 80, cardY + headerHeight);
        ctx.stroke();
    }

    ctx.restore();

    // Header bottom border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cardX, cardY + headerHeight);
    ctx.lineTo(cardX + cardWidth, cardY + headerHeight);
    ctx.stroke();

    // Day name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 90px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillText(dayName.toUpperCase(), cardX + cardWidth / 2, cardY + 110);
    ctx.shadowColor = 'transparent';

    // Date
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(dateString, cardX + cardWidth / 2, cardY + 170);

    // Progress circle container
    const circleY = cardY + headerHeight + 250;
    const circleRadius = 160;
    const circleLineWidth = 28;

    // Decorative ring (dashed)
    ctx.beginPath();
    ctx.arc(cardX + cardWidth / 2, circleY, circleRadius + 40, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

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
    ctx.font = '900 110px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(progress)}%`, cardX + cardWidth / 2, circleY + 35);

    // Completion stats container
    const statsY = circleY + 240;

    // Divider line
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 200, statsY - 60);
    ctx.lineTo(cardX + cardWidth - 200, statsY - 60);
    ctx.stroke();

    ctx.font = 'bold 42px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText(`${completedCount}/${totalCount} HABITS`, cardX + cardWidth / 2, statsY);

    ctx.font = '900 64px Arial, sans-serif';
    if (useGradient && colorScheme) {
        const gradient = ctx.createLinearGradient(cardX, statsY + 70, cardX + cardWidth, statsY + 70);
        gradient.addColorStop(0, colorScheme.primary);
        gradient.addColorStop(1, colorScheme.secondary);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = progressColor;
    }
    ctx.fillText('COMPLETED', cardX + cardWidth / 2, statsY + 75);

    // Motivational message (use custom or random)
    const displayMessage = message || '🔥 CRUSHING IT!';

    // Message Box
    const msgBoxY = statsY + 160;
    ctx.fillStyle = '#000';
    roundRect(ctx, cardX + 100, msgBoxY, cardWidth - 200, 100, 50);
    ctx.fill();

    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(displayMessage, cardX + cardWidth / 2, msgBoxY + 65);

    // Footer
    const footerY = cardY + cardHeight - 60;
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#ccc';
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
            // If user cancelled, don't download
            if ((error as any).name === 'AbortError') {
                return;
            }
            console.log('Share failed, attempting download fallback:', error);
            // Fall through to download for other errors
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
    toast.success('Image saved to device');
};
