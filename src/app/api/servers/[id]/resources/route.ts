import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers/[id]/resources - Get live server resources
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: identifier } = await params

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        // Fetch live resources from Pterodactyl
        const resources = await pterodactyl.getServerResources(identifier)

        return NextResponse.json({
            state: resources.attributes.current_state,
            isSuspended: resources.attributes.is_suspended,
            resources: {
                cpu: resources.attributes.resources.cpu_absolute,
                memory: resources.attributes.resources.memory_bytes,
                disk: resources.attributes.resources.disk_bytes,
                networkRx: resources.attributes.resources.network_rx_bytes,
                networkTx: resources.attributes.resources.network_tx_bytes,
                uptime: resources.attributes.resources.uptime
            }
        })
    } catch (error) {
        console.error('Failed to get resources:', error)
        const detail = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to get resources: ${detail}` },
            { status: 500 }
        )
    }
}
