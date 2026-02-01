'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Server,
    ChevronRight,
    ChevronLeft,
    Check,
    Cpu,
    HardDrive,
    Database,
    Wifi,
    Shield,
    Loader2,
    CreditCard,
    Zap,
    Star
} from 'lucide-react'

interface Plan {
    id: string
    name: string
    slug: string
    description: string
    price: number
    memory: number
    disk: number
    cpu: number
    databases: number
    backups: number
    allocations: number
    isPopular: boolean
    features: string[]
}

interface Egg {
    id: number
    name: string
    description: string
    dockerImages: Record<string, string>
}

type Step = 'plan' | 'egg' | 'config' | 'payment'

export default function CreateServerPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [currentStep, setCurrentStep] = useState<Step>('plan')
    const [plans, setPlans] = useState<Plan[]>([])
    const [eggs, setEggs] = useState<Egg[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    // Form state
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null)
    const [serverName, setServerName] = useState('')
    const [selectedVersion, setSelectedVersion] = useState('')

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    // Fetch plans and eggs
    useEffect(() => {
        async function fetchData() {
            try {
                const [plansRes, eggsRes] = await Promise.all([
                    fetch('/api/plans'),
                    fetch('/api/eggs')
                ])

                if (plansRes.ok) {
                    const plansData = await plansRes.json()
                    setPlans(plansData.plans)
                }

                if (eggsRes.ok) {
                    const eggsData = await eggsRes.json()
                    setEggs(eggsData.eggs)
                }
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (session) {
            fetchData()
        }
    }, [session])

    const steps: { id: Step; name: string }[] = [
        { id: 'plan', name: 'Select Plan' },
        { id: 'egg', name: 'Server Type' },
        { id: 'config', name: 'Configuration' },
        { id: 'payment', name: 'Payment' },
    ]

    const getStepIndex = (step: Step) => steps.findIndex(s => s.id === step)

    const canProceed = () => {
        switch (currentStep) {
            case 'plan': return selectedPlan !== null
            case 'egg': return selectedEgg !== null
            case 'config': return serverName.trim().length >= 3
            case 'payment': return true
            default: return false
        }
    }

    const handleNext = () => {
        const currentIndex = getStepIndex(currentStep)
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1].id)
        }
    }

    const handleBack = () => {
        const currentIndex = getStepIndex(currentStep)
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1].id)
        }
    }

    const handleCreateServer = async () => {
        if (!selectedPlan || !selectedEgg || !serverName.trim()) return

        setIsCreating(true)
        try {
            // Check if it's a free plan (price = 0)
            if (selectedPlan.price === 0) {
                // Create free server directly without payment
                const freeServerRes = await fetch('/api/servers/free', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serverName: serverName.trim(),
                        eggId: selectedEgg.id,
                        version: selectedVersion
                    })
                })

                const freeServerData = await freeServerRes.json()

                if (!freeServerRes.ok) {
                    alert(freeServerData.error || 'Failed to create free server')
                    setIsCreating(false)
                    return
                }

                // Redirect to the new server
                router.push(`/dashboard/servers/${freeServerData.server.id}`)
                return
            }

            // Create payment order for paid plans
            const paymentRes = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPlan.id,
                    serverName: serverName.trim(),
                    eggId: selectedEgg.id,
                    version: selectedVersion
                })
            })

            if (!paymentRes.ok) {
                throw new Error('Failed to create payment order')
            }

            const paymentData = await paymentRes.json()
            const { paymentSessionId, mode, paymentUrl } = paymentData

            // Initialize and trigger Cashfree SDK for professional integration
            if ((window as unknown as { Cashfree?: (config: { mode: string }) => { checkout: (options: { paymentSessionId: string; redirectTarget: string }) => void } }).Cashfree) {
                const cashfree = (window as unknown as { Cashfree: (config: { mode: string }) => { checkout: (options: { paymentSessionId: string; redirectTarget: string }) => void } }).Cashfree({
                    mode: mode // 'sandbox' or 'production'
                });

                cashfree.checkout({
                    paymentSessionId: paymentSessionId,
                    redirectTarget: "_self" // Opens in current window for best flow
                });
            } else {
                // Fallback to direct redirect if SDK script failed to load
                window.location.href = paymentUrl
            }
        } catch (error) {
            console.error('Failed to create server:', error)
            setIsCreating(false)
        }
    }

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner-lg" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Create New Server</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Set up your Minecraft server in just a few steps
                </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const currentIndex = getStepIndex(currentStep)
                    const isCompleted = index < currentIndex
                    const isCurrent = index === currentIndex

                    return (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center gap-3 ${index < steps.length - 1 ? 'flex-1' : ''
                                }`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${isCompleted
                                    ? 'bg-cyan-500 text-white'
                                    : isCurrent
                                        ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500'
                                        : 'bg-white/5 text-gray-500 border border-white/10'
                                    }`}>
                                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                                </div>
                                <span className={`text-sm font-medium hidden sm:block ${isCurrent ? 'text-white' : 'text-gray-500'
                                    }`}>
                                    {step.name}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`hidden sm:block w-12 lg:w-24 h-0.5 mx-4 ${isCompleted ? 'bg-cyan-500' : 'bg-white/10'
                                    }`} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Plan Selection */}
                    {currentStep === 'plan' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan)}
                                        className={`relative card p-5 cursor-pointer transition-all ${selectedPlan?.id === plan.id
                                            ? 'border-cyan-500 glow'
                                            : 'hover:border-white/20'
                                            }`}
                                    >
                                        {plan.isPopular && (
                                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full text-xs font-semibold text-white">
                                                    <Star className="w-3 h-3" />
                                                    Popular
                                                </span>
                                            </div>
                                        )}

                                        {selectedPlan?.id === plan.id && (
                                            <div className="absolute top-3 right-3">
                                                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}

                                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                                        <div className="mt-4">
                                            <span className="text-3xl font-bold">₹{plan.price}</span>
                                            <span className="text-gray-500">/mo</span>
                                        </div>

                                        <div className="mt-4 space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Cpu className="w-4 h-4 text-cyan-400" />
                                                <span>{plan.memory / 1024} GB RAM</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="w-4 h-4 text-purple-400" />
                                                <span>{plan.disk / 1024} GB Storage</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Database className="w-4 h-4 text-orange-400" />
                                                <span>{plan.databases} Databases</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-green-400" />
                                                <span>{plan.backups} Backups</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Egg Selection */}
                    {currentStep === 'egg' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {eggs.map((egg) => (
                                    <div
                                        key={egg.id}
                                        onClick={() => setSelectedEgg(egg)}
                                        className={`relative card p-5 cursor-pointer transition-all ${selectedEgg?.id === egg.id
                                            ? 'border-cyan-500 glow'
                                            : 'hover:border-white/20'
                                            }`}
                                    >
                                        {selectedEgg?.id === egg.id && (
                                            <div className="absolute top-3 right-3">
                                                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center mb-4">
                                            <Server className="w-6 h-6 text-cyan-400" />
                                        </div>

                                        <h3 className="font-semibold">{egg.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                            {egg.description || 'Minecraft server'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Configuration */}
                    {currentStep === 'config' && (
                        <div className="card p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Server Name
                                </label>
                                <input
                                    type="text"
                                    value={serverName}
                                    onChange={(e) => setServerName(e.target.value)}
                                    className="input"
                                    placeholder="My Awesome Server"
                                    maxLength={50}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Choose a name for your server (3-50 characters)
                                </p>
                            </div>

                            {selectedEgg && selectedEgg.dockerImages && Object.keys(selectedEgg.dockerImages).length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Server Version
                                    </label>
                                    <select
                                        value={selectedVersion}
                                        onChange={(e) => setSelectedVersion(e.target.value)}
                                        className="input"
                                    >
                                        <option value="">Select a version</option>
                                        {Object.keys(selectedEgg.dockerImages).map((version) => (
                                            <option key={version} value={version}>
                                                {version}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Configuration Summary */}
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h4 className="font-medium mb-3">Configuration Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Plan</span>
                                        <span>{selectedPlan?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Server Type</span>
                                        <span>{selectedEgg?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">RAM</span>
                                        <span>{selectedPlan && selectedPlan.memory / 1024} GB</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Storage</span>
                                        <span>{selectedPlan && selectedPlan.disk / 1024} GB NVMe</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment */}
                    {currentStep === 'payment' && (
                        <div className="card p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                <CreditCard className="w-8 h-8 text-cyan-400" />
                                <div>
                                    <h4 className="font-medium">Secure Payment via Cashfree</h4>
                                    <p className="text-sm text-gray-400">
                                        You'll be redirected to complete your payment securely
                                    </p>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-4">
                                <h4 className="font-medium">Order Summary</h4>

                                <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Server Name</span>
                                        <span>{serverName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Plan</span>
                                        <span>{selectedPlan?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Server Type</span>
                                        <span>{selectedEgg?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Period</span>
                                        <span>30 Days</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-semibold">
                                        <span>Total</span>
                                        <span className="text-cyan-400">₹{selectedPlan?.price}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                <Zap className="w-5 h-5 text-green-400 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-green-400">Instant Activation</p>
                                    <p className="text-gray-400">
                                        Your server will be ready within 60 seconds after payment
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 'plan'}
                    className="btn btn-secondary"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                {currentStep === 'payment' ? (
                    <button
                        onClick={handleCreateServer}
                        disabled={isCreating}
                        className="btn btn-primary"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Pay ₹{selectedPlan?.price}
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className="btn btn-primary"
                    >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}
