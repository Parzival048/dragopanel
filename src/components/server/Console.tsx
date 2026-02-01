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
    Wifi,
    WifiOff,
    RefreshCw
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
    const [status, setStatus] = useState<'polling' | 'connected' | 'error'>('polling')
    const [serverState, setServerState] = useState<string>('offline')
    const [command, setCommand] = useState('')
    const [powerAction, setPowerAction] = useState<string | null>(null)
    const [consoleLogs, setConsoleLogs] = useState<string[]>([
        '\x1b[36m[Dragohost] Console connected via API polling\x1b[0m',
        '\x1b[33m[Dragohost] Real-time updates every second\x1b[0m'
    ])
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
        // Simple ANSI to HTML conversion
        return text
            .replace(/\x1b\[36m/g, '<span class="text-cyan-400">')
            .replace(/\x1b\[32m/g, '<span class="text-green-400">')
            .replace(/\x1b\[33m/g, '<span class="text-yellow-400">')
            .replace(/\x1b\[31m/g, '<span class="text-red-400">')
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
                setStatus('connected')

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
        fetchResources()
        const interval = setInterval(fetchResources, 1000) // Poll every second
        return () => clearInterval(interval)
    }, [fetchResources])

    // Auto-scroll console
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight
        }
    }, [consoleLogs])

    // Send command
    const sendCommand = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!command.trim()) return

        const cmd = command.trim()
        setCommand('')
        setConsoleLogs(prev => [...prev, `\x1b[36m> ${cmd}\x1b[0m`])

        try {
            const response = await fetch(`/api/servers/${identifier}/console`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
            })

            if (response.ok) {
                setConsoleLogs(prev => [...prev, '\x1b[32m[Dragohost] Command sent successfully\x1b[0m'])
            } else {
                const error = await response.json()
                setConsoleLogs(prev => [...prev, `\x1b[31m[Error] ${error.error}\x1b[0m`])
            }
        } catch (error) {
            setConsoleLogs(prev => [...prev, '\x1b[31m[Error] Failed to send command\x1b[0m'])
        }
    }

    // Power actions
    const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
        setPowerAction(action)
        setConsoleLogs(prev => [...prev, `\x1b[33m[Dragohost] Sending ${action} signal...\x1b[0m`])

        try {
            const response = await fetch(`/api/servers/${identifier}/power`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })

            if (response.ok) {
                setConsoleLogs(prev => [...prev, `\x1b[32m[Dragohost] ${action.charAt(0).toUpperCase() + action.slice(1)} signal sent\x1b[0m`])
            } else {
                const error = await response.json()
                setConsoleLogs(prev => [...prev, `\x1b[31m[Error] ${error.error}\x1b[0m`])
            }
        } catch (error) {
            setConsoleLogs(prev => [...prev, '\x1b[31m[Error] Power action failed\x1b[0m'])
        } finally {
            setPowerAction(null)
        }
    }

    // Status colors
    const getStatusColor = (state: string) => {
        switch (state) {
            case 'running': return 'text-green-400'
            case 'starting': return 'text-yellow-400'
            case 'stopping': return 'text-orange-400'
            default: return 'text-red-400'
        }
    }

    const getStatusBg = (state: string) => {
        switch (state) {
            case 'running': return 'bg-green-500'
            case 'starting': return 'bg-yellow-500'
            case 'stopping': return 'bg-orange-500'
            default: return 'bg-red-500'
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* Main Console */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden min-h-[500px]">
                {/* Console Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <TerminalIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Console</span>
                        <div className="flex items-center gap-1.5">
                            {status === 'connected' ? (
                                <RefreshCw className="w-3 h-3 text-green-400" />
                            ) : status === 'polling' ? (
                                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                            ) : (
                                <WifiOff className="w-3 h-3 text-red-400" />
                            )}
                            <span className={`text-[10px] font-bold uppercase ${status === 'connected' ? 'text-green-400' :
                                status === 'polling' ? 'text-cyan-400' : 'text-red-400'
                                }`}>
                                {status === 'connected' ? 'Live' : status}
                            </span>
                        </div>
                    </div>

                    {/* Server State Badge */}
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${getStatusBg(serverState)}/20`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusBg(serverState)} animate-pulse`} />
                            <span className={`text-[10px] font-bold uppercase ${getStatusColor(serverState)}`}>
                                {serverState}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Console Output */}
                <div
                    ref={consoleRef}
                    className="flex-1 p-3 overflow-auto font-mono text-sm text-gray-300 bg-[#0a0a0a] scrollbar-thin scrollbar-thumb-white/10"
                    style={{ maxHeight: '400px' }}
                >
                    {consoleLogs.map((log, i) => (
                        <div
                            key={i}
                            className="whitespace-pre-wrap break-all leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: parseAnsi(log) }}
                        />
                    ))}
                </div>

                {/* Command Input */}
                <form onSubmit={sendCommand} className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-3 flex items-center text-cyan-500">
                            <span className="font-mono text-sm">$</span>
                        </div>
                        <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Type a command..."
                            disabled={serverState !== 'running'}
                            className="w-full bg-black/40 border border-white/5 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono disabled:opacity-50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!command.trim() || serverState !== 'running'}
                        className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Sidebar - Resources & Controls */}
            <div className="w-full lg:w-72 flex flex-col gap-4">
                {/* Power Controls */}
                <div className="card p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Power Controls</h3>
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={() => handlePowerAction('start')}
                            disabled={powerAction !== null || serverState === 'running'}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {powerAction === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                            <span className="text-[10px] font-medium">Start</span>
                        </button>
                        <button
                            onClick={() => handlePowerAction('restart')}
                            disabled={powerAction !== null || serverState !== 'running'}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {powerAction === 'restart' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                            <span className="text-[10px] font-medium">Restart</span>
                        </button>
                        <button
                            onClick={() => handlePowerAction('stop')}
                            disabled={powerAction !== null || serverState === 'offline'}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {powerAction === 'stop' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                            <span className="text-[10px] font-medium">Stop</span>
                        </button>
                        <button
                            onClick={() => handlePowerAction('kill')}
                            disabled={powerAction !== null || serverState === 'offline'}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {powerAction === 'kill' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Skull className="w-4 h-4" />}
                            <span className="text-[10px] font-medium">Kill</span>
                        </button>
                    </div>
                </div>

                {/* Resource Stats */}
                <div className="card p-4 flex flex-col gap-3">
                    <h3 className="text-sm font-medium text-gray-400">Resources</h3>

                    {/* CPU */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                <span>CPU</span>
                            </div>
                            <span className="text-white font-medium">{resources.cpu.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(resources.cpu, 100)}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Memory */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <MemoryStick className="w-3.5 h-3.5 text-purple-400" />
                                <span>Memory</span>
                            </div>
                            <span className="text-white font-medium">
                                {formatBytes(resources.memory)} / {formatBytes(limits.memory * 1024 * 1024)}
                            </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((resources.memory / (limits.memory * 1024 * 1024)) * 100, 100)}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Disk */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                                <span>Disk</span>
                            </div>
                            <span className="text-white font-medium">
                                {formatBytes(resources.disk)} / {formatBytes(limits.disk * 1024 * 1024)}
                            </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((resources.disk / (limits.disk * 1024 * 1024)) * 100, 100)}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Network */}
                    <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Network className="w-3.5 h-3.5 text-green-400" />
                            <span>Network</span>
                        </div>
                        <div className="text-white font-medium text-[10px]">
                            <span className="text-green-400">↑{formatBytes(resources.networkTx)}</span>
                            {' / '}
                            <span className="text-blue-400">↓{formatBytes(resources.networkRx)}</span>
                        </div>
                    </div>

                    {/* Uptime */}
                    <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="w-3.5 h-3.5 text-yellow-400" />
                            <span>Uptime</span>
                        </div>
                        <span className="text-white font-medium">
                            {resources.uptime > 0 ? formatUptime(resources.uptime) : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Mini Resource Graph */}
                {resourceHistory.length > 5 && (
                    <div className="card p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">CPU History</h3>
                        <div className="h-16 relative flex items-end gap-0.5">
                            <AnimatePresence mode="popLayout">
                                {resourceHistory.slice(-30).map((point, i) => (
                                    <motion.div
                                        key={point.time}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: `${Math.max(point.cpu, 2)}%`, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-400/30 rounded-t"
                                        style={{ minWidth: '2px' }}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>60s ago</span>
                            <span>Now</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
