import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers/[id] - Get server details
export async function GET(
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

        // Get server from our database
        const server = await prisma.server.findFirst({
            where: {
                identifier,
                userId: session.user.id,
                status: { not: 'DELETED' }
            },
            include: {
                plan: true
            }
        })

        if (!server) {
            return NextResponse.json(
                { error: 'Server not found' },
                { status: 404 }
            )
        }

        // Fetch live data from Pterodactyl
        let resources = null
        let allocation = null
        let currentStatus: string = server.status

        try {
            const resourceData = await pterodactyl.getServerResources(server.identifier)
            resources = {
                cpu: resourceData.attributes.resources.cpu_absolute,
                memory: resourceData.attributes.resources.memory_bytes,
                disk: resourceData.attributes.resources.disk_bytes,
                networkRx: resourceData.attributes.resources.network_rx_bytes,
                networkTx: resourceData.attributes.resources.network_tx_bytes,
                uptime: resourceData.attributes.resources.uptime
            }
            currentStatus = resourceData.attributes.current_state.toUpperCase()
        } catch {
            // Failed to get resources
        }

        try {
            const allocations = await pterodactyl.listAllocations(server.identifier)
            const primaryAllocation = allocations.data.find(a => a.attributes.is_default)
            if (primaryAllocation) {
                allocation = {
                    ip: primaryAllocation.attributes.ip_alias || primaryAllocation.attributes.ip,
                    port: primaryAllocation.attributes.port
                }
            }
        } catch {
            // Failed to get allocations
        }

        return NextResponse.json({
            server: {
                id: server.id,
                name: server.name,
                identifier: server.identifier,
                uuid: server.uuid,
                status: currentStatus,
                isSuspended: server.isSuspended,
                plan: {
                    name: server.plan.name,
                    memory: server.plan.memory,
                    disk: server.plan.disk,
                    cpu: server.plan.cpu,
                    databases: server.plan.databases,
                    backups: server.plan.backups,
                    allocations: server.plan.allocations
                },
                resources,
                allocation,
                eggName: server.eggName,
                expiresAt: server.expiresAt,
                createdAt: server.createdAt
            }
        })
    } catch (error) {
        console.error('Failed to fetch server:', error)
        return NextResponse.json(
            { error: 'Failed to fetch server details' },
            { status: 500 }
        )
    }
}

// PATCH /api/servers/[id] - Update server
export async function PATCH(
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
        const { name } = body

        // Get server from our database
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

        // Update in database
        const updatedServer = await prisma.server.update({
            where: { id: server.id },
            data: { name }
        })

        return NextResponse.json({
            success: true,
            server: {
                id: updatedServer.id,
                name: updatedServer.name,
                identifier: updatedServer.identifier
            }
        })
    } catch (error) {
        console.error('Failed to update server:', error)
        return NextResponse.json(
            { error: 'Failed to update server' },
            { status: 500 }
        )
    }
}

// DELETE /api/servers/[id] - Delete server
export async function DELETE(
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

        // Get server from our database
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

        // Delete from Pterodactyl
        try {
            await pterodactyl.deleteServer(server.pterodactylId)
        } catch {
            // Continue even if Pterodactyl deletion fails
        }

        // Mark as deleted in our database
        await prisma.server.update({
            where: { id: server.id },
            data: { status: 'DELETED' }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete server:', error)
        return NextResponse.json(
            { error: 'Failed to delete server' },
            { status: 500 }
        )
    }
}
