'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Puzzle,
    Search,
    Download,
    Check,
    Star,
    ExternalLink,
    ChevronDown,
    Loader2,
    Filter,
    TrendingUp,
    Clock,
    ArrowDownCircle,
    Trash2,
    RefreshCw
} from 'lucide-react'

interface ModrinthPlugin {
    slug: string
    title: string
    description: string
    categories: string[]
    client_side: string
    server_side: string
    downloads: number
    follows: number
    icon_url: string | null
    project_type: string
    versions: string[]
    latest_version?: string
}

interface InstalledPlugin {
    name: string
    version: string
    file: string
    modrinthId?: string
}

interface PluginManagerProps {
    serverId: string
}

export default function PluginManager({ serverId }: PluginManagerProps) {
    const [activeTab, setActiveTab] = useState<'browse' | 'installed'>('browse')
    const [searchQuery, setSearchQuery] = useState('')
    const [plugins, setPlugins] = useState<ModrinthPlugin[]>([])
    const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [selectedPlugin, setSelectedPlugin] = useState<ModrinthPlugin | null>(null)
    const [installingPlugin, setInstallingPlugin] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<'relevance' | 'downloads' | 'updated' | 'newest'>('relevance')
    const [gameVersion, setGameVersion] = useState<string>('1.20.4')
    const [loader, setLoader] = useState<string>('paper')

    const gameVersions = ['1.20.4', '1.20.2', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.16.5']
    const loaders = ['paper', 'spigot', 'bukkit', 'purpur', 'velocity', 'bungeecord']

    // Search plugins
    const searchPlugins = useCallback(async () => {
        setIsSearching(true)
        try {
            const params = new URLSearchParams({
                query: searchQuery,
                sortBy,
                gameVersion,
                loader
            })
            const response = await fetch(`/api/modrinth/search?${params}`)
            if (response.ok) {
                const data = await response.json()
                setPlugins(data.plugins || [])
            }
        } catch (error) {
            console.error('Failed to search plugins:', error)
        } finally {
            setIsSearching(false)
        }
    }, [searchQuery, sortBy, gameVersion, loader])

    // Fetch installed plugins
    const fetchInstalled = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/servers/${serverId}/plugins`)
            if (response.ok) {
                const data = await response.json()
                setInstalledPlugins(data.plugins || [])
            }
        } catch (error) {
            console.error('Failed to fetch installed plugins:', error)
        } finally {
            setIsLoading(false)
        }
    }, [serverId])

    useEffect(() => {
        if (activeTab === 'browse') {
            searchPlugins()
        } else {
            fetchInstalled()
        }
    }, [activeTab, searchPlugins, fetchInstalled])

    // Install plugin
    const installPlugin = async (plugin: ModrinthPlugin) => {
        setInstallingPlugin(plugin.slug)
        try {
            await fetch(`/api/servers/${serverId}/plugins/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: plugin.slug,
                    gameVersion,
                    loader
                })
            })
            fetchInstalled()
        } catch (error) {
            console.error('Failed to install plugin:', error)
        } finally {
            setInstallingPlugin(null)
        }
    }

    // Uninstall plugin
    const uninstallPlugin = async (plugin: InstalledPlugin) => {
        if (!confirm(`Remove ${plugin.name}?`)) return
        try {
            await fetch(`/api/servers/${serverId}/plugins/${encodeURIComponent(plugin.file)}`, {
                method: 'DELETE'
            })
            fetchInstalled()
        } catch (error) {
            console.error('Failed to uninstall plugin:', error)
        }
    }

    // Format download count
    const formatDownloads = (count: number) => {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
        return count.toString()
    }

    return (
        <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="flex items-center gap-4 p-4 border-b border-white/5">
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'browse'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Browse Plugins
                </button>
                <button
                    onClick={() => setActiveTab('installed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'installed'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Installed ({installedPlugins.length})
                </button>
            </div>

            {activeTab === 'browse' ? (
                <>
                    {/* Search & Filters */}
                    <div className="p-4 space-y-4 border-b border-white/5">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchPlugins()}
                                    placeholder="Search plugins on Modrinth..."
                                    className="input pl-11"
                                />
                            </div>
                            <button
                                onClick={searchPlugins}
                                disabled={isSearching}
                                className="btn btn-primary"
                            >
                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                className="input w-auto"
                            >
                                <option value="relevance">Most Relevant</option>
                                <option value="downloads">Most Downloads</option>
                                <option value="updated">Recently Updated</option>
                                <option value="newest">Newest</option>
                            </select>

                            <select
                                value={gameVersion}
                                onChange={(e) => setGameVersion(e.target.value)}
                                className="input w-auto"
                            >
                                {gameVersions.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>

                            <select
                                value={loader}
                                onChange={(e) => setLoader(e.target.value)}
                                className="input w-auto capitalize"
                            >
                                {loaders.map(l => (
                                    <option key={l} value={l} className="capitalize">{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Plugin Grid */}
                    <div className="flex-1 overflow-auto p-4">
                        {isSearching ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                            </div>
                        ) : plugins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <Puzzle className="w-16 h-16 mb-4 opacity-50" />
                                <p>No plugins found</p>
                                <p className="text-sm">Try a different search term or filter</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {plugins.map((plugin) => (
                                    <motion.div
                                        key={plugin.slug}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="card p-4 hover:border-cyan-500/30 transition-all"
                                    >
                                        <div className="flex gap-3 mb-3">
                                            {plugin.icon_url ? (
                                                <img
                                                    src={plugin.icon_url}
                                                    alt={plugin.title}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                                    <Puzzle className="w-6 h-6 text-cyan-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium truncate">{plugin.title}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <ArrowDownCircle className="w-3 h-3" />
                                                        {formatDownloads(plugin.downloads)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3" />
                                                        {formatDownloads(plugin.follows)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                            {plugin.description}
                                        </p>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {plugin.categories.slice(0, 3).map(cat => (
                                                <span key={cat} className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <a
                                                href={`https://modrinth.com/plugin/${plugin.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                            >
                                                View on Modrinth
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <button
                                                onClick={() => installPlugin(plugin)}
                                                disabled={installingPlugin === plugin.slug}
                                                className="btn btn-primary btn-sm"
                                            >
                                                {installingPlugin === plugin.slug ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Download className="w-4 h-4" />
                                                        Install
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Installed Plugins */
                <div className="flex-1 overflow-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-400">
                            {installedPlugins.length} plugin(s) installed in /plugins folder
                        </p>
                        <button
                            onClick={fetchInstalled}
                            className="btn btn-secondary btn-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                        </div>
                    ) : installedPlugins.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Puzzle className="w-16 h-16 mb-4 opacity-50" />
                            <p>No plugins installed</p>
                            <p className="text-sm">Browse and install plugins from Modrinth</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {installedPlugins.map((plugin) => (
                                <div
                                    key={plugin.file}
                                    className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                        <Puzzle className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">{plugin.name}</h4>
                                        <p className="text-xs text-gray-500">{plugin.file}</p>
                                    </div>
                                    {plugin.version && (
                                        <span className="badge badge-info">{plugin.version}</span>
                                    )}
                                    <button
                                        onClick={() => uninstallPlugin(plugin)}
                                        className="btn btn-danger btn-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
