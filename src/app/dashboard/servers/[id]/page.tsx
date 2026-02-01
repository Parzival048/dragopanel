'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
    Loader2,
    Cpu,
    MemoryStick,
    Network,
    Clock
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
        const interval = setInterval(fetchServer, 5000) // Refresh every 5 seconds
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

    // Get status color and display name
    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running': return { color: 'bg-green-500', label: 'Running' }
            case 'starting': return { color: 'bg-yellow-500', label: 'Starting' }
            case 'stopping': return { color: 'bg-orange-500', label: 'Stopping' }
            case 'offline': return { color: 'bg-red-500', label: 'Offline' }
            case 'installing': return { color: 'bg-blue-500', label: 'Installing' }
            default: return { color: 'bg-gray-500', label: status || 'Unknown' }
        }
    }

    // Format uptime
    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    if (isLoading || authStatus === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
        )
    }

    if (!server) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-400">Server not found</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Header */}
            <header className="sticky top-0 z-40 glass-strong border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/servers" className="text-gray-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                                    <Server className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="font-semibold">{server.name}</h1>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className={`w-2 h-2 rounded-full ${getStatusInfo(server.status).color}`} />
                                        <span>{getStatusInfo(server.status).label}</span>
                                        {server.allocation && (
                                            <>
                                                <span>•</span>
                                                <span>{server.allocation.ip}:{server.allocation.port}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Power Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePowerAction('start')}
                                disabled={powerAction !== null || server.status === 'RUNNING'}
                                className="btn btn-sm bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                            >
                                {powerAction === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => handlePowerAction('restart')}
                                disabled={powerAction !== null || server.status === 'OFFLINE'}
                                className="btn btn-sm bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-50"
                            >
                                {powerAction === 'restart' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => handlePowerAction('stop')}
                                disabled={powerAction !== null || server.status === 'OFFLINE'}
                                className="btn btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                            >
                                {powerAction === 'stop' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Resource Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Cpu className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">CPU Usage</p>
                                <p className="font-semibold">{server.resources?.cpu?.toFixed(1) || 0}%</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <MemoryStick className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Memory</p>
                                <p className="font-semibold">{formatBytes(server.resources?.memory || 0)} / {formatBytes(server.plan.memory * 1024 * 1024)}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Network className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Network</p>
                                <p className="font-semibold text-sm">↑{formatBytes(server.resources?.networkTx || 0)} ↓{formatBytes(server.resources?.networkRx || 0)}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Uptime</p>
                                <p className="font-semibold">{server.resources?.uptime ? formatUptime(server.resources.uptime / 1000) : 'Offline'}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card min-h-[500px]"
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
                        <div className="p-4 h-[500px] flex items-center justify-center text-gray-500">
                            <Database className="w-8 h-8 mr-2" />
                            <span>Database management coming soon</span>
                        </div>
                    )}

                    {activeTab === 'backups' && (
                        <div className="p-4 h-[500px] flex items-center justify-center text-gray-500">
                            <HardDrive className="w-8 h-8 mr-2" />
                            <span>Backup management coming soon</span>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <ServerSettings serverId={id} />
                    )}
                </motion.div>
            </div>
        </div>
    )
}
