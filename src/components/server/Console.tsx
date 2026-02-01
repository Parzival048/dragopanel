'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Loader2,
    Terminal as TerminalIcon,
    Send,
    Cpu,
    MemoryStick,
    HardDrive,
    Network,
    Clock,
    Power,
    RotateCw,
    Square,
    Skull,
    RefreshCw,
    WifiOff,
    Activity,
    ChevronRight
} from 'lucide-react'
import { formatBytes } from '@/lib/utils'

interface ServerConsoleProps {
    serverId: string
    identifier: string
    limits: {
        memory: number
        disk: number
        cpu: number
    }
}

interface ResourceStats {
    cpu: number
    memory: number
    disk: number
    networkRx: number
    networkTx: number
    uptime: number
}

export default function ServerConsole({ serverId, identifier, limits }: ServerConsoleProps) {
    const consoleRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [status, setStatus] = useState<'polling' | 'connected' | 'error'>('polling')
    const [serverState, setServerState] = useState<string>('offline')
    const [command, setCommand] = useState('')
    const [commandHistory, setCommandHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [powerAction, setPowerAction] = useState<string | null>(null)
    const [consoleLogs, setConsoleLogs] = useState<string[]>([])
    const [resources, setResources] = useState<ResourceStats>({
        cpu: 0,
        memory: 0,
        disk: 0,
        networkRx: 0,
        networkTx: 0,
        uptime: 0
    })
    const [resourceHistory, setResourceHistory] = useState<{ cpu: number; memory: number; time: number }[]>([])

    // Format uptime
    const formatUptime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (days > 0) return `${days}d ${hours}h ${minutes}m`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m ${seconds % 60}s`
    }

    // Parse ANSI codes for display
    const parseAnsi = (text: string) => {
        return text
            .replace(/\x1b\[36m/g, '<span class="text-cyan-400">')
            .replace(/\x1b\[32m/g, '<span class="text-green-400">')
            .replace(/\x1b\[33m/g, '<span class="text-yellow-400">')
            .replace(/\x1b\[31m/g, '<span class="text-red-400">')
            .replace(/\x1b\[35m/g, '<span class="text-purple-400">')
            .replace(/\x1b\[0m/g, '</span>')
    }

    // Fetch resources via polling
    const fetchResources = useCallback(async () => {
        try {
            const response = await fetch(`/api/servers/${identifier}/resources`)
            if (response.ok) {
                const data = await response.json()
                setServerState(data.state || 'offline')
                setResources({
                    cpu: data.resources.cpu || 0,
                    memory: data.resources.memory || 0,
                    disk: data.resources.disk || 0,
                    networkRx: data.resources.networkRx || 0,
                    networkTx: data.resources.networkTx || 0,
                    uptime: data.resources.uptime || 0
                })

                // Check if we're in fallback mode
                if (data._fallback) {
                    setStatus('error')
                    // Only add warning once
                    setConsoleLogs(prev => {
                        if (!prev.some(log => log.includes('CLIENT_KEY'))) {
                            return [...prev,
                                '\x1b[33m⚠ Warning: Unable to fetch live resources from Pterodactyl.\x1b[0m',
                                '\x1b[33m  Please configure PTERODACTYL_CLIENT_KEY with an admin user\'s API key.\x1b[0m',
                                ''
                            ]
                        }
                        return prev
                    })
                } else {
                    setStatus('connected')
                }

                // Update history for graph
                setResourceHistory(prev => {
                    const now = Date.now()
                    const memPercent = (data.resources.memory / (limits.memory * 1024 * 1024)) * 100
                    return [...prev, {
                        cpu: data.resources.cpu || 0,
                        memory: memPercent,
                        time: now
                    }].slice(-60)
                })
            } else {
                setStatus('error')
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error)
            setStatus('error')
        }
    }, [identifier, limits.memory])

    // Polling loop - every 1 second
    useEffect(() => {
        // Add initial welcome message
        setConsoleLogs([
            '\x1b[36m┌──────────────────────────────────────────────────────┐\x1b[0m',
            '\x1b[36m│\x1b[0m  \x1b[35m🚀 Dragohost Console\x1b[0m                                \x1b[36m│\x1b[0m',
            '\x1b[36m│\x1b[0m  Connected via API polling • Updates every second   \x1b[36m│\x1b[0m',
            '\x1b[36m└──────────────────────────────────────────────────────┘\x1b[0m',
            ''
        ])

        fetchResources()
        const interval = setInterval(fetchResources, 1000)
        return () => clearInterval(interval)
    }, [fetchResources])

    // Auto-scroll console
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight
        }
    }, [consoleLogs])

    // Handle key navigation in command history
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1
                setHistoryIndex(newIndex)
                setCommand(commandHistory[commandHistory.length - 1 - newIndex])
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1
                setHistoryIndex(newIndex)
                setCommand(commandHistory[commandHistory.length - 1 - newIndex])
            } else if (historyIndex === 0) {
                setHistoryIndex(-1)
                setCommand('')
            }
        }
    }

    // Send command
    const sendCommand = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!command.trim()) return

        const cmd = command.trim()
        setCommand('')
        setHistoryIndex(-1)
        setCommandHistory(prev => [...prev, cmd])
        setConsoleLogs(prev => [...prev, `\x1b[36m$ ${cmd}\x1b[0m`])

        try {
            const response = await fetch(`/api/servers/${identifier}/console`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
            })

            if (response.ok) {
                setConsoleLogs(prev => [...prev, '\x1b[32m✓ Command sent successfully\x1b[0m'])
            } else {
                const error = await response.json()
                setConsoleLogs(prev => [...prev, `\x1b[31m✗ ${error.error}\x1b[0m`])
            }
        } catch (error) {
            setConsoleLogs(prev => [...prev, '\x1b[31m✗ Failed to send command\x1b[0m'])
        }

        inputRef.current?.focus()
    }

    // Power actions
    const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
        setPowerAction(action)
        setConsoleLogs(prev => [...prev, `\x1b[33m⏳ Sending ${action} signal...\x1b[0m`])

        try {
            const response = await fetch(`/api/servers/${identifier}/power`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })

            if (response.ok) {
                setConsoleLogs(prev => [...prev, `\x1b[32m✓ ${action.charAt(0).toUpperCase() + action.slice(1)} signal sent\x1b[0m`])
            } else {
                const error = await response.json()
                setConsoleLogs(prev => [...prev, `\x1b[31m✗ ${error.error}\x1b[0m`])
            }
        } catch (error) {
            setConsoleLogs(prev => [...prev, '\x1b[31m✗ Power action failed\x1b[0m'])
        } finally {
            setPowerAction(null)
        }
    }

    // Status info
    const getStatusInfo = (state: string) => {
        switch (state) {
            case 'running': return { color: 'text-green-400', bg: 'bg-green-500', label: 'RUNNING' }
            case 'starting': return { color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'STARTING' }
            case 'stopping': return { color: 'text-orange-400', bg: 'bg-orange-500', label: 'STOPPING' }
            default: return { color: 'text-red-400', bg: 'bg-red-500', label: 'OFFLINE' }
        }
    }

    const statusInfo = getStatusInfo(serverState)

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6">
            {/* Main Console */}
            <div className="flex-1 flex flex-col min-h-[600px]">
                {/* Console Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f] rounded-t-xl border border-white/5 border-b-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="flex items-center gap-2">
                            <TerminalIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-400">Console</span>
                            <span className="text-xs text-gray-600">•</span>
                            {status === 'connected' ? (
                                <span className="flex items-center gap-1.5 text-xs text-green-400">
                                    <Activity className="w-3 h-3" />
                                    Live
                                </span>
                            ) : status === 'polling' ? (
                                <span className="flex items-center gap-1.5 text-xs text-cyan-400">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Connecting
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs text-red-400">
                                    <WifiOff className="w-3 h-3" />
                                    Error
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Server State Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg}/20`}>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.bg} animate-pulse`} />
                        <span className={`text-xs font-bold tracking-wider ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                </div>

                {/* Console Output */}
                <div
                    ref={consoleRef}
                    className="flex-1 p-4 overflow-auto font-mono text-sm leading-relaxed bg-[#0a0a0a] border-x border-white/5 scrollbar-thin scrollbar-thumb-white/10"
                    style={{ minHeight: '400px' }}
                    onClick={() => inputRef.current?.focus()}
                >
                    {consoleLogs.map((log, i) => (
                        <div
                            key={i}
                            className="whitespace-pre-wrap break-all text-gray-300"
                            dangerouslySetInnerHTML={{ __html: parseAnsi(log) }}
                        />
                    ))}
                </div>

                {/* Command Input */}
                <form onSubmit={sendCommand} className="relative">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f] rounded-b-xl border border-white/5 border-t-0">
                        <ChevronRight className="w-4 h-4 text-cyan-500" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={serverState === 'running' ? 'Type a command...' : 'Server is offline'}
                            disabled={serverState !== 'running'}
                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none font-mono text-sm disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!command.trim() || serverState !== 'running'}
                            className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 flex flex-col gap-5">
                {/* Power Controls */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Power className="w-4 h-4" />
                        Power Controls
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePowerAction('start')}
                            disabled={powerAction !== null || serverState === 'running'}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-green-500/20"
                        >
                            {powerAction === 'start' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
                            <span className="text-[10px] font-medium">Start</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePowerAction('restart')}
                            disabled={powerAction !== null || serverState !== 'running'}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-yellow-500/20"
                        >
                            {powerAction === 'restart' ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCw className="w-5 h-5" />}
                            <span className="text-[10px] font-medium">Restart</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePowerAction('stop')}
                            disabled={powerAction !== null || serverState === 'offline'}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-red-500/20"
                        >
                            {powerAction === 'stop' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                            <span className="text-[10px] font-medium">Stop</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePowerAction('kill')}
                            disabled={powerAction !== null || serverState === 'offline'}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-rose-500/20"
                        >
                            {powerAction === 'kill' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Skull className="w-5 h-5" />}
                            <span className="text-[10px] font-medium">Kill</span>
                        </motion.button>
                    </div>
                </div>

                {/* Resource Stats */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Resources
                    </h3>

                    <div className="space-y-4">
                        {/* CPU */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Cpu className="w-4 h-4 text-cyan-400" />
                                    <span>CPU</span>
                                </div>
                                <span className="text-white font-medium">{resources.cpu.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                                    animate={{ width: `${Math.min(resources.cpu, 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        {/* Memory */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <MemoryStick className="w-4 h-4 text-purple-400" />
                                    <span>Memory</span>
                                </div>
                                <span className="text-white font-medium text-xs">
                                    {formatBytes(resources.memory)} / {formatBytes(limits.memory * 1024 * 1024)}
                                </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                                    animate={{ width: `${Math.min((resources.memory / (limits.memory * 1024 * 1024)) * 100, 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        {/* Disk */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <HardDrive className="w-4 h-4 text-blue-400" />
                                    <span>Disk</span>
                                </div>
                                <span className="text-white font-medium text-xs">
                                    {formatBytes(resources.disk)} / {formatBytes(limits.disk * 1024 * 1024)}
                                </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                                    animate={{ width: `${Math.min((resources.disk / (limits.disk * 1024 * 1024)) * 100, 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Network & Uptime */}
                    <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Network className="w-4 h-4 text-green-400" />
                                <span>Network</span>
                            </div>
                            <div className="text-xs">
                                <span className="text-green-400">↑{formatBytes(resources.networkTx)}</span>
                                <span className="text-gray-600 mx-1">/</span>
                                <span className="text-blue-400">↓{formatBytes(resources.networkRx)}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="w-4 h-4 text-yellow-400" />
                                <span>Uptime</span>
                            </div>
                            <span className="text-white font-medium">
                                {resources.uptime > 0 ? formatUptime(resources.uptime) : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* CPU History Graph */}
                {resourceHistory.length > 10 && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">CPU History</h3>
                        <div className="h-20 relative flex items-end gap-[2px]">
                            <AnimatePresence mode="popLayout">
                                {resourceHistory.slice(-30).map((point, i) => (
                                    <motion.div
                                        key={point.time}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: `${Math.max(point.cpu, 3)}%`, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex-1 bg-gradient-to-t from-cyan-500/60 to-cyan-400/30 rounded-t"
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-600 mt-2">
                            <span>30s ago</span>
                            <span>Now</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
