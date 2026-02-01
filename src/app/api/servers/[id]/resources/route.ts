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

        try {
            // Try to fetch live resources from Pterodactyl Client API
            const resources = await pterodactyl.getServerResources(identifier)

            return NextResponse.json({
                state: resources.attributes.current_state,
                isSuspended: resources.attributes.is_suspended,
                resources: {
                    cpu: resources.attributes.resources.cpu_absolute || 0,
                    memory: resources.attributes.resources.memory_bytes || 0,
                    disk: resources.attributes.resources.disk_bytes || 0,
                    networkRx: resources.attributes.resources.network_rx_bytes || 0,
                    networkTx: resources.attributes.resources.network_tx_bytes || 0,
                    uptime: resources.attributes.resources.uptime || 0
                }
            })
        } catch (pterodactylError) {
            // Log the error for debugging
            console.error('Pterodactyl Client API error:', pterodactylError instanceof Error ? pterodactylError.message : pterodactylError)

            // Fallback: return status from our database
            // This happens when CLIENT_KEY doesn't have access to the server
            return NextResponse.json({
                state: server.status?.toLowerCase() === 'running' ? 'running' : 'offline',
                isSuspended: false,
                resources: {
                    cpu: 0,
                    memory: 0,
                    disk: 0,
                    networkRx: 0,
                    networkTx: 0,
                    uptime: 0
                },
                _fallback: true,
                _error: 'Unable to fetch live resources. Check PTERODACTYL_CLIENT_KEY configuration.'
            })
        }
    } catch (error) {
        console.error('Failed to get resources:', error)
        const detail = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to get resources: ${detail}` },
            { status: 500 }
        )
    }
}
