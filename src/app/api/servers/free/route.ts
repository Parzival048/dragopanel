import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// POST /api/servers/free - Create a free server (no payment required)
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
        const { serverName, eggId, version } = body

        // Check if user already has a free server
        const existingFreeServer = await prisma.server.findFirst({
            where: {
                userId: session.user.id,
                planId: 'free',
                status: { notIn: ['DELETED'] }
            }
        })

        if (existingFreeServer) {
            return NextResponse.json(
                { error: 'You already have a free server. Upgrade to create more servers.' },
                { status: 400 }
            )
        }

        // Free plan configuration
        const freePlan = {
            id: 'free',
            memory: 1024,
            disk: 5120,
            cpu: 50,
            databases: 1,
            backups: 1,
            allocations: 1
        }

        // Find available allocation
        const nodeId = 1 // Default node
        const allocationId = await pterodactyl.findAvailableAllocation(nodeId)

        // Get egg details
        const eggData = await pterodactyl.getEgg(1, eggId) // Nest 1 for Minecraft

        // Get or create Pterodactyl user
        let pterodactylUserId = 1
        try {
            const searchResponse = await pterodactyl.getUserByEmail(session.user.email!)
            if (searchResponse.data && searchResponse.data.length > 0) {
                pterodactylUserId = searchResponse.data[0].attributes.id
            }
        } catch (e) {
            console.error('Failed to find Pterodactyl user:', e)
        }

        // Create server on Pterodactyl
        const pterodactylServer = await pterodactyl.createServer({
            name: serverName,
            user: pterodactylUserId,
            egg: eggId,
            docker_image: eggData.attributes.docker_image,
            startup: eggData.attributes.startup,
            environment: {
                SERVER_JARFILE: 'server.jar',
                VERSION: version || 'latest',
                BUILD_TYPE: 'recommended'
            },
            limits: {
                memory: freePlan.memory,
                swap: 0,
                disk: freePlan.disk,
                io: 500,
                cpu: freePlan.cpu
            },
            feature_limits: {
                databases: freePlan.databases,
                allocations: freePlan.allocations,
                backups: freePlan.backups
            },
            allocation: {
                default: allocationId
            },
            start_on_completion: true
        })

        const serverAttributes = pterodactylServer.attributes

        // Calculate expiration (30 days for free servers)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        // Create server in database
        const server = await prisma.server.create({
            data: {
                name: serverName,
                pterodactylId: serverAttributes.id,
                identifier: serverAttributes.identifier,
                uuid: serverAttributes.uuid,
                userId: session.user.id,
                planId: 'free',
                eggId,
                eggName: eggData.attributes.name,
                nodeId,
                allocationId,
                status: 'INSTALLING',
                expiresAt
            }
        })

        return NextResponse.json({
            success: true,
            server: {
                id: server.id,
                name: server.name,
                identifier: server.identifier,
                status: server.status
            }
        })
    } catch (error) {
        console.error('Failed to create free server:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: 'Failed to create server', details: errorMessage },
            { status: 500 }
        )
    }
}
