import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Server, Mail, MessageSquare, Trash2, Globe } from 'lucide-react';

interface PrivacyPolicyProps {
    onOpenFeedback: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onOpenFeedback }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#e5e5e5] p-2 sm:p-4 font-sans text-[#444]">
            <div className="max-w-4xl mx-auto bg-white border-[2px] sm:border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 sm:p-8 min-h-[calc(100vh-2rem)]">

                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                        aria-label="Back to HabiCard"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-stone-400">HabiCard</p>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Privacy Policy</h1>
                    </div>
                </div>

                <div className="space-y-8">

                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                        <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">Last Updated</p>
                        <p className="font-bold text-sm">May 21, 2026</p>
                        <p className="mt-4 text-stone-600 text-sm leading-relaxed">
                            HabiCard ("we", "us", or "our") operates habicard.com and the HabiCard Chrome extension. This Privacy Policy explains what information we collect, how we use it, and what rights you have regarding your personal data. By using HabiCard, you agree to this policy.
                        </p>
                    </div>

                    {/* Section 1 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Eye className="w-5 h-5 text-black flex-shrink-0" />
                            <h2 className="text-lg font-black uppercase tracking-tight">1. Information We Collect</h2>
                        </div>
                        <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
                            <div>
                                <p className="font-bold text-stone-800 mb-1">Account Information</p>
                                <p>When you create an account, we collect your email address. Passwords are never stored by HabiCard — authentication is handled by Supabase Auth, which stores a hashed credential. We do not collect your name, phone number, or any other identifying information unless you voluntarily provide it in a feedback message.</p>
                            </div>
                            <div>
                                <p className="font-bold text-stone-800 mb-1">Habit & Usage Data</p>
                                <p>When you use the app, we store the data you create: habit definitions (names, colors, schedules), daily completion records, journal entries, task lists, mood logs, and monthly goals. This data is stored in your account so it syncs across devices.</p>
                            </div>
                            <div>
                                <p className="font-bold text-stone-800 mb-1">Guest Mode</p>
                                <p>If you use HabiCard without signing in, all data is stored locally in your browser's localStorage. No data is sent to our servers in guest mode. If you later create an account, existing local data is not automatically migrated.</p>
                            </div>
                            <div>
                                <p className="font-bold text-stone-800 mb-1">Feedback & Support</p>
                                <p>If you submit a bug report or suggestion through the in-app feedback form, we store the message text and your account email (if signed in) so we can respond.</p>
                            </div>
                            <div>
                                <p className="font-bold text-stone-800 mb-1">What We Do Not Collect</p>
                                <p>We do not collect device identifiers, location data, browsing history, advertising IDs, or any data from other websites or apps. We do not run analytics trackers, ad networks, or session recording tools on HabiCard.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Server className="w-5 h-5 text-black flex-shrink-0" />
                            <h2 className="text-lg font-black uppercase tracking-tight">2. How We Store Your Data</h2>
                        </div>
                        <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
                            <div>
                                <p className="font-bold text-stone-800 mb-1">Database</p>
                                <p>Account data is stored in a PostgreSQL database hosted by Supabase (supabase.com). Row Level Security (RLS) policies are enforced on every table, meaning each user can only read and write their own records. Supabase infrastructure is hosted on AWS in the United States.</p>
                            </div>
                            <div>
                                <p className="font-bold text-stone-800 mb-1">Encryption</p>
                                <p>All data in transit between your device and our servers is encrypted via HTTPS (TLS 1.2+). Data at rest in the database is encrypted by Supabase's storage layer.</p>
                            </div>
                            <div>
                                <p className="font-bold text-stone-800 mb-1">Retention</p>
                                <p>Your data is retained for as long as your account is active. If you delete your account, all associated records (habits, completions, journal entries, notes, goals, feedback) are permanently deleted from our database within 30 days.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Globe className="w-5 h-5 text-black flex-shrink-0" />
                            <h2 className="text-lg font-black uppercase tracking-tight">3. Third-Party Services</h2>
                        </div>
                        <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
                            <p>HabiCard uses the following third-party services. Each has its own privacy policy governing how it handles data.</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border border-stone-200 rounded-lg overflow-hidden">
                                    <thead className="bg-stone-100">
                                        <tr>
                                            <th className="text-left p-3 font-black uppercase tracking-wide text-stone-600">Service</th>
                                            <th className="text-left p-3 font-black uppercase tracking-wide text-stone-600">Purpose</th>
                                            <th className="text-left p-3 font-black uppercase tracking-wide text-stone-600">Data Shared</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        <tr>
                                            <td className="p-3 font-bold">Supabase</td>
                                            <td className="p-3">Database & authentication</td>
                                            <td className="p-3">Email, habit data, journal entries</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-bold">Google Gemini API</td>
                                            <td className="p-3">Optional AI story generation</td>
                                            <td className="p-3">Anonymized habit completion stats (no PII)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p>We do not sell, trade, or rent your personal information to any third party. We do not share your data with advertisers.</p>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-black flex-shrink-0" />
                            <h2 className="text-lg font-black uppercase tracking-tight">4. Chrome Extension</h2>
                        </div>
                        <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                            <p>The HabiCard Chrome extension uses the following browser permissions:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong className="text-stone-800">storage</strong> — to save your session and preferences locally in the browser</li>
                                <li><strong className="text-stone-800">tabs</strong> — to open habicard.com in a new tab when you click "Open full app"</li>
                            </ul>
                            <p>The extension does not read the content of any webpage you visit. It does not inject scripts into third-party websites except habicard.com and localhost (for session syncing). All habit data in the extension is either stored locally or synced to the same Supabase account described above.</p>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Lock className="w-5 h-5 text-black flex-shrink-0" />
                            <h2 className="text-lg font-black uppercase tracking-tight">5. Your Rights</h2>
                        </div>
                        <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                            <p>You have the following rights regarding your personal data:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-stone-800">Access:</strong> You can view all data stored in your account within the app.</li>
                                <li><strong className="text-stone-800">Correction:</strong> You can edit your habit names, journal entries, and other content at any time.</li>
                                <li><strong className="text-stone-800">Deletion:</strong> You can delete individual records at any time. To delete your entire account and all data, go to Settings → Delete Account, or contact us.</li>
                                <li><strong className="text-stone-800">Portability:</strong> You can export your journal entries from within the app at any time.</li>
                                <li><strong className="text-stone-800">Opt out:</strong> You can use HabiCard in guest mode without creating an account, keeping all data on your device only.</li>
                            </ul>
                            <p>If you are in the European Economic Area (EEA), you also have rights under GDPR including the right to lodge a complaint with a supervisory authority.</p>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Trash2 className="w-5 h-5 text-black flex-shrink-0" />
                            <h2 className="text-lg font-black uppercase tracking-tight">6. Data Deletion</h2>
                        </div>
                        <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                            <p>To request deletion of your account and all personal data:</p>
                            <ol className="list-decimal pl-5 space-y-1">
                                <li>Sign in to HabiCard</li>
                                <li>Open Settings (gear icon)</li>
                                <li>Scroll to the bottom and tap <strong className="text-stone-800">Delete Account</strong></li>
                            </ol>
                            <p>Alternatively, email us at <a href="mailto:support@habicard.com" className="font-bold underline text-black">support@habicard.com</a> with the subject "Delete my account" and we will process your request within 30 days.</p>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Mail className="w-5 h-5 text-black flex-shrink-0" />
                            <h2 className="text-lg font-black uppercase tracking-tight">7. Contact Us</h2>
                        </div>
                        <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                            <p>If you have questions, concerns, or requests regarding this Privacy Policy, contact us at:</p>
                            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                                <p className="font-black text-stone-800">HabiCard</p>
                                <p>Email: <a href="mailto:support@habicard.com" className="font-bold underline text-black">support@habicard.com</a></p>
                                <p>Website: <a href="https://habicard.com" className="font-bold underline text-black">habicard.com</a></p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={onOpenFeedback}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:opacity-80 transition-opacity"
                                >
                                    <MessageSquare size={16} />
                                    Send Feedback
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Changes notice */}
                    <section className="border-t border-stone-200 pt-6">
                        <p className="text-xs text-stone-400 leading-relaxed">
                            We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page. Continued use of HabiCard after any changes constitutes acceptance of the updated policy. We will not reduce your rights under this policy without explicit notice.
                        </p>
                    </section>

                </div>

                {/* Footer nav */}
                <div className="mt-10 pt-6 border-t-2 border-black flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:underline"
                    >
                        <ArrowLeft size={16} />
                        Back to HabiCard
                    </button>
                    <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">© 2026 HabiCard</span>
                </div>

            </div>
        </div>
    );
};
