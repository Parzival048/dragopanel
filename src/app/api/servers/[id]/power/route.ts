import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// POST /api/servers/[id]/power - Send power action
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: identifier } = await params

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { action } = body

        if (!['start', 'stop', 'restart', 'kill'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid power action' },
                { status: 400 }
            )
        }

        // Verify server ownership
        const server = await prisma.server.findFirst({
            where: {
                identifier,
                userId: session.user.id,
                status: { not: 'DELETED' }
            }
        })

        if (!server) {
            return NextResponse.json(
                { error: 'Server not found' },
                { status: 404 }
            )
        }

        // Send power action to Pterodactyl
        await pterodactyl.sendPowerAction(identifier, action)

        return NextResponse.json({ success: true, action })
    } catch (error) {
        console.error('Power action failed:', error)
        return NextResponse.json(
            { error: 'Failed to send power action' },
            { status: 500 }
        )
    }
}
