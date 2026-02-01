'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    MessageCircle,
    Mail,
    Book,
    ExternalLink,
    Send,
    Loader2,
    Check,
    HelpCircle,
    FileText,
    Headphones
} from 'lucide-react'

export default function SupportPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [sent, setSent] = useState(false)

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner-lg" />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        router.push('/login')
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsSending(false)
        setSent(true)
        setSubject('')
        setMessage('')
        setTimeout(() => setSent(false), 5000)
    }

    const supportOptions = [
        {
            icon: MessageCircle,
            title: 'Discord Community',
            desc: 'Join our Discord for instant help',
            action: 'Join Discord',
            href: 'https://discord.gg/dragohost',
            color: 'from-indigo-500 to-purple-500'
        },
        {
            icon: Mail,
            title: 'Email Support',
            desc: 'Get help via email within 24h',
            action: 'support@dragohost.cloud',
            href: 'mailto:support@dragohost.cloud',
            color: 'from-cyan-500 to-blue-500'
        },
        {
            icon: Book,
            title: 'Documentation',
            desc: 'Browse our knowledge base',
            action: 'View Docs',
            href: '#',
            color: 'from-emerald-500 to-teal-500'
        }
    ]

    const faqs = [
        {
            q: 'How do I start my server?',
            a: 'Navigate to your server dashboard and click the "Start" button in the console tab.'
        },
        {
            q: 'How do I install plugins?',
            a: 'Go to the Plugins tab in your server dashboard and search for plugins to install.'
        },
        {
            q: 'How do I upgrade my plan?',
            a: 'Visit the Billing page and select a new plan to upgrade your server resources.'
        },
        {
            q: 'My server is offline, what do I do?',
            a: 'Try restarting your server. If the issue persists, check the console for errors or contact support.'
        }
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Support</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Get help with your servers and account
                </p>
            </div>

            {/* Support Options */}
            <div className="grid md:grid-cols-3 gap-4">
                {supportOptions.map((option, index) => (
                    <motion.a
                        key={index}
                        href={option.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors group"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${option.color} flex items-center justify-center mb-4`}>
                            <option.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold mb-1">{option.title}</h3>
                        <p className="text-sm text-gray-400 mb-3">{option.desc}</p>
                        <div className="flex items-center gap-1 text-cyan-400 text-sm font-medium">
                            {option.action}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </motion.a>
                ))}
            </div>

            {/* Contact Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Submit a Ticket</h2>
                        <p className="text-sm text-gray-400">We&apos;ll respond within 24 hours</p>
                    </div>
                </div>

                {sent ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <Check className="w-5 h-5 text-emerald-400" />
                        <p className="text-emerald-400">Your message has been sent! We&apos;ll get back to you soon.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Brief description of your issue"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe your issue in detail..."
                                required
                                rows={5}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSending}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {isSending ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </motion.div>

            {/* FAQ Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Frequently Asked Questions</h2>
                        <p className="text-sm text-gray-400">Quick answers to common questions</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                            <h3 className="font-medium mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-cyan-400" />
                                {faq.q}
                            </h3>
                            <p className="text-sm text-gray-400 pl-6">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
