'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Database, Eye, Share2, Cookie, UserCheck } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
                            <Lock className="w-7 h-7 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Privacy Policy</h1>
                            <p className="text-gray-400">Last updated: February 1, 2026</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="card-elevated p-8 space-y-8">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">1. Introduction</h2>
                            <p className="text-gray-300 leading-relaxed">
                                Dragohost ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Minecraft hosting services and website.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">2. Information We Collect</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                                    <Database className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-medium mb-2">Personal Information</h3>
                                        <ul className="text-gray-300 text-sm space-y-1">
                                            <li>• Name and email address (for account creation)</li>
                                            <li>• Payment information (processed securely via Cashfree)</li>
                                            <li>• IP address and device information</li>
                                            <li>• Server usage data and logs</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                                    <Eye className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-medium mb-2">Automatically Collected Information</h3>
                                        <ul className="text-gray-300 text-sm space-y-1">
                                            <li>• Browser type and version</li>
                                            <li>• Operating system</li>
                                            <li>• Pages visited and time spent</li>
                                            <li>• Referring website addresses</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* How We Use Information */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">3. How We Use Your Information</h2>
                            <ul className="text-gray-300 space-y-2 ml-4 text-sm">
                                <li>• To provide and maintain our hosting services</li>
                                <li>• To process payments and manage subscriptions</li>
                                <li>• To send service-related communications</li>
                                <li>• To provide customer support</li>
                                <li>• To detect and prevent fraud or abuse</li>
                                <li>• To improve our services and user experience</li>
                                <li>• To comply with legal obligations</li>
                            </ul>
                        </section>

                        {/* Information Sharing */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">4. Information Sharing</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                <Share2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <div className="text-gray-300 text-sm">
                                    <p className="mb-2">We may share your information with:</p>
                                    <ul className="space-y-1">
                                        <li>• <strong>Payment Processors:</strong> Cashfree for secure payment processing</li>
                                        <li>• <strong>Service Providers:</strong> Cloud infrastructure and hosting partners</li>
                                        <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                                    </ul>
                                    <p className="mt-3 text-cyan-400 font-medium">We never sell your personal data to third parties.</p>
                                </div>
                            </div>
                        </section>

                        {/* Cookies */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">5. Cookies and Tracking</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                                <Cookie className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm">
                                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, and remember your preferences. You can control cookie settings through your browser, but disabling cookies may affect functionality.
                                </p>
                            </div>
                        </section>

                        {/* Data Security */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">6. Data Security</h2>
                            <p className="text-gray-300 leading-relaxed text-sm">
                                We implement industry-standard security measures including encryption (SSL/TLS), secure data centers, regular security audits, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        {/* Your Rights */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">7. Your Rights</h2>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                <UserCheck className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="text-gray-300 text-sm">
                                    <p className="mb-2">You have the right to:</p>
                                    <ul className="space-y-1">
                                        <li>• Access your personal data</li>
                                        <li>• Correct inaccurate information</li>
                                        <li>• Request deletion of your data</li>
                                        <li>• Object to data processing</li>
                                        <li>• Export your data in a portable format</li>
                                    </ul>
                                    <p className="mt-2">Contact us at privacy@dragohost.cloud to exercise these rights.</p>
                                </div>
                            </div>
                        </section>

                        {/* Data Retention */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">8. Data Retention</h2>
                            <p className="text-gray-300 leading-relaxed text-sm">
                                We retain your personal information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for up to 90 days for backup purposes and as required by law.
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">9. Children's Privacy</h2>
                            <p className="text-gray-300 leading-relaxed text-sm">
                                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                            </p>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">10. Contact Us</h2>
                            <p className="text-gray-300 text-sm">
                                For questions about this Privacy Policy, please contact us at{' '}
                                <a href="mailto:privacy@dragohost.cloud" className="text-cyan-400 hover:text-cyan-300">
                                    privacy@dragohost.cloud
                                </a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
