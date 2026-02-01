'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Server,
    Plus,
    Activity,
    Cpu,
    HardDrive,
    Wifi,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ChevronRight,
    Play,
    Square,
    RotateCw,
    Sparkles
} from 'lucide-react'

interface ServerData {
    id: string
    name: string
    identifier: string
    status: 'RUNNING' | 'STOPPED' | 'INSTALLING' | 'SUSPENDED'
    plan: {
        name: string
        memory: number
        disk: number
        cpu: number
    }
    resources?: {
        cpu: number
        memory: number
        disk: number
        uptime: number
    }
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [servers, setServers] = useState<ServerData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        async function fetchServers() {
            try {
                const response = await fetch('/api/servers')
                if (response.ok) {
                    const data = await response.json()
                    setServers(data.servers || [])
                }
            } catch (error) {
                console.error('Failed to fetch servers:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (session) {
            fetchServers()
        }
    }, [session])

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner-lg" />
            </div>
        )
    }

    // Stats cards with proper colors
    const stats = [
        {
            name: 'Total Servers',
            value: servers.length.toString(),
            icon: Server,
            gradient: 'from-cyan-500 to-blue-500',
            bgGlow: 'rgba(6, 182, 212, 0.15)'
        },
        {
            name: 'Active Servers',
            value: servers.filter(s => s.status === 'RUNNING').length.toString(),
            icon: Activity,
            gradient: 'from-green-500 to-emerald-500',
            bgGlow: 'rgba(16, 185, 129, 0.15)'
        },
        {
            name: 'Total Resources',
            value: servers.reduce((acc, s) => acc + (s.plan?.memory || 0), 0) / 1024 + ' GB',
            icon: Cpu,
            gradient: 'from-purple-500 to-violet-500',
            bgGlow: 'rgba(139, 92, 246, 0.15)'
        },
        {
            name: 'Storage Used',
            value: servers.reduce((acc, s) => acc + (s.plan?.disk || 0), 0) / 1024 + ' GB',
            icon: HardDrive,
            gradient: 'from-orange-500 to-amber-500',
            bgGlow: 'rgba(249, 115, 22, 0.15)'
        }
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RUNNING': return 'badge-success'
            case 'STOPPED': return 'badge-error'
            case 'INSTALLING': return 'badge-warning'
            case 'SUSPENDED': return 'badge-warning'
            default: return 'badge-info'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'RUNNING': return <Play className="w-3 h-3" />
            case 'STOPPED': return <Square className="w-3 h-3" />
            case 'INSTALLING': return <RotateCw className="w-3 h-3 animate-spin" />
            default: return <AlertCircle className="w-3 h-3" />
        }
    }

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!
                        <Sparkles className="w-6 h-6 text-cyan-400" />
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Here&apos;s what&apos;s happening with your servers today.
                    </p>
                </div>
                <Link href="/dashboard/create" className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    <span>Create Server</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card p-6 relative overflow-hidden group"
                    >
                        {/* Background glow effect */}
                        <div
                            className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"
                            style={{ background: stat.bgGlow }}
                        />

                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 font-medium">{stat.name}</p>
                                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Servers List */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold">Your Servers</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage and monitor your game servers</p>
                    </div>
                    <Link href="/dashboard/servers" className="btn btn-secondary btn-sm">
                        View All
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="p-8">
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="skeleton w-14 h-14 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton h-4 w-1/3" />
                                        <div className="skeleton h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : servers.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-5 border border-cyan-500/20">
                            <Server className="w-10 h-10 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No servers yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Create your first Minecraft server to get started with premium hosting.
                        </p>
                        <Link href="/dashboard/create" className="btn btn-primary">
                            <Plus className="w-5 h-5" />
                            <span>Create Server</span>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {servers.slice(0, 5).map((server, index) => (
                            <motion.div
                                key={server.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="hover:bg-white/[0.02] transition-colors"
                            >
                                <Link href={`/dashboard/server/${server.identifier}`} className="flex items-center gap-5 p-5">
                                    {/* Server Icon */}
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                                        <Server className="w-7 h-7 text-cyan-400" />
                                    </div>

                                    {/* Server Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg truncate">{server.name}</h3>
                                            <span className={`badge ${getStatusColor(server.status)} flex items-center gap-1.5`}>
                                                {getStatusIcon(server.status)}
                                                {server.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {server.plan?.name} • {server.plan?.memory / 1024}GB RAM • {server.plan?.disk / 1024}GB Storage
                                        </p>
                                    </div>

                                    {/* Resources */}
                                    {server.resources && server.status === 'RUNNING' && (
                                        <div className="hidden md:flex items-center gap-8 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Cpu className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">{server.resources.cpu.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">{(server.resources.memory / 1024 / 1024).toFixed(0)}MB</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Wifi className="w-4 h-4 text-green-400" />
                                                <span className="text-green-400 font-medium">Online</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Arrow */}
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                                        <ArrowUpRight className="w-5 h-5 text-gray-500" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-6 group hover:border-purple-500/30"
                >
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">Schedule Tasks</h3>
                            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                Set up automated restarts, backups, and commands for your servers.
                            </p>
                            <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors inline-flex items-center gap-1">
                                Learn more
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card p-6 group hover:border-orange-500/30"
                >
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertCircle className="w-6 h-6 text-orange-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
                            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                Join our Discord community for 24/7 support and assistance.
                            </p>
                            <a
                                href={process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/dragohost'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors inline-flex items-center gap-1"
                            >
                                Join Discord
                                <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
