'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Server,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Play,
    Square,
    RotateCw,
    Trash2,
    ExternalLink,
    Cpu,
    HardDrive,
    Wifi,
    AlertCircle
} from 'lucide-react'

interface ServerData {
    id: string
    name: string
    identifier: string
    status: string
    isSuspended: boolean
    plan: {
        name: string
        memory: number
        disk: number
        cpu: number
    }
    resources: {
        cpu: number
        memory: number
        disk: number
        uptime: number
    } | null
    expiresAt: string
    createdAt: string
}

export default function ServersPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [servers, setServers] = useState<ServerData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

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
            const interval = setInterval(fetchServers, 10000) // Refresh every 10 seconds
            return () => clearInterval(interval)
        }
    }, [session])

    // Filter servers
    const filteredServers = servers.filter(server => {
        const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || server.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Format bytes
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            RUNNING: 'badge-success',
            STOPPED: 'badge-error',
            INSTALLING: 'badge-warning',
            SUSPENDED: 'badge-warning'
        }
        return badges[status] || 'badge-info'
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner-lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Your Servers</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Manage all your Minecraft servers in one place
                    </p>
                </div>
                <Link href="/dashboard/create" className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    Create Server
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search servers..."
                        className="input pl-11"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input pl-11 pr-8 appearance-none min-w-[150px]"
                    >
                        <option value="all">All Status</option>
                        <option value="RUNNING">Running</option>
                        <option value="STOPPED">Stopped</option>
                        <option value="INSTALLING">Installing</option>
                        <option value="SUSPENDED">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Server Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card p-5">
                            <div className="skeleton h-6 w-2/3 mb-4" />
                            <div className="skeleton h-4 w-1/2 mb-6" />
                            <div className="space-y-3">
                                <div className="skeleton h-4 w-full" />
                                <div className="skeleton h-4 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredServers.length === 0 ? (
                <div className="card p-12 text-center">
                    {servers.length === 0 ? (
                        <>
                            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                                <Server className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h3 className="font-semibold mb-2">No servers yet</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Create your first Minecraft server to get started.
                            </p>
                            <Link href="/dashboard/create" className="btn btn-primary">
                                <Plus className="w-4 h-4" />
                                Create Server
                            </Link>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">No matching servers</h3>
                            <p className="text-sm text-gray-500">
                                Try adjusting your search or filter criteria.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredServers.map((server, index) => (
                        <motion.div
                            key={server.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link href={`/dashboard/server/${server.identifier}`} className="card p-5 block hover:border-cyan-500/50 transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center">
                                            <Server className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium group-hover:text-cyan-400 transition-colors">
                                                {server.name}
                                            </h3>
                                            <span className={`badge ${getStatusBadge(server.status)} text-xs`}>
                                                {server.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-sm text-gray-500 mb-4">
                                    {server.plan.name} • {server.plan.memory / 1024}GB RAM
                                </p>

                                {/* Resources */}
                                {server.resources && server.status === 'RUNNING' ? (
                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="p-2 rounded-lg bg-white/5">
                                            <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                <Cpu className="w-3 h-3" />
                                                CPU
                                            </div>
                                            <p className="font-medium">{server.resources.cpu.toFixed(1)}%</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5">
                                            <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                <HardDrive className="w-3 h-3" />
                                                RAM
                                            </div>
                                            <p className="font-medium">{formatBytes(server.resources.memory)}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5">
                                            <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                <Wifi className="w-3 h-3" />
                                                Status
                                            </div>
                                            <p className="font-medium text-green-400">Online</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-3 bg-white/5 rounded-lg text-sm text-gray-500">
                                        {server.status === 'INSTALLING' ? 'Installing...' : 'Server is offline'}
                                    </div>
                                )}

                                {/* Expiry Warning */}
                                {server.expiresAt && new Date(server.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && (
                                    <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
                                        Expires in {Math.ceil((new Date(server.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days
                                    </div>
                                )}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
