import React from 'react';

interface FormattedTextProps {
    text: string;
    highlightColor: string;
    className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, highlightColor, className = "" }) => {
    // Split text by [[...]] markers
    const parts = text.split(/(\[\[.*?\]\])/g);

    return (
        <span className={`text-black ${className}`}>
            {parts.map((part, i) => {
                if (part.startsWith('[[') && part.endsWith(']]')) {
                    const content = part.substring(2, part.length - 2);
                    return (
                        <span key={i} style={{ color: highlightColor }} className="font-black">
                            {content}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
};
