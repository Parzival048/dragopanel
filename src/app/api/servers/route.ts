import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers - List all servers for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get servers from our database
        const servers = await prisma.server.findMany({
            where: {
                userId: session.user.id,
                status: { not: 'DELETED' }
            },
            include: {
                plan: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Fetch live resource data from Pterodactyl for each server
        const serversWithResources = await Promise.all(
            servers.map(async (server: typeof servers[number]) => {
                try {
                    const resources = await pterodactyl.getServerResources(server.identifier)
                    return {
                        id: server.id,
                        name: server.name,
                        identifier: server.identifier,
                        uuid: server.uuid,
                        status: resources.attributes.current_state.toUpperCase(),
                        isSuspended: resources.attributes.is_suspended,
                        plan: {
                            name: server.plan.name,
                            memory: server.plan.memory,
                            disk: server.plan.disk,
                            cpu: server.plan.cpu
                        },
                        resources: {
                            cpu: resources.attributes.resources.cpu_absolute,
                            memory: resources.attributes.resources.memory_bytes,
                            disk: resources.attributes.resources.disk_bytes,
                            networkRx: resources.attributes.resources.network_rx_bytes,
                            networkTx: resources.attributes.resources.network_tx_bytes,
                            uptime: resources.attributes.resources.uptime
                        },
                        expiresAt: server.expiresAt,
                        createdAt: server.createdAt
                    }
                } catch {
                    // If we can't get resources, return basic info
                    return {
                        id: server.id,
                        name: server.name,
                        identifier: server.identifier,
                        uuid: server.uuid,
                        status: server.status,
                        isSuspended: server.isSuspended,
                        plan: {
                            name: server.plan.name,
                            memory: server.plan.memory,
                            disk: server.plan.disk,
                            cpu: server.plan.cpu
                        },
                        resources: null,
                        expiresAt: server.expiresAt,
                        createdAt: server.createdAt
                    }
                }
            })
        )

        return NextResponse.json({ servers: serversWithResources })
    } catch (error) {
        console.error('Failed to fetch servers:', error)
        return NextResponse.json(
            { error: 'Failed to fetch servers' },
            { status: 500 }
        )
    }
}

// POST /api/servers - Create a new server
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
        const { name, planId, eggId, nodeId, environment } = body

        // Validate required fields
        if (!name || !planId || !eggId) {
            return NextResponse.json(
                { error: 'Name, plan, and egg are required' },
                { status: 400 }
            )
        }

        // Get the plan
        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        })

        if (!plan) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
                { status: 400 }
            )
        }

        // Find available allocation on the specified node
        const targetNodeId = nodeId || 1 // Default to node 1 if not specified
        const allocationId = await pterodactyl.findAvailableAllocation(targetNodeId)

        // Get the egg details
        const eggData = await pterodactyl.getEgg(1, eggId) // Assuming nest 1 for Minecraft

        // Create server in Pterodactyl
        const pterodactylServer = await pterodactyl.createServer({
            name,
            user: 1, // Will be updated to use Pterodactyl user ID
            egg: eggId,
            docker_image: eggData.attributes.docker_image,
            startup: eggData.attributes.startup,
            environment: environment || {},
            limits: {
                memory: plan.memory,
                swap: 0,
                disk: plan.disk,
                io: 500,
                cpu: plan.cpu
            },
            feature_limits: {
                databases: plan.databases,
                allocations: plan.allocations,
                backups: plan.backups
            },
            allocation: {
                default: allocationId
            },
            start_on_completion: true
        })

        // Calculate expiration (30 days from now)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        // Create server in our database
        const serverAttributes = pterodactylServer.attributes

        const server = await prisma.server.create({
            data: {
                name,
                pterodactylId: serverAttributes.id,
                identifier: serverAttributes.identifier,
                uuid: serverAttributes.uuid,
                userId: session.user.id,
                planId: plan.id,
                eggId,
                eggName: eggData.attributes.name,
                nodeId: targetNodeId,
                allocationId,
                status: 'INSTALLING',
                expiresAt
            },
            include: {
                plan: true
            }
        })

        return NextResponse.json({
            success: true,
            server: {
                id: server.id,
                name: server.name,
                identifier: server.identifier,
                status: server.status,
                plan: server.plan.name
            }
        })
    } catch (error) {
        console.error('Failed to create server:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create server' },
            { status: 500 }
        )
    }
}
