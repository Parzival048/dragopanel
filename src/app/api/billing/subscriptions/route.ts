import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/billing/subscriptions - Get user's subscriptions
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                plan: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Fetch server data for each subscription if serverId exists
        const subscriptionsWithServers = await Promise.all(
            subscriptions.map(async (sub: typeof subscriptions[number]) => {
                let serverData = null
                if (sub.serverId) {
                    const server = await prisma.server.findUnique({
                        where: { id: sub.serverId },
                        select: { id: true, name: true, identifier: true }
                    })
                    serverData = server
                }
                return {
                    id: sub.id,
                    server: serverData,
                    plan: sub.plan ? {
                        name: sub.plan.name,
                        price: Number(sub.plan.price)
                    } : { name: 'Unknown', price: 0 },
                    status: sub.status,
                    startDate: sub.startDate.toISOString(),
                    endDate: sub.endDate.toISOString(),
                    autoRenew: sub.autoRenew
                }
            })
        )

        return NextResponse.json({
            subscriptions: subscriptionsWithServers
        })
    } catch (error) {
        console.error('Failed to fetch subscriptions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch subscriptions' },
            { status: 500 }
        )
    }
}
