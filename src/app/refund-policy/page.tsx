'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCcw, Mail, Clock, AlertCircle, CheckCircle } from 'lucide-react'

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-[#030712]">
            {/* Background */}
            <div className="absolute inset-0 mesh-bg opacity-40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
                            <RefreshCcw className="w-7 h-7 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Refund Policy</h1>
                            <p className="text-gray-400">Last updated: February 1, 2026</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="card-elevated p-8 space-y-8">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">1. Introduction</h2>
                            <p className="text-gray-300 leading-relaxed">
                                At Dragohost, we strive to provide the best Minecraft hosting experience. We understand that sometimes things don't work out as expected. This Refund Policy outlines the terms and conditions under which refunds may be issued for our services.
                            </p>
                        </section>

                        {/* Eligibility */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">2. Refund Eligibility</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-medium text-green-400">Eligible for Refund</h3>
                                        <ul className="text-gray-300 mt-2 space-y-1 text-sm">
                                            <li>• Service not delivered within 24 hours of payment</li>
                                            <li>• Technical issues preventing server access for more than 48 hours</li>
                                            <li>• Duplicate payments or billing errors</li>
                                            <li>• Cancellation within 48 hours of first purchase (new customers only)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-medium text-red-400">Not Eligible for Refund</h3>
                                        <ul className="text-gray-300 mt-2 space-y-1 text-sm">
                                            <li>• Change of mind after 48 hours of purchase</li>
                                            <li>• Violation of our Terms of Service leading to suspension</li>
                                            <li>• Partial month usage (no pro-rata refunds)</li>
                                            <li>• Third-party issues (Minecraft updates, plugins, etc.)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Process */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">3. Refund Process</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold flex-shrink-0">1</div>
                                    <div>
                                        <h3 className="font-medium">Submit a Request</h3>
                                        <p className="text-gray-400 text-sm">Contact our support team via email with your order ID and reason for refund.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold flex-shrink-0">2</div>
                                    <div>
                                        <h3 className="font-medium">Review Period</h3>
                                        <p className="text-gray-400 text-sm">Our team will review your request within 2-3 business days.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold flex-shrink-0">3</div>
                                    <div>
                                        <h3 className="font-medium">Processing</h3>
                                        <p className="text-gray-400 text-sm">Approved refunds are processed within 5-7 business days to the original payment method.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Timeline */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">4. Refund Timeline</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                                <Clock className="w-5 h-5 text-cyan-400 mt-0.5" />
                                <p className="text-gray-300 text-sm">
                                    Refunds are typically processed within <strong>5-7 business days</strong>. Depending on your bank or payment provider, it may take an additional 3-5 business days for the amount to reflect in your account.
                                </p>
                            </div>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">5. Contact Us</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                <Mail className="w-5 h-5 text-cyan-400 mt-0.5" />
                                <div>
                                    <p className="text-gray-300 text-sm">
                                        For refund requests or questions about this policy, please contact us at:
                                    </p>
                                    <a href="mailto:support@dragohost.cloud" className="text-cyan-400 hover:text-cyan-300 font-medium">
                                        support@dragohost.cloud
                                    </a>
                                </div>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
