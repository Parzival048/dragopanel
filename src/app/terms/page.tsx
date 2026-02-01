'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Shield, AlertTriangle, Ban, Scale } from 'lucide-react'

export default function TermsPage() {
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
                            <FileText className="w-7 h-7 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Terms of Service</h1>
                            <p className="text-gray-400">Last updated: February 1, 2026</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="card-elevated p-8 space-y-8">
                        {/* Acceptance */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">1. Acceptance of Terms</h2>
                            <p className="text-gray-300 leading-relaxed">
                                By accessing or using Dragohost services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Services. These Terms apply to all users, including visitors, registered users, and paying customers.
                            </p>
                        </section>

                        {/* Services */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">2. Description of Services</h2>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                Dragohost provides Minecraft game server hosting services, including but not limited to:
                            </p>
                            <ul className="text-gray-300 space-y-2 ml-4">
                                <li>• Virtual private server allocation for Minecraft</li>
                                <li>• Server management dashboard and console access</li>
                                <li>• Automated backups and file management</li>
                                <li>• DDoS protection and network security</li>
                                <li>• Customer support via Discord and email</li>
                            </ul>
                        </section>

                        {/* User Obligations */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">3. User Obligations</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
                                <Shield className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <div className="text-gray-300 text-sm">
                                    <p className="mb-2">As a user of our Services, you agree to:</p>
                                    <ul className="space-y-1">
                                        <li>• Provide accurate account information</li>
                                        <li>• Maintain the security of your account credentials</li>
                                        <li>• Use the Services in compliance with all applicable laws</li>
                                        <li>• Not share account access with unauthorized parties</li>
                                        <li>• Report any security vulnerabilities responsibly</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Prohibited Activities */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">4. Prohibited Activities</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                <Ban className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="text-gray-300 text-sm">
                                    <p className="mb-2 text-red-400 font-medium">The following activities are strictly prohibited:</p>
                                    <ul className="space-y-1">
                                        <li>• Hosting illegal content or pirated software</li>
                                        <li>• Launching DDoS attacks or network abuse</li>
                                        <li>• Cryptocurrency mining without authorization</li>
                                        <li>• Distributing malware or harmful software</li>
                                        <li>• Harassment or abuse of other users</li>
                                        <li>• Reselling services without written permission</li>
                                        <li>• Attempting to bypass resource limits</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Payment Terms */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">5. Payment Terms</h2>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                All payments are processed securely through Cashfree payment gateway. By making a purchase, you agree to:
                            </p>
                            <ul className="text-gray-300 space-y-2 ml-4 text-sm">
                                <li>• Pay all fees associated with your selected plan</li>
                                <li>• Prices are in Indian Rupees (INR) unless otherwise stated</li>
                                <li>• Services are prepaid and non-refundable except as stated in our Refund Policy</li>
                                <li>• Failed payments may result in service suspension</li>
                            </ul>
                        </section>

                        {/* Termination */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">6. Termination</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm">
                                    We reserve the right to suspend or terminate your account immediately, without prior notice, if you violate these Terms. Upon termination, your right to use the Services ceases immediately. Data may be deleted after 7 days of account termination.
                                </p>
                            </div>
                        </section>

                        {/* Limitation of Liability */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">7. Limitation of Liability</h2>
                            <p className="text-gray-300 leading-relaxed text-sm">
                                To the maximum extent permitted by law, Dragohost shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Services. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
                            </p>
                        </section>

                        {/* Governing Law */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">8. Governing Law</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                                <Scale className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm">
                                    These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Maharashtra, India.
                                </p>
                            </div>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">9. Contact Information</h2>
                            <p className="text-gray-300 text-sm">
                                For questions about these Terms, please contact us at{' '}
                                <a href="mailto:legal@dragohost.cloud" className="text-cyan-400 hover:text-cyan-300">
                                    legal@dragohost.cloud
                                </a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
