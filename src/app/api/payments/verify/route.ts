import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cashfree } from '@/lib/cashfree'

// GET /api/payments/verify - Verify payment status
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const orderId = request.nextUrl.searchParams.get('order_id')

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            )
        }

        // Get payment from database
        const payment = await prisma.payment.findUnique({
            where: { orderId },
            include: {
                user: true
            }
        })

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            )
        }

        // Verify ownership
        if (payment.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // If payment is still pending, check with Cashfree
        if (payment.status === 'PENDING') {
            try {
                const verification = await cashfree.verifyPayment(orderId)

                if (verification.isSuccessful && verification.payment) {
                    // Update payment status
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'SUCCESS',
                            cashfreePaymentId: verification.payment.cf_payment_id,
                            paymentMethod: JSON.stringify(verification.payment.payment_method),
                            paymentTime: verification.payment.payment_time
                                ? new Date(verification.payment.payment_time)
                                : new Date()
                        }
                    })

                    payment.status = 'SUCCESS' as typeof payment.status
                }
            } catch (verifyError) {
                console.error('Payment verification failed:', verifyError)
            }
        }

        // Get associated server if exists
        let server = null
        if (payment.status === 'SUCCESS') {
            const subscription = await prisma.subscription.findFirst({
                where: { paymentId: payment.id }
            })

            if (subscription?.serverId) {
                const serverData = await prisma.server.findUnique({
                    where: { id: subscription.serverId }
                })
                if (serverData) {
                    server = {
                        id: serverData.id,
                        name: serverData.name,
                        identifier: serverData.identifier,
                        status: serverData.status
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            payment: {
                orderId: payment.orderId,
                status: payment.status,
                amount: Number(payment.amount),
                currency: payment.currency,
                createdAt: payment.createdAt
            },
            server
        })
    } catch (error) {
        console.error('Payment verification failed:', error)
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        )
    }
}
