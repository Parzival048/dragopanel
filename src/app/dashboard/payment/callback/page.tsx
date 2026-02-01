'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Server, ArrowRight } from 'lucide-react'

function PaymentCallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
    const [serverIdentifier, setServerIdentifier] = useState<string | null>(null)

    useEffect(() => {
        const orderId = searchParams.get('order_id')

        if (!orderId) {
            setStatus('failed')
            return
        }

        async function verifyPayment() {
            try {
                const response = await fetch(`/api/payments/verify?order_id=${orderId}`)
                const data = await response.json()

                if (data.success && data.payment?.status === 'SUCCESS') {
                    setStatus('success')
                    if (data.server?.identifier) {
                        setServerIdentifier(data.server.identifier)
                    }
                } else {
                    setStatus('failed')
                }
            } catch {
                setStatus('failed')
            }
        }

        // Wait a moment for webhook to process
        setTimeout(verifyPayment, 2000)
    }, [searchParams])

    if (status === 'loading') {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
                    <p className="text-gray-400">Please wait while we confirm your payment</p>
                </div>
            </div>
        )
    }

    if (status === 'failed') {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card p-8 max-w-md text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
                    <p className="text-gray-400 mb-6">
                        Your payment could not be processed. Please try again or contact support.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard/create" className="btn btn-primary">
                            Try Again
                        </Link>
                        <Link href="/dashboard" className="btn btn-secondary">
                            Go to Dashboard
                        </Link>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-8 max-w-md text-center"
            >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-gray-400 mb-6">
                    Your server is being set up and will be ready in a few moments.
                </p>

                <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-6">
                    <Server className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Server is installing...</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {serverIdentifier ? (
                        <Link
                            href={`/dashboard/server/${serverIdentifier}`}
                            className="btn btn-primary"
                        >
                            View Server
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <Link href="/dashboard" className="btn btn-primary">
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Loading...</h2>
                </div>
            </div>
        }>
            <PaymentCallbackContent />
        </Suspense>
    )
}
