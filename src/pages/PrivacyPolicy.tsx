import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Server, Mail, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrivacyPolicyProps {
    onOpenFeedback: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onOpenFeedback }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#e5e5e5] p-2 sm:p-4 font-sans text-[#444]">
            <div className="max-w-4xl mx-auto bg-white border-[2px] sm:border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 sm:p-8 min-h-[calc(100vh-2rem)]">

                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Privacy Policy</h1>
                </div>

                <div className="prose prose-stone max-w-none space-y-8">

                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                        <p className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-2">Last Updated</p>
                        <p className="font-bold">January 14, 2026</p>
                        <p className="mt-4 text-stone-600">
                            Your privacy is important to us. It is HabiCard's policy to respect your privacy regarding any information we may collect from you across our website, <span className="font-bold">habicard.com</span>, and other sites we own and operate.
                        </p>
                    </div>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Eye className="w-6 h-6 text-black" />
                            <h2 className="text-xl font-bold uppercase m-0">1. Information We Collect</h2>
                        </div>
                        <p>
                            We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-stone-600">
                            <li><strong>Account Information:</strong> If you sign up, we verify your email address via Supabase Authentication. We do not store passwords; they are handled securely by our authentication provider.</li>
                            <li><strong>Usage Data:</strong> We may store data associated with your habits, goals, and journal entries to provide the core functionality of the application.</li>
                            <li><strong>Local Storage:</strong> For guest users, data is stored locally on your device (LocalStorage) and is not transmitted to our servers unless you choose to create an account and sync.</li>
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Server className="w-6 h-6 text-black" />
                            <h2 className="text-xl font-bold uppercase m-0">2. How We Store Your Data</h2>
                        </div>
                        <p>
                            We adhere to industry-standard security practices to protect your data.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-stone-600">
                            <li><strong>Database:</strong> User data (for logged-in users) is stored in a secure Supabase PostgreSQL database with Row Level Security (RLS) policies enabled. This ensures that you can only access and modify your own data.</li>
                            <li><strong>Encryption:</strong> All data transmitted between your browser and our servers is encrypted using SSL/TLS (HTTPS).</li>
                            <li><strong>Retention:</strong> We only retain collected information for as long as necessary to provide you with your requested service.</li>
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-6 h-6 text-black" />
                            <h2 className="text-xl font-bold uppercase m-0">3. Third-Party Services</h2>
                        </div>
                        <p>
                            We may employ third-party companies and individuals due to the following reasons:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-stone-600">
                            <li>To facilitate our Service;</li>
                            <li>To provide the Service on our behalf;</li>
                            <li>To perform Service-related services; or</li>
                            <li>To assist us in analyzing how our Service is used.</li>
                        </ul>
                        <p className="mt-4">
                            We want to inform our Service users that these third parties have access to your Personal Information. The reason is to perform the tasks assigned to them on our behalf. However, they are obligated not to disclose or use the information for any other purpose.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="w-6 h-6 text-black" />
                            <h2 className="text-xl font-bold uppercase m-0">4. Your Rights</h2>
                        </div>
                        <p>
                            You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.
                        </p>
                        <p className="mt-2">
                            You have the right to request access to the data we hold about you, or to request that we delete your personal data. You can delete your account and all associated data at any time through the application settings or by contacting us.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Mail className="w-6 h-6 text-black" />
                            <h2 className="text-xl font-bold uppercase m-0">5. Contact Us</h2>
                        </div>
                        <p>
                            If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={onOpenFeedback}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold uppercase tracking-widest rounded-lg hover:opacity-80 transition-opacity"
                            >
                                <MessageSquare size={18} />
                                Bug or Suggestion
                            </button>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
