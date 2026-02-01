'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    User,
    Bell,
    Shield,
    Palette,
    Key,
    Save,
    Loader2,
    Check
} from 'lucide-react'

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Settings state
    const [displayName, setDisplayName] = useState(session?.user?.name || '')
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [serverAlerts, setServerAlerts] = useState(true)
    const [billingReminders, setBillingReminders] = useState(true)

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner-lg" />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        router.push('/login')
        return null
    }

    const handleSave = async () => {
        setIsSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Manage your account preferences and notifications
                </p>
            </div>

            {/* Profile Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Profile</h2>
                        <p className="text-sm text-gray-400">Your personal information</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={session?.user?.email || ''}
                            disabled
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                </div>
            </motion.div>

            {/* Notifications Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Bell className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Notifications</h2>
                        <p className="text-sm text-gray-400">Manage your notification preferences</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {[
                        { label: 'Email Notifications', desc: 'Receive updates via email', value: emailNotifications, onChange: setEmailNotifications },
                        { label: 'Server Alerts', desc: 'Get notified about server status changes', value: serverAlerts, onChange: setServerAlerts },
                        { label: 'Billing Reminders', desc: 'Reminders for upcoming payments', value: billingReminders, onChange: setBillingReminders },
                    ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                            <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-sm text-gray-400">{item.desc}</p>
                            </div>
                            <button
                                onClick={() => item.onChange(!item.value)}
                                className={`w-12 h-6 rounded-full transition-all ${item.value ? 'bg-cyan-500' : 'bg-white/10'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${item.value ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Security Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Security</h2>
                        <p className="text-sm text-gray-400">Keep your account secure</p>
                    </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
                    <Key className="w-4 h-4" />
                    Change Password
                </button>
            </motion.div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}
