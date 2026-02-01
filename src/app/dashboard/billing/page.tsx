'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    CreditCard,
    Receipt,
    Download,
    ChevronRight,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    Server,
    Calendar,
    AlertCircle
} from 'lucide-react'

interface Payment {
    id: string
    orderId: string
    amount: number
    currency: string
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
    serverName: string | null
    planName: string
    createdAt: string
}

interface Subscription {
    id: string
    server: {
        id: string
        name: string
        identifier: string
    }
    plan: {
        name: string
        price: number
    }
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
    startDate: string
    endDate: string
    autoRenew: boolean
}

export default function BillingPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [payments, setPayments] = useState<Payment[]>([])
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments'>('subscriptions')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        async function fetchBillingData() {
            try {
                const [paymentsRes, subscriptionsRes] = await Promise.all([
                    fetch('/api/billing/payments'),
                    fetch('/api/billing/subscriptions')
                ])

                if (paymentsRes.ok) {
                    const data = await paymentsRes.json()
                    setPayments(data.payments || [])
                }

                if (subscriptionsRes.ok) {
                    const data = await subscriptionsRes.json()
                    setSubscriptions(data.subscriptions || [])
                }
            } catch (error) {
                console.error('Failed to fetch billing data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (session) {
            fetchBillingData()
        }
    }, [session])

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS':
            case 'ACTIVE':
                return <CheckCircle className="w-4 h-4 text-green-400" />
            case 'FAILED':
            case 'CANCELLED':
            case 'EXPIRED':
                return <XCircle className="w-4 h-4 text-red-400" />
            case 'PENDING':
                return <Clock className="w-4 h-4 text-yellow-400" />
            default:
                return <AlertCircle className="w-4 h-4 text-gray-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS':
            case 'ACTIVE':
                return 'badge-success'
            case 'FAILED':
            case 'CANCELLED':
            case 'EXPIRED':
                return 'badge-error'
            case 'PENDING':
                return 'badge-warning'
            default:
                return 'badge-info'
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
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
            <div>
                <h1 className="text-2xl font-bold">Billing & Payments</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Manage your subscriptions and view payment history
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Active Subscriptions</p>
                            <p className="text-2xl font-bold">
                                {subscriptions.filter(s => s.status === 'ACTIVE').length}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Spent</p>
                            <p className="text-2xl font-bold">
                                ₹{payments.filter(p => p.status === 'SUCCESS').reduce((acc, p) => acc + p.amount, 0)}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Server className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Servers</p>
                            <p className="text-2xl font-bold">{subscriptions.length}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-[#0a0a0a] rounded-xl border border-white/5 inline-flex">
                <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'subscriptions'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Subscriptions
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'payments'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Payment History
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="card p-6">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="skeleton w-10 h-10 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-4 w-1/3" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'subscriptions' ? (
                <div className="card overflow-hidden">
                    {subscriptions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h3 className="font-semibold mb-2">No active subscriptions</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Create a server to start your subscription.
                            </p>
                            <Link href="/dashboard/create" className="btn btn-primary">
                                <Plus className="w-4 h-4" />
                                Create Server
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {subscriptions.map((subscription) => (
                                <div key={subscription.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center">
                                            <Server className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">{subscription.server.name}</h3>
                                                <span className={`badge ${getStatusColor(subscription.status)}`}>
                                                    {subscription.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {subscription.plan.name} • ₹{subscription.plan.price}/month
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm">Renews {formatDate(subscription.endDate)}</p>
                                            <p className="text-xs text-gray-500">
                                                Auto-renew: {subscription.autoRenew ? 'On' : 'Off'}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/dashboard/server/${subscription.server.identifier}`}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            Manage
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="card overflow-hidden">
                    {payments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-500/10 flex items-center justify-center mx-auto mb-4">
                                <Receipt className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold mb-2">No payments yet</h3>
                            <p className="text-sm text-gray-500">
                                Your payment history will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Order ID</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Server</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Amount</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Date</th>
                                        <th className="text-right p-4 text-sm font-medium text-gray-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-white/[0.02]">
                                            <td className="p-4 font-mono text-sm">{payment.orderId}</td>
                                            <td className="p-4">{payment.serverName || '-'}</td>
                                            <td className="p-4">
                                                <span className="font-medium">₹{payment.amount}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`badge ${getStatusColor(payment.status)} flex items-center gap-1 w-fit`}>
                                                    {getStatusIcon(payment.status)}
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-400">{formatDate(payment.createdAt)}</td>
                                            <td className="p-4 text-right">
                                                {payment.status === 'SUCCESS' && (
                                                    <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-auto">
                                                        <Download className="w-4 h-4" />
                                                        Invoice
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
