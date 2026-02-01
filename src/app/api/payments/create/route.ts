import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cashfree } from '@/lib/cashfree'
import { generateOrderId } from '@/lib/utils'

// POST /api/payments/create - Create a payment order
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { planId, serverName, eggId, version } = body

        // Validate required fields
        if (!planId || !serverName || !eggId) {
            return NextResponse.json(
                { error: 'Plan, server name, and egg are required' },
                { status: 400 }
            )
        }

        // Get the user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Get the plan (handle both database and default plans)
        let plan = await prisma.plan.findUnique({
            where: { id: planId }
        })

        // If plan not in database, use default pricing
        if (!plan) {
            const defaultPlans: Record<string, { name: string; price: number }> = {
                'starter': { name: 'Starter', price: 149 },
                'standard': { name: 'Standard', price: 299 },
                'premium': { name: 'Premium', price: 499 },
                'enterprise': { name: 'Enterprise', price: 999 }
            }

            const defaultPlan = defaultPlans[planId]
            if (!defaultPlan) {
                return NextResponse.json(
                    { error: 'Invalid plan selected' },
                    { status: 400 }
                )
            }

            // Use the default plan price
            plan = {
                id: planId,
                name: defaultPlan.name,
                price: defaultPlan.price
            } as unknown as typeof plan
        }

        // Generate order ID
        const orderId = generateOrderId()

        // Create payment record in our database
        const payment = await prisma.payment.create({
            data: {
                userId: session.user.id,
                orderId,
                amount: Number(plan!.price),
                currency: 'INR',
                status: 'PENDING',
                planId: plan!.id,
                serverName,
                metadata: {
                    eggId,
                    version: version || null
                }
            }
        })

        // Create order in Cashfree
        let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Cashfree Production API requires HTTPS for even the return_url and notify_url
        if (process.env.CASHFREE_ENV === 'production') {
            appUrl = appUrl.replace('http://', 'https://')
        }

        const cashfreeOrder = await cashfree.createOrder({
            orderId,
            orderAmount: Number(plan!.price),
            orderCurrency: 'INR',
            customerDetails: {
                customerId: session.user.id,
                customerEmail: user.email,
                customerPhone: '9999999999', // Default phone if not stored
                customerName: user.name
            },
            orderMeta: {
                returnUrl: `${appUrl}/dashboard/payment/callback?order_id=${orderId}`,
                notifyUrl: `${appUrl}/api/payments/webhook`
            },
            orderNote: `Server: ${serverName} - Plan: ${plan!.name}`,
            orderTags: {
                plan: plan!.id,
                serverName,
                eggId: String(eggId)
            }
        })

        // Update payment with Cashfree order ID
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                cashfreeOrderId: cashfreeOrder.cf_order_id
            }
        })

        // Generate payment URL
        const paymentUrl = cashfree.generateCheckoutUrl(cashfreeOrder.payment_session_id)

        return NextResponse.json({
            success: true,
            orderId,
            paymentUrl,
            paymentSessionId: cashfreeOrder.payment_session_id,
            mode: process.env.CASHFREE_ENV || 'sandbox'
        })
    } catch (error) {
        console.error('Failed to create payment:', error)
        return NextResponse.json(
            { error: 'Failed to create payment order' },
            { status: 500 }
        )
    }
}
