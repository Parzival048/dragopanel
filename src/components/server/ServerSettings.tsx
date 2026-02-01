'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Settings,
    Save,
    RefreshCw,
    Loader2,
    Info,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Terminal,
    HardDrive,
    Cpu,
    Globe,
    Lock,
    Gamepad2,
    Users,
    Zap
} from 'lucide-react'

interface ServerSettingsProps {
    serverId: string
}

interface SettingsGroup {
    id: string
    name: string
    icon: React.ElementType
    settings: Setting[]
}

interface Setting {
    key: string
    label: string
    description?: string
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'
    options?: { value: string; label: string }[]
    default?: string | number | boolean
    min?: number
    max?: number
    requiresRestart?: boolean
}

export default function ServerSettings({ serverId }: ServerSettingsProps) {
    const [settings, setSettings] = useState<Record<string, string | number | boolean>>({})
    const [originalSettings, setOriginalSettings] = useState<Record<string, string | number | boolean>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['general', 'performance'])
    const [hasChanges, setHasChanges] = useState(false)

    // Settings configuration
    const settingsGroups: SettingsGroup[] = [
        {
            id: 'general',
            name: 'General',
            icon: Settings,
            settings: [
                { key: 'server-name', label: 'Server Name', type: 'text', description: 'The name of your server shown in the server list' },
                { key: 'motd', label: 'MOTD', type: 'textarea', description: 'Message of the day shown in the server list' },
                { key: 'max-players', label: 'Max Players', type: 'number', min: 1, max: 1000, description: 'Maximum number of players allowed' },
                { key: 'online-mode', label: 'Online Mode', type: 'boolean', description: 'Verify players with Minecraft authentication servers', requiresRestart: true },
                { key: 'white-list', label: 'Whitelist', type: 'boolean', description: 'Only allow whitelisted players to join' },
                { key: 'enforce-whitelist', label: 'Enforce Whitelist', type: 'boolean', description: 'Kick non-whitelisted players when whitelist is enabled' },
            ]
        },
        {
            id: 'gameplay',
            name: 'Gameplay',
            icon: Gamepad2,
            settings: [
                {
                    key: 'gamemode', label: 'Default Gamemode', type: 'select', options: [
                        { value: 'survival', label: 'Survival' },
                        { value: 'creative', label: 'Creative' },
                        { value: 'adventure', label: 'Adventure' },
                        { value: 'spectator', label: 'Spectator' },
                    ]
                },
                {
                    key: 'difficulty', label: 'Difficulty', type: 'select', options: [
                        { value: 'peaceful', label: 'Peaceful' },
                        { value: 'easy', label: 'Easy' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'hard', label: 'Hard' },
                    ]
                },
                { key: 'hardcore', label: 'Hardcore Mode', type: 'boolean', description: 'Players are banned on death' },
                { key: 'pvp', label: 'PvP', type: 'boolean', description: 'Allow players to damage each other' },
                { key: 'allow-flight', label: 'Allow Flight', type: 'boolean', description: 'Allow players to fly in survival mode' },
                { key: 'force-gamemode', label: 'Force Gamemode', type: 'boolean', description: 'Force default gamemode on join' },
            ]
        },
        {
            id: 'world',
            name: 'World',
            icon: Globe,
            settings: [
                { key: 'level-name', label: 'World Name', type: 'text', requiresRestart: true },
                { key: 'level-seed', label: 'World Seed', type: 'text', requiresRestart: true },
                {
                    key: 'level-type', label: 'World Type', type: 'select', options: [
                        { value: 'minecraft:normal', label: 'Normal' },
                        { value: 'minecraft:flat', label: 'Flat' },
                        { value: 'minecraft:large_biomes', label: 'Large Biomes' },
                        { value: 'minecraft:amplified', label: 'Amplified' },
                    ], requiresRestart: true
                },
                { key: 'spawn-protection', label: 'Spawn Protection Radius', type: 'number', min: 0, max: 100 },
                { key: 'view-distance', label: 'View Distance', type: 'number', min: 2, max: 32 },
                { key: 'simulation-distance', label: 'Simulation Distance', type: 'number', min: 2, max: 32 },
            ]
        },
        {
            id: 'performance',
            name: 'Performance',
            icon: Zap,
            settings: [
                { key: 'max-tick-time', label: 'Max Tick Time (ms)', type: 'number', min: -1, max: 60000, description: '-1 disables watchdog' },
                { key: 'network-compression-threshold', label: 'Network Compression Threshold', type: 'number', min: -1, max: 1024 },
                { key: 'entity-broadcast-range-percentage', label: 'Entity Broadcast Range %', type: 'number', min: 10, max: 1000 },
            ]
        },
        {
            id: 'startup',
            name: 'Startup',
            icon: Terminal,
            settings: [
                { key: 'STARTUP', label: 'Startup Command', type: 'text', description: 'Java startup command with arguments', requiresRestart: true },
                { key: 'MEMORY', label: 'Memory (MB)', type: 'number', description: 'Server memory allocation', requiresRestart: true },
            ]
        }
    ]

    // Fetch settings
    useEffect(() => {
        async function fetchSettings() {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/servers/${serverId}/settings`)
                if (response.ok) {
                    const data = await response.json()
                    setSettings(data.settings || {})
                    setOriginalSettings(data.settings || {})
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [serverId])

    // Check for changes
    useEffect(() => {
        const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
        setHasChanges(changed)
    }, [settings, originalSettings])

    // Update setting
    const updateSetting = (key: string, value: string | number | boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    // Save settings
    const saveSettings = async () => {
        setIsSaving(true)
        try {
            await fetch(`/api/servers/${serverId}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })
            setOriginalSettings(settings)
            setHasChanges(false)
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Toggle group
    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        )
    }

    // Render setting input
    const renderInput = (setting: Setting) => {
        const value = settings[setting.key] ?? setting.default ?? ''

        switch (setting.type) {
            case 'boolean':
                return (
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(e) => updateSetting(setting.key, e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                )

            case 'select':
                return (
                    <select
                        value={value as string}
                        onChange={(e) => updateSetting(setting.key, e.target.value)}
                        className="input w-full max-w-xs"
                    >
                        {setting.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )

            case 'number':
                return (
                    <input
                        type="number"
                        value={value as number}
                        onChange={(e) => updateSetting(setting.key, parseInt(e.target.value) || 0)}
                        min={setting.min}
                        max={setting.max}
                        className="input w-32"
                    />
                )

            case 'textarea':
                return (
                    <textarea
                        value={value as string}
                        onChange={(e) => updateSetting(setting.key, e.target.value)}
                        className="input w-full"
                        rows={3}
                    />
                )

            default:
                return (
                    <input
                        type="text"
                        value={value as string}
                        onChange={(e) => updateSetting(setting.key, e.target.value)}
                        className="input w-full max-w-md"
                    />
                )
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div>
                    <h2 className="text-lg font-semibold">Server Settings</h2>
                    <p className="text-sm text-gray-500">Configure your Minecraft server</p>
                </div>
                <div className="flex items-center gap-3">
                    {hasChanges && (
                        <span className="text-sm text-yellow-400 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Unsaved changes
                        </span>
                    )}
                    <button
                        onClick={saveSettings}
                        disabled={isSaving || !hasChanges}
                        className="btn btn-primary"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Settings Groups */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {settingsGroups.map((group) => (
                    <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card overflow-hidden"
                    >
                        <button
                            onClick={() => toggleGroup(group.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                    <group.icon className="w-5 h-5 text-cyan-400" />
                                </div>
                                <span className="font-medium">{group.name}</span>
                            </div>
                            {expandedGroups.includes(group.id) ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>

                        {expandedGroups.includes(group.id) && (
                            <div className="border-t border-white/5 p-4 space-y-6">
                                {group.settings.map((setting) => (
                                    <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <label className="block font-medium mb-1 flex items-center gap-2">
                                                {setting.label}
                                                {setting.requiresRestart && (
                                                    <span className="text-xs text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                                                        Restart required
                                                    </span>
                                                )}
                                            </label>
                                            {setting.description && (
                                                <p className="text-sm text-gray-500">{setting.description}</p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            {renderInput(setting)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
