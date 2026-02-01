'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Server,
    Terminal,
    FolderOpen,
    Puzzle,
    Users,
    Settings,
    Database,
    HardDrive,
    ArrowLeft,
    Power,
    RotateCw,
    Square,
    Skull,
    Loader2,
    Cpu,
    MemoryStick,
    Network,
    Clock,
    Copy,
    Check,
    ExternalLink,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import FileManager from '@/components/server/FileManager'
import PluginManager from '@/components/server/PluginManager'
import PlayerManager from '@/components/server/PlayerManager'
import ServerSettings from '@/components/server/ServerSettings'
import Console from '@/components/server/Console'
import { formatBytes } from '@/lib/utils'

interface ServerData {
    id: string
    name: string
    identifier: string
    uuid: string
    status: string
    isSuspended: boolean
    plan: {
        name: string
        memory: number
        disk: number
        cpu: number
        databases: number
        backups: number
        allocations: number
    }
    resources: {
        cpu: number
        memory: number
        disk: number
        networkRx: number
        networkTx: number
        uptime: number
    } | null
    allocation: {
        ip: string
        port: number
    } | null
    eggName: string | null
    expiresAt: string
    createdAt: string
}

type TabId = 'console' | 'files' | 'plugins' | 'players' | 'databases' | 'backups' | 'settings'

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [server, setServer] = useState<ServerData | null>(null)
    const [activeTab, setActiveTab] = useState<TabId>('console')
    const [isLoading, setIsLoading] = useState(true)
    const [powerAction, setPowerAction] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Tabs configuration
    const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: 'console', label: 'Console', icon: Terminal },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'plugins', label: 'Plugins', icon: Puzzle },
        { id: 'players', label: 'Players', icon: Users },
        { id: 'databases', label: 'Databases', icon: Database },
        { id: 'backups', label: 'Backups', icon: HardDrive },
        { id: 'settings', label: 'Settings', icon: Settings },
    ]

    // Fetch server data
    useEffect(() => {
        if (authStatus === 'loading') return
        if (authStatus === 'unauthenticated') {
            router.push('/login')
            return
        }

        async function fetchServer() {
            try {
                const response = await fetch(`/api/servers/${id}`)
                if (response.ok) {
                    const data = await response.json()
                    setServer(data.server)
                } else {
                    router.push('/dashboard/servers')
                }
            } catch (error) {
                console.error('Failed to fetch server:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchServer()
        const interval = setInterval(fetchServer, 2000) // Refresh every 2 seconds
        return () => clearInterval(interval)
    }, [id, authStatus, router])

    // Power actions
    const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
        if (!server) return
        setPowerAction(action)
        try {
            await fetch(`/api/servers/${id}/power`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })
        } catch (error) {
            console.error('Power action failed:', error)
        } finally {
            setPowerAction(null)
        }
    }

    // Copy server address
    const copyAddress = () => {
        if (server?.allocation) {
            navigator.clipboard.writeText(`${server.allocation.ip}:${server.allocation.port}`)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Get status color and display name
    const getStatusInfo = (status: string) => {
        const s = status?.toLowerCase() || 'offline'
        switch (s) {
            case 'running': return { color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/20', text: 'text-green-400', label: 'Running', pulse: true }
            case 'starting': return { color: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Starting', pulse: true }
            case 'stopping': return { color: 'from-orange-500 to-red-500', bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Stopping', pulse: true }
            case 'offline': return { color: 'from-red-500 to-rose-500', bg: 'bg-red-500/20', text: 'text-red-400', label: 'Offline', pulse: false }
            case 'installing': return { color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Installing', pulse: true }
            default: return { color: 'from-gray-500 to-slate-500', bg: 'bg-gray-500/20', text: 'text-gray-400', label: status || 'Unknown', pulse: false }
        }
    }

    // Format uptime
    const formatUptime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m ${seconds % 60}s`
    }

    if (isLoading || authStatus === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                    <p className="text-gray-400">Loading server...</p>
                </motion.div>
            </div>
        )
    }

    if (!server) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <p className="text-gray-400">Server not found</p>
            </div>
        )
    }

    const statusInfo = getStatusInfo(server.status)

    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Premium Header */}
            <header className="relative overflow-hidden border-b border-white/5">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5" />
                <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl" />

                <div className="relative max-w-7xl mx-auto px-6 py-8">
                    {/* Back button */}
                    <Link
                        href="/dashboard/servers"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm">Back to servers</span>
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        {/* Server Info */}
                        <div className="flex items-start gap-5">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${statusInfo.color} p-[2px]`}>
                                    <div className="w-full h-full rounded-2xl bg-[#0a0a0a] flex items-center justify-center">
                                        <Server className="w-7 h-7 text-white" />
                                    </div>
                                </div>
                                {statusInfo.pulse && (
                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${statusInfo.bg} ${statusInfo.text} animate-pulse`}>
                                        <span className={`absolute inset-1 rounded-full bg-current`} />
                                    </span>
                                )}
                            </motion.div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold">{server.name}</h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.bg} ${statusInfo.text}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                {server.allocation && (
                                    <button
                                        onClick={copyAddress}
                                        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
                                    >
                                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                        <span className="text-gray-300 font-mono">
                                            {server.allocation.ip}:{server.allocation.port}
                                        </span>
                                        {copied ? (
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                                        )}
                                    </button>
                                )}

                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    <span>{server.plan.name}</span>
                                    {server.eggName && (
                                        <>
                                            <span>•</span>
                                            <span>{server.eggName}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Power Controls */}
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePowerAction('start')}
                                disabled={powerAction !== null || server.status?.toLowerCase() === 'running'}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {powerAction === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                                <span>Start</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePowerAction('restart')}
                                disabled={powerAction !== null || server.status?.toLowerCase() === 'offline'}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400 hover:from-yellow-500/30 hover:to-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {powerAction === 'restart' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                                <span>Restart</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePowerAction('stop')}
                                disabled={powerAction !== null || server.status?.toLowerCase() === 'offline'}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 hover:from-red-500/30 hover:to-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {powerAction === 'stop' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                                <span>Stop</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePowerAction('kill')}
                                disabled={powerAction !== null || server.status?.toLowerCase() === 'offline'}
                                className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                title="Kill"
                            >
                                {powerAction === 'kill' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Skull className="w-4 h-4" />}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Resource Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-cyan-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-cyan-400" />
                                </div>
                                <span className="text-2xl font-bold text-white">{server.resources?.cpu?.toFixed(1) || 0}%</span>
                            </div>
                            <p className="text-sm text-gray-500">CPU Usage</p>
                            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(server.resources?.cpu || 0, 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-purple-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <MemoryStick className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-xl font-bold text-white">{formatBytes(server.resources?.memory || 0)}</span>
                            </div>
                            <p className="text-sm text-gray-500">Memory / {formatBytes(server.plan.memory * 1024 * 1024)}</p>
                            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((server.resources?.memory || 0) / (server.plan.memory * 1024 * 1024) * 100, 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Network className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-green-400">↑ {formatBytes(server.resources?.networkTx || 0)}</span>
                                    <br />
                                    <span className="text-xs text-blue-400">↓ {formatBytes(server.resources?.networkRx || 0)}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">Network I/O</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-green-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-green-400" />
                                </div>
                                <span className="text-xl font-bold text-white">
                                    {server.resources?.uptime ? formatUptime(server.resources.uptime) : 'Offline'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">Uptime</p>
                        </div>
                    </motion.div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                                : 'bg-white/[0.02] text-gray-400 hover:bg-white/[0.05] hover:text-white border border-transparent'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </motion.button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent overflow-hidden"
                    >
                        {activeTab === 'console' && (
                            <Console
                                serverId={server.id}
                                identifier={server.identifier}
                                limits={{
                                    memory: server.plan.memory,
                                    disk: server.plan.disk,
                                    cpu: server.plan.cpu
                                }}
                            />
                        )}

                        {activeTab === 'files' && (
                            <FileManager serverId={id} />
                        )}

                        {activeTab === 'plugins' && (
                            <PluginManager serverId={id} />
                        )}

                        {activeTab === 'players' && (
                            <PlayerManager serverId={id} />
                        )}

                        {activeTab === 'databases' && (
                            <div className="p-12 flex flex-col items-center justify-center text-gray-500 min-h-[400px]">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-transparent flex items-center justify-center mb-4">
                                    <Database className="w-8 h-8 text-orange-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Database Management</h3>
                                <p className="text-gray-500">Coming soon...</p>
                            </div>
                        )}

                        {activeTab === 'backups' && (
                            <div className="p-12 flex flex-col items-center justify-center text-gray-500 min-h-[400px]">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-transparent flex items-center justify-center mb-4">
                                    <HardDrive className="w-8 h-8 text-teal-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Backup Management</h3>
                                <p className="text-gray-500">Coming soon...</p>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <ServerSettings serverId={id} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
