'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Zap,
    Menu,
    X,
    ChevronRight,
    Sparkles,
    Shield,
    Clock,
    Server,
    Cpu,
    HardDrive,
    Headphones,
    Globe,
    Check,
    Star,
    MessageCircle
} from 'lucide-react'

// Common Components
const SectionHeader = ({ label, title, subtitle }: { label: string, title: string, subtitle?: string }) => (
    <div className="text-center mb-16 px-4">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {label}
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                    {subtitle}
                </p>
            )}
        </motion.div>
    </div>
)

// Navbar Component
export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled
            ? 'bg-bg-primary/90 backdrop-blur-xl border-b border-white/5 py-3'
            : 'bg-transparent py-6'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-300">Dragohost</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-10">
                        <Link href="#features" className="text-gray-400 hover:text-white transition-colors font-medium">Features</Link>
                        <Link href="#pricing" className="text-gray-400 hover:text-white transition-colors font-medium">Pricing</Link>
                        <Link href="#contact" className="text-gray-400 hover:text-white transition-colors font-medium">Contact</Link>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/login" className="text-gray-400 hover:text-white transition-colors font-medium">
                            Client Area
                        </Link>
                        <Link href="/register" className="px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5">
                            Get Started
                        </Link>
                    </div>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
                        {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-bg-secondary/98 backdrop-blur-2xl border-t border-white/5"
                    >
                        <div className="px-6 py-8 space-y-6">
                            <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block text-xl text-gray-300 hover:text-white font-medium">Features</Link>
                            <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block text-xl text-gray-300 hover:text-white font-medium">Pricing</Link>
                            <Link href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-xl text-gray-300 hover:text-white font-medium">Contact</Link>
                            <div className="pt-6 border-t border-white/10 space-y-4">
                                <Link href="/login" className="block text-center py-4 text-xl text-gray-300 font-medium">Login</Link>
                                <Link href="/register" className="block text-center py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl">Get Started</Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

// Hero Section
export function Hero() {
    return (
        <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-32 pb-20 bg-bg-primary">
            {/* Optimized Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15)_0%,transparent_50%)]" />
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full" />
                <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-10 shadow-glow shadow-cyan-500/5"
                    >
                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                        <span className="text-sm font-semibold tracking-wide text-cyan-100 uppercase">All systems operational</span>
                    </motion.div>

                    <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-[1] tracking-tighter text-white">
                        The Future of
                        <br />
                        <span className="gradient-text text-glow">Minecraft Hosting</span>
                    </h1>

                    <p className="text-lg sm:text-2xl text-gray-400 max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
                        Enterprise-grade infrastructure, lightning-fast NVMe storage, and
                        24/7 expert support. Your community deserve the best.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95">
                            <span>Deploy Server Now</span>
                            <ChevronRight className="w-6 h-6" />
                        </Link>
                        <Link href="#pricing" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md">
                            View Pricing
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mt-28 max-w-4xl mx-auto w-full">
                        {[
                            { value: '99.9%', label: 'Uptime SLA', icon: Clock },
                            { value: '24/7', label: 'Discord Support', icon: MessageCircle },
                            { value: 'Instant', label: 'Provisioning', icon: Zap }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all duration-300"
                            >
                                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-none">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

// Features Section
export function Features() {
    const features = [
        { icon: Zap, title: 'Instant Setup', description: 'Your server is ready the second your payment is processed. No waiting.', color: 'from-cyan-500 to-blue-500' },
        { icon: Shield, title: 'DDoS Shield', description: 'Enterprise-grade 12Tbps mitigation to keep your community safe.', color: 'from-blue-500 to-indigo-500' },
        { icon: Clock, title: 'Perfect Uptime', description: 'Redundant network and power ensures 99.9% availability.', color: 'from-indigo-500 to-purple-500' },
        { icon: Cpu, title: 'Ryzen Power', description: 'Latest generation AMD Ryzen CPUs for extreme single-core speed.', color: 'from-purple-500 to-pink-500' },
        { icon: HardDrive, title: 'NVMe Storage', description: 'PCIe 4.0 NVMe SSDs for lightning fast world loading and saving.', color: 'from-pink-500 to-rose-500' },
        { icon: Server, title: 'Dedicated RAM', description: 'No overselling. You get every megabyte of RAM you pay for.', color: 'from-rose-500 to-orange-500' },
        { icon: Globe, title: 'Multi-Location', description: 'Data centers in Europe, US, and Asia for low latency worldwide.', color: 'from-orange-500 to-yellow-500' },
        { icon: Headphones, title: 'Pro Support', description: 'Expert Minecraft admins available 24/7 on Discord.', color: 'from-yellow-500 to-cyan-500' }
    ]

    return (
        <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 relative bg-bg-primary overflow-hidden">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-cyan-900/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="max-w-7xl mx-auto relative z-10">
                <SectionHeader
                    label="Powerful Features"
                    title="Engineered for Performance"
                    subtitle="Everything you need to host a successful community, all included in every plan."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:border-cyan-500/30 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-black/50 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                                <feature.icon className="w-8 h-8 text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed relative z-10">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Pricing Section
export function Pricing() {
    const plans = [
        { name: 'Starter', price: 149, icon: Zap, desc: 'Small survival worlds', features: ['2 GB RAM', '10 GB NVMe', '2 Databases', '3 Backups', '3 Allocations', 'DDoS Protection'] },
        { name: 'Standard', price: 299, icon: Star, desc: 'Growing communities', features: ['4 GB RAM', '25 GB NVMe', '5 Databases', '5 Backups', '5 Allocations', 'DDoS Protection', 'Priority Support'], popular: true },
        { name: 'Premium', price: 499, icon: Shield, desc: 'Serious networks', features: ['8 GB RAM', '50 GB NVMe', '10 Databases', '10 Backups', '8 Allocations', 'Custom Domain', 'Dedicated IP'] },
        { name: 'Enterprise', price: 999, icon: Server, desc: 'Maximum performance', features: ['16 GB RAM', '100 GB NVMe', 'Unlimited DBs', 'Unlimited Backups', 'Unl. Allocations', 'Dedicated Node', 'VIP Support'] }
    ]

    return (
        <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 relative bg-[#010206] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05)_0%,transparent_70%)]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <SectionHeader
                    label="Pricing Plans"
                    title="Fair and Simple Pricing"
                    subtitle="Premium hosting doesn't have to break the bank. Choose the plan that fits your needs."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex flex-col p-8 rounded-[2rem] transition-all duration-500 hover:-translate-y-3 ${plan.popular
                                ? 'bg-gradient-to-b from-[#0d1c2a] to-bg-primary border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.15)] scale-105 z-20'
                                : 'bg-white/[0.03] border border-white/[0.08] hover:border-white/20 z-10'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-xl">
                                    Best Seller
                                </div>
                            )}

                            <div className="mb-8">
                                <plan.icon className={`w-10 h-10 mb-5 ${plan.popular ? 'text-cyan-400' : 'text-gray-500'}`} />
                                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-500 text-sm font-medium">{plan.desc}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-white">₹{plan.price}</span>
                                    <span className="text-gray-500 font-bold uppercase text-xs tracking-tighter">/month</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10 flex-1">
                                {plan.features.map((f) => (
                                    <div key={f} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.popular ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-500'}`}>
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/register"
                                className={`w-full py-4 px-6 rounded-2xl font-black transition-all duration-300 text-center ${plan.popular
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20'
                                    : 'bg-white/5 text-white hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                Select Plan
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Contact Section
export function Contact() {
    return (
        <section id="contact" className="py-32 px-4 sm:px-6 lg:px-8 relative bg-bg-primary">
            <div className="absolute bottom-0 left-0 w-full h-[50%] bg-[radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.1)_0%,transparent_70%)]" />

            <div className="max-w-4xl mx-auto relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-12 md:p-20 rounded-[3rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-3xl overflow-hidden relative"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-cyan-500/20 blur-[80px] rounded-full -translate-y-1/2" />

                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#5865F2] to-[#3a44a7] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-[#5865F2]/20 rotate-3">
                        <MessageCircle className="w-12 h-12 text-white -rotate-3" />
                    </div>

                    <h2 className="text-4xl sm:text-6xl font-black text-white mb-6">
                        Need Expert Advice?
                    </h2>
                    <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12 font-medium">
                        Our team of experts is ready to help you choose the right plan for your community.
                        Join our Discord for instant assistance.
                    </p>

                    <a
                        href={process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/dragohost'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-4 px-12 py-5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-xl rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-[#5865F2]/30"
                    >
                        <MessageCircle className="w-7 h-7" />
                        Join Our Discord
                    </a>
                </motion.div>
            </div>
        </section>
    )
}

// Footer Component
export function Footer() {
    return (
        <footer className="bg-bg-primary border-t border-white/5 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
                <div className="max-w-sm">
                    <Link href="/" className="flex items-center gap-3 mb-8 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-black text-white">Dragohost</span>
                    </Link>
                    <p className="text-gray-500 text-lg leading-relaxed font-medium">
                        Next-generation Minecraft hosting provider dedicated to performance,
                        reliability, and premium support.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-20">
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Explore</h4>
                        <ul className="space-y-4">
                            <li><Link href="#features" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Features</Link></li>
                            <li><Link href="#pricing" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Pricing</Link></li>
                            <li><Link href="#contact" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link href="/login" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Panel</Link></li>
                            <li><Link href="/register" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Sign Up</Link></li>
                            <li><a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Status</a></li>
                        </ul>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="/terms" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Terms of Service</Link></li>
                            <li><Link href="/privacy-policy" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Privacy Policy</Link></li>
                            <li><Link href="/refund-policy" className="text-gray-500 hover:text-cyan-400 transition-colors font-medium">Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-gray-600 font-medium">
                    © {new Date().getFullYear()} Dragohost. Powered by Enterprise Hardware.
                </p>
                <div className="flex items-center gap-6">
                    <a href="#" className="text-gray-600 hover:text-white transition-all"><Globe className="w-5 h-5" /></a>
                    <a href="#" className="text-gray-600 hover:text-white transition-all"><Zap className="w-5 h-5" /></a>
                </div>
            </div>
        </footer>
    )
}
