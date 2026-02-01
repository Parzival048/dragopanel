'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Server,
    Terminal,
    FolderOpen,
    Network,
    Database,
    HardDrive,
    Puzzle,
    Users,
    Settings,
    Play,
    Square,
    RotateCw,
    Skull,
    Cpu,
    MemoryStick,
    Wifi,
    Clock,
    ChevronRight,
    AlertCircle,
    Send
} from 'lucide-react'

type TabType = 'console' | 'files' | 'network' | 'databases' | 'backups' | 'plugins' | 'players' | 'settings'

interface ServerDetails {
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
        networkRx: number
        networkTx: number
        uptime: number
    } | null
    allocation?: {
        ip: string
        port: number
    }
}

export default function ServerPage() {
    const { data: session, status: sessionStatus } = useSession()
    const router = useRouter()
    const params = useParams()
    const identifier = params?.id as string

    const [server, setServer] = useState<ServerDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabType>('console')
    const [consoleLines, setConsoleLines] = useState<string[]>([])
    const [commandInput, setCommandInput] = useState('')
    const [isConnecting, setIsConnecting] = useState(false)
    const [isPowerLoading, setIsPowerLoading] = useState(false)

    const consoleRef = useRef<HTMLDivElement>(null)
    const wsRef = useRef<WebSocket | null>(null)

    // Redirect if not authenticated
    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.push('/login')
        }
    }, [sessionStatus, router])

    // Fetch server details
    const fetchServer = useCallback(async () => {
        try {
            const response = await fetch(`/api/servers/${identifier}`)
            if (response.ok) {
                const data = await response.json()
                setServer(data.server)
            } else if (response.status === 404) {
                router.push('/dashboard')
            }
        } catch (error) {
            console.error('Failed to fetch server:', error)
        } finally {
            setIsLoading(false)
        }
    }, [identifier, router])

    useEffect(() => {
        if (session && identifier) {
            fetchServer()
            const interval = setInterval(fetchServer, 5000) // Refresh every 5 seconds
            return () => clearInterval(interval)
        }
    }, [session, identifier, fetchServer])

    // Connect to WebSocket for console
    const connectWebSocket = useCallback(async () => {
        if (!identifier || wsRef.current?.readyState === WebSocket.OPEN) return

        setIsConnecting(true)
        try {
            const response = await fetch(`/api/servers/${identifier}/console`)
            if (!response.ok) throw new Error('Failed to get WebSocket credentials')

            const { socket, token } = await response.json()

            const ws = new WebSocket(socket)
            wsRef.current = ws

            ws.onopen = () => {
                // Authenticate
                ws.send(JSON.stringify({
                    event: 'auth',
                    args: [token]
                }))
            }

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data)

                if (data.event === 'auth success') {
                    // Request logs
                    ws.send(JSON.stringify({
                        event: 'send logs',
                        args: [null]
                    }))
                } else if (data.event === 'console output') {
                    setConsoleLines(prev => [...prev.slice(-500), data.args[0]])
                } else if (data.event === 'status') {
                    // Update server status
                    fetchServer()
                }
            }

            ws.onclose = () => {
                setIsConnecting(false)
            }

            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                setIsConnecting(false)
            }
        } catch (error) {
            console.error('Failed to connect WebSocket:', error)
            setIsConnecting(false)
        }
    }, [identifier, fetchServer])

    // Connect when console tab is active
    useEffect(() => {
        if (activeTab === 'console' && server?.status === 'RUNNING') {
            connectWebSocket()
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
        }
    }, [activeTab, server?.status, connectWebSocket])

    // Auto-scroll console
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight
        }
    }, [consoleLines])

    // Send command
    const sendCommand = () => {
        if (!commandInput.trim() || !wsRef.current) return

        wsRef.current.send(JSON.stringify({
            event: 'send command',
            args: [commandInput]
        }))

        setCommandInput('')
    }

    // Power actions
    const sendPowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
        setIsPowerLoading(true)
        try {
            const response = await fetch(`/api/servers/${identifier}/power`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })

            if (response.ok) {
                fetchServer()
            }
        } catch (error) {
            console.error('Power action failed:', error)
        } finally {
            setIsPowerLoading(false)
        }
    }

    // Format uptime
    const formatUptime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days}d ${hours % 24}h`
        if (hours > 0) return `${hours}h ${minutes % 60}m`
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`
        return `${seconds}s`
    }

    // Format bytes
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const tabs = [
        { id: 'console', name: 'Console', icon: Terminal },
        { id: 'files', name: 'Files', icon: FolderOpen },
        { id: 'network', name: 'Network', icon: Network },
        { id: 'databases', name: 'Databases', icon: Database },
        { id: 'backups', name: 'Backups', icon: HardDrive },
        { id: 'plugins', name: 'Plugins', icon: Puzzle },
        { id: 'players', name: 'Players', icon: Users },
        { id: 'settings', name: 'Settings', icon: Settings },
    ]

    if (sessionStatus === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner-lg" />
            </div>
        )
    }

    if (!server) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Server Not Found</h2>
                <p className="text-gray-400">The server you're looking for doesn't exist.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Server Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/20 flex items-center justify-center">
                        <Server className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{server.name}</h1>
                            <span className={`badge ${server.status === 'RUNNING' ? 'badge-success' :
                                    server.status === 'STOPPED' ? 'badge-error' :
                                        'badge-warning'
                                }`}>
                                {server.status}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            {server.allocation?.ip}:{server.allocation?.port} • {server.plan.name}
                        </p>
                    </div>
                </div>

                {/* Power Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => sendPowerAction('start')}
                        disabled={isPowerLoading || server.status === 'RUNNING'}
                        className="btn btn-secondary"
                    >
                        <Play className="w-4 h-4" />
                        Start
                    </button>
                    <button
                        onClick={() => sendPowerAction('restart')}
                        disabled={isPowerLoading || server.status === 'STOPPED'}
                        className="btn btn-secondary"
                    >
                        <RotateCw className="w-4 h-4" />
                        Restart
                    </button>
                    <button
                        onClick={() => sendPowerAction('stop')}
                        disabled={isPowerLoading || server.status === 'STOPPED'}
                        className="btn btn-secondary"
                    >
                        <Square className="w-4 h-4" />
                        Stop
                    </button>
                    <button
                        onClick={() => sendPowerAction('kill')}
                        disabled={isPowerLoading || server.status === 'STOPPED'}
                        className="btn btn-danger"
                    >
                        <Skull className="w-4 h-4" />
                        Kill
                    </button>
                </div>
            </div>

            {/* Resource Stats */}
            {server.resources && server.status === 'RUNNING' && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <Cpu className="w-5 h-5 text-cyan-400" />
                            <div>
                                <p className="text-xs text-gray-500">CPU</p>
                                <p className="font-semibold">{server.resources.cpu.toFixed(1)}%</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <MemoryStick className="w-5 h-5 text-purple-400" />
                            <div>
                                <p className="text-xs text-gray-500">Memory</p>
                                <p className="font-semibold">{formatBytes(server.resources.memory)}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <HardDrive className="w-5 h-5 text-orange-400" />
                            <div>
                                <p className="text-xs text-gray-500">Disk</p>
                                <p className="font-semibold">{formatBytes(server.resources.disk)}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <Wifi className="w-5 h-5 text-green-400" />
                            <div>
                                <p className="text-xs text-gray-500">Network</p>
                                <p className="font-semibold text-xs">
                                    ↑{formatBytes(server.resources.networkTx)} ↓{formatBytes(server.resources.networkRx)}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="text-xs text-gray-500">Uptime</p>
                                <p className="font-semibold">{formatUptime(server.resources.uptime)}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 p-1 bg-[#0a0a0a] rounded-xl border border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card overflow-hidden">
                {activeTab === 'console' && (
                    <div className="flex flex-col h-[500px]">
                        {/* Console Output */}
                        <div
                            ref={consoleRef}
                            className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#0a0a0a]"
                        >
                            {server.status !== 'RUNNING' ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <Terminal className="w-12 h-12 mb-4 opacity-50" />
                                    <p>Server is offline</p>
                                    <p className="text-xs mt-1">Start the server to view console output</p>
                                </div>
                            ) : consoleLines.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    {isConnecting ? (
                                        <>
                                            <div className="spinner mr-3" />
                                            Connecting to console...
                                        </>
                                    ) : (
                                        'No console output yet...'
                                    )}
                                </div>
                            ) : (
                                consoleLines.map((line, index) => (
                                    <div key={index} className="text-gray-300 leading-relaxed">
                                        <span dangerouslySetInnerHTML={{ __html: line.replace(/\n/g, '<br/>') }} />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Command Input */}
                        <div className="border-t border-white/5 p-3">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">
                                        $
                                    </span>
                                    <input
                                        type="text"
                                        value={commandInput}
                                        onChange={(e) => setCommandInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
                                        placeholder="Type a command..."
                                        disabled={server.status !== 'RUNNING'}
                                        className="input pl-8 font-mono"
                                    />
                                </div>
                                <button
                                    onClick={sendCommand}
                                    disabled={server.status !== 'RUNNING' || !commandInput.trim()}
                                    className="btn btn-primary"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="p-6">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>File Manager</p>
                                <p className="text-sm text-gray-600 mt-1">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'network' && (
                    <div className="p-6">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Network Manager</p>
                                <p className="text-sm text-gray-600 mt-1">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'databases' && (
                    <div className="p-6">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Database Manager</p>
                                <p className="text-sm text-gray-600 mt-1">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'backups' && (
                    <div className="p-6">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Backup Manager</p>
                                <p className="text-sm text-gray-600 mt-1">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'plugins' && (
                    <div className="p-6">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <Puzzle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Plugin Manager (Modrinth)</p>
                                <p className="text-sm text-gray-600 mt-1">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'players' && (
                    <div className="p-6">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Player Manager</p>
                                <p className="text-sm text-gray-600 mt-1">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="p-6">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Server Settings</p>
                                <p className="text-sm text-gray-600 mt-1">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
