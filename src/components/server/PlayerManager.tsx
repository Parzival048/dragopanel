'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Crown,
    Shield,
    Ban,
    MessageSquare,
    UserPlus,
    UserMinus,
    Search,
    RefreshCw,
    Loader2,
    MoreVertical,
    Gavel,
    Clock,
    Globe
} from 'lucide-react'

interface Player {
    uuid: string
    name: string
    isOp: boolean
    isOnline: boolean
    lastSeen?: string
    playTime?: number
    health?: number
    location?: string
}

interface PlayerManagerProps {
    serverId: string
}

export default function PlayerManager({ serverId }: PlayerManagerProps) {
    const [activeTab, setActiveTab] = useState<'online' | 'whitelist' | 'banned' | 'ops'>('online')
    const [players, setPlayers] = useState<Player[]>([])
    const [whitelist, setWhitelist] = useState<Player[]>([])
    const [banned, setBanned] = useState<Player[]>([])
    const [ops, setOps] = useState<Player[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [playerToAdd, setPlayerToAdd] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    // Fetch players
    const fetchPlayers = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/servers/${serverId}/players`)
            if (response.ok) {
                const data = await response.json()
                setPlayers(data.online || [])
                setWhitelist(data.whitelist || [])
                setBanned(data.banned || [])
                setOps(data.ops || [])
            }
        } catch (error) {
            console.error('Failed to fetch players:', error)
        } finally {
            setIsLoading(false)
        }
    }, [serverId])

    useEffect(() => {
        fetchPlayers()
        const interval = setInterval(fetchPlayers, 30000) // Refresh every 30 seconds
        return () => clearInterval(interval)
    }, [fetchPlayers])

    // Send command
    const sendCommand = async (command: string) => {
        try {
            await fetch(`/api/servers/${serverId}/console`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            })
            fetchPlayers()
        } catch (error) {
            console.error('Failed to send command:', error)
        }
    }

    // Player actions
    const kickPlayer = (name: string) => sendCommand(`kick ${name}`)
    const banPlayer = (name: string) => sendCommand(`ban ${name}`)
    const pardonPlayer = (name: string) => sendCommand(`pardon ${name}`)
    const opPlayer = (name: string) => sendCommand(`op ${name}`)
    const deopPlayer = (name: string) => sendCommand(`deop ${name}`)
    const whitelistAdd = (name: string) => sendCommand(`whitelist add ${name}`)
    const whitelistRemove = (name: string) => sendCommand(`whitelist remove ${name}`)

    // Add player modal action
    const handleAddPlayer = async () => {
        if (!playerToAdd.trim()) return
        setIsAdding(true)

        switch (activeTab) {
            case 'whitelist':
                await whitelistAdd(playerToAdd)
                break
            case 'banned':
                await banPlayer(playerToAdd)
                break
            case 'ops':
                await opPlayer(playerToAdd)
                break
        }

        setPlayerToAdd('')
        setShowAddModal(false)
        setIsAdding(false)
    }

    // Get current list
    const getCurrentList = () => {
        switch (activeTab) {
            case 'online': return players
            case 'whitelist': return whitelist
            case 'banned': return banned
            case 'ops': return ops
        }
    }

    // Filter by search
    const filteredList = getCurrentList().filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Tab info
    const tabs = [
        { id: 'online', label: 'Online', icon: Globe, count: players.length },
        { id: 'whitelist', label: 'Whitelist', icon: Shield, count: whitelist.length },
        { id: 'banned', label: 'Banned', icon: Ban, count: banned.length },
        { id: 'ops', label: 'Operators', icon: Crown, count: ops.length },
    ]

    return (
        <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-4 border-b border-white/5 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-xs">
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search players..."
                        className="input pl-11"
                    />
                </div>
                <button
                    onClick={fetchPlayers}
                    className="btn btn-secondary"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                {activeTab !== 'online' && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Player
                    </button>
                )}
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Users className="w-16 h-16 mb-4 opacity-50" />
                        <p>No players {activeTab === 'online' ? 'online' : 'in this list'}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredList.map((player) => (
                            <motion.div
                                key={player.uuid || player.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                            >
                                {/* Player Avatar */}
                                <div className="relative">
                                    <img
                                        src={`https://mc-heads.net/avatar/${player.name}/40`}
                                        alt={player.name}
                                        className="w-10 h-10 rounded-lg"
                                    />
                                    {player.isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                                    )}
                                </div>

                                {/* Player Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{player.name}</h4>
                                        {player.isOp && (
                                            <Crown className="w-4 h-4 text-yellow-400" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {player.uuid?.substring(0, 8)}...
                                        {player.lastSeen && ` • Last seen: ${new Date(player.lastSeen).toLocaleDateString()}`}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {activeTab === 'online' && (
                                        <>
                                            <button
                                                onClick={() => kickPlayer(player.name)}
                                                className="btn btn-secondary btn-sm"
                                                title="Kick"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => banPlayer(player.name)}
                                                className="btn btn-danger btn-sm"
                                                title="Ban"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            {player.isOp ? (
                                                <button
                                                    onClick={() => deopPlayer(player.name)}
                                                    className="btn btn-secondary btn-sm"
                                                    title="Remove OP"
                                                >
                                                    <Crown className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => opPlayer(player.name)}
                                                    className="btn btn-secondary btn-sm"
                                                    title="Make OP"
                                                >
                                                    <Crown className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {activeTab === 'whitelist' && (
                                        <button
                                            onClick={() => whitelistRemove(player.name)}
                                            className="btn btn-danger btn-sm"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                            Remove
                                        </button>
                                    )}

                                    {activeTab === 'banned' && (
                                        <button
                                            onClick={() => pardonPlayer(player.name)}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            <Gavel className="w-4 h-4" />
                                            Unban
                                        </button>
                                    )}

                                    {activeTab === 'ops' && (
                                        <button
                                            onClick={() => deopPlayer(player.name)}
                                            className="btn btn-danger btn-sm"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                            Remove OP
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Player Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-md bg-[#0a0a0a] rounded-xl border border-white/10 p-6"
                    >
                        <h3 className="text-lg font-semibold mb-4">
                            Add Player to {activeTab === 'whitelist' ? 'Whitelist' : activeTab === 'banned' ? 'Ban List' : 'Operators'}
                        </h3>
                        <input
                            type="text"
                            value={playerToAdd}
                            onChange={(e) => setPlayerToAdd(e.target.value)}
                            placeholder="Enter Minecraft username"
                            className="input mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddPlayer}
                                disabled={isAdding || !playerToAdd.trim()}
                                className="btn btn-primary"
                            >
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Player'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
