import React, { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';

interface QuoteData {
    quote: string;
    author: string;
}

export const DailyQuote: React.FC = () => {
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);

    const MOTIVATIONAL_QUOTES = [
        { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
        { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
        { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
        { quote: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
        { quote: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
        { quote: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", author: "Christian D. Larson" },
        { quote: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
        { quote: "Act as if what you do makes a difference. It does.", author: "William James" },
        { quote: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
        { quote: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
        { quote: "Dream big and dare to fail.", author: "Norman Vaughan" },
        { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
        { quote: "Go the extra mile. It's never crowded there.", author: "Dr. Wayne D. Dyer" },
        { quote: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
        { quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
        { quote: "Do something today that your future self will thank you for.", author: "Unknown" },
        { quote: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb" },
        { quote: "Don't wait for opportunity. Create it.", author: "Unknown" },
        { quote: "Great things never came from comfort zones.", author: "Neil Strauss" },
        { quote: "Discipline is doing what needs to be done, even if you don't want to do it.", author: "Unknown" },
        { quote: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" }
    ];

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                // Check local storage first
                const today = new Date().toDateString();
                const cached = localStorage.getItem('daily_quote');

                if (cached) {
                    const { date, data } = JSON.parse(cached);
                    // Also verify the cached quote is valid/exists to avoid old format errors if any
                    if (date === today && data && data.quote) {
                        setQuoteData(data);
                        setLoading(false);
                        return;
                    }
                }

                // Pick a new random motivational quote
                const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
                const newQuote = MOTIVATIONAL_QUOTES[randomIndex];

                setQuoteData(newQuote);
                localStorage.setItem('daily_quote', JSON.stringify({ date: today, data: newQuote }));
            } catch (error) {
                console.error('Error setting quote:', error);
                setQuoteData(MOTIVATIONAL_QUOTES[0]);
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();
    }, []);

    if (loading) return <div className="h-12 animate-pulse bg-stone-100 rounded-sm w-full mt-2" />;

    if (!quoteData) return null;

    return (
        <div className="mt-2 border-t border-stone-200 pt-2 px-1">
            <div className="flex gap-2">
                <Quote size={12} className="text-stone-400 flex-shrink-0 mt-0.5 fill-current" />
                <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-medium text-stone-600 leading-tight italic">
                        "{quoteData.quote}" <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider not-italic">— {quoteData.author}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
