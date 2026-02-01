import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/billing/payments - Get user's payment history
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const payments = await prisma.payment.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        })

        return NextResponse.json({
            payments: payments.map(payment => ({
                id: payment.id,
                orderId: payment.orderId,
                amount: Number(payment.amount),
                currency: payment.currency,
                status: payment.status,
                serverName: payment.serverName,
                planName: payment.planId,
                createdAt: payment.createdAt.toISOString()
            }))
        })
    } catch (error) {
        console.error('Failed to fetch payments:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payment history' },
            { status: 500 }
        )
    }
}
