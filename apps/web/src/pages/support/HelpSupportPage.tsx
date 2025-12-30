import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlowButton } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { useAuth } from '../../contexts/AuthContext';

const faqs = [
    {
        category: 'Getting Started',
        questions: [
            {
                q: 'How do I apply for a project?',
                a: 'Navigate to the Application page from the sidebar. You can choose to work solo or form a group, then select up to 3 projects you\'re interested in.'
            },
            {
                q: 'How do I form a group?',
                a: 'On the Application page, select "Work in a Group", then either generate a group code to share with others or enter a code to join an existing group.'
            },
            {
                q: 'What are the different project types?',
                a: 'IDP (Interdisciplinary Project), UROP (Undergraduate Research Opportunity Program), and CAPSTONE are the three project categories available.'
            }
        ]
    },
    {
        category: 'Submissions',
        questions: [
            {
                q: 'When can I submit my work?',
                a: 'You can submit work during open submission windows. Check the Submission page for current window status and deadlines.'
            },
            {
                q: 'What files do I need to submit?',
                a: 'You need to provide a GitHub link and upload a report PDF. For external evaluations, a presentation file is also required.'
            },
            {
                q: 'Can I edit my submission after submitting?',
                a: 'No, submissions are frozen once completed. Contact your coordinator if you need to make changes.'
            }
        ]
    },
    {
        category: 'Grades & Assessment',
        questions: [
            {
                q: 'When will I see my grades?',
                a: 'Grades are visible only after your coordinator publishes them. You\'ll receive a notification when grades are released.'
            },
            {
                q: 'How do I join assessment meetings?',
                a: 'You can schedule meetings with your faculty mentor from the Meetings page. For group projects, only the group leader can schedule meetings. Once scheduled, a Google Meet button will appear for online meetings.'
            }
        ]
    }
];

export function HelpSupportPage() {
    const { user } = useAuth();
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);

    const handleSubmitContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSending(false);
        alert('Your message has been sent! We\'ll get back to you soon.');
        setContactForm({ subject: '', message: '' });
    };

    return (
        <div className="min-h-screen p-8">
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="max-w-6xl mx-auto space-y-6"
            >
                {/* Header */}
                <motion.div variants={fadeUp}>
                    <h1 className="text-3xl font-bold text-text mb-2">
                        Help & Support
                    </h1>
                    <p className="text-textSecondary">
                        Find answers to common questions or contact support
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Links */}
                    <motion.div variants={staggerItem} className="lg:col-span-1">
                        <GlassCard variant="elevated" className="p-6">
                            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Quick Links
                            </h2>
                            <div className="space-y-2">
                                <a
                                    href="https://srmap.edu.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <span className="text-sm text-text">University Website</span>
                                    </div>
                                </a>
                                <a
                                    href="mailto:support@srmap.edu.in"
                                    className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm text-text">Email Support</span>
                                    </div>
                                </a>
                                <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <span className="text-sm text-text">User Guide</span>
                                    </div>
                                </button>
                            </div>

                            {/* Contact Info */}
                            <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                                <h3 className="text-sm font-semibold text-text mb-2">Support Hours</h3>
                                <p className="text-xs text-textSecondary">
                                    Monday - Friday<br />
                                    9:00 AM - 5:00 PM IST
                                </p>
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* FAQs */}
                    <motion.div variants={staggerItem} className="lg:col-span-2">
                        <GlassCard variant="elevated" className="p-6">
                            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Frequently Asked Questions
                            </h2>

                            <div className="space-y-4">
                                {faqs.map((category, catIdx) => (
                                    <div key={catIdx}>
                                        <h3 className="text-md font-semibold text-primary mb-2">{category.category}</h3>
                                        <div className="space-y-2">
                                            {category.questions.map((faq, faqIdx) => {
                                                const faqId = `${catIdx}-${faqIdx}`;
                                                const isExpanded = expandedFaq === faqId;

                                                return (
                                                    <div key={faqIdx} className="bg-white/5 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                                                            className="w-full text-left p-4 hover:bg-white/5 transition-colors flex items-center justify-between"
                                                        >
                                                            <span className="text-sm font-medium text-text">{faq.q}</span>
                                                            <svg
                                                                className={`w-5 h-5 text-textSecondary transition-transform ${isExpanded ? 'rotate-180' : ''
                                                                    }`}
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {isExpanded && (
                                                            <div className="px-4 pb-4">
                                                                <p className="text-sm text-textSecondary">{faq.a}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* Contact Form */}
                <motion.div variants={staggerItem}>
                    <GlassCard variant="elevated" className="p-6">
                        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Contact Support
                        </h2>

                        <form onSubmit={handleSubmitContact} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Brief description of your issue"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Message
                                </label>
                                <textarea
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Describe your issue in detail..."
                                    required
                                />
                            </div>

                            <GlowButton
                                type="submit"
                                loading={sending}
                                variant="primary"
                                glow
                                className="w-full"
                            >
                                {sending ? 'Sending...' : 'Send Message'}
                            </GlowButton>
                        </form>
                    </GlassCard>
                </motion.div>
            </motion.div>
        </div>
    );
}
