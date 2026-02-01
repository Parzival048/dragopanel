'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Zap,
    LayoutDashboard,
    Server,
    Plus,
    CreditCard,
    Settings,
    HelpCircle,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User,
    Bell,
    Menu
} from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Servers', href: '/dashboard/servers', icon: Server },
        { name: 'Create Server', href: '/dashboard/create', icon: Plus },
        { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
    ]

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    return (
        <div className="min-h-screen bg-[#030712] flex">
            {/* Background mesh */}
            <div className="fixed inset-0 mesh-bg opacity-30 pointer-events-none" />

            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0a0f1a]/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'
                    } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo */}
                <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-5'} border-b border-white/5`}>
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        {!isSidebarCollapsed && (
                            <span className="text-xl font-bold gradient-text">Dragohost</span>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 overflow-y-auto">
                    <ul className="space-y-1.5 px-3">
                        {navigation.map((item) => (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.href)
                                        ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                                >
                                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? 'text-cyan-400' : ''}`} />
                                    {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Section */}
                <div className={`border-t border-white/5 p-4 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                    {!isSidebarCollapsed ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{session?.user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Collapse Toggle (Desktop) */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden lg:flex absolute -right-3.5 top-24 w-7 h-7 rounded-full bg-[#1a2332] border border-white/10 items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/50 transition-all shadow-lg"
                >
                    {isSidebarCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen relative">
                {/* Top Bar */}
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-5 lg:px-8 bg-[#030712]/80 backdrop-blur-xl sticky top-0 z-30">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="lg:hidden p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Spacer */}
                    <div className="hidden lg:block" />

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" />
                        </button>

                        {/* User Menu */}
                        <Link
                            href="/dashboard/settings"
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-5 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
