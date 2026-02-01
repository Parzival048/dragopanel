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

        if (!serverName || !eggId) {
            return NextResponse.json(
                { error: 'Server name and egg ID are required' },
                { status: 400 }
            )
        }

        // Ensure the free plan exists in the database (create if not)
        let freePlan = await prisma.plan.findUnique({
            where: { slug: 'free' }
        })

        if (!freePlan) {
            freePlan = await prisma.plan.create({
                data: {
                    name: 'Free',
                    slug: 'free',
                    description: 'Try out our platform for free',
                    price: 0,
                    currency: 'INR',
                    memory: 1024,
                    disk: 5120,
                    cpu: 50,
                    databases: 1,
                    backups: 1,
                    allocations: 1,
                    isPopular: false,
                    isActive: true,
                    features: ['DDoS Protection', '24/7 Uptime', 'Basic Support'],
                    sortOrder: 0
                }
            })
        }

        // Check if user already has a free server
        const existingFreeServer = await prisma.server.findFirst({
            where: {
                userId: session.user.id,
                planId: freePlan.id,
                status: { notIn: ['DELETED'] }
            }
        })

        if (existingFreeServer) {
            return NextResponse.json(
                { error: 'You already have a free server. Upgrade to create more servers.' },
                { status: 400 }
            )
        }

        // Find available allocation
        const nodeId = 1 // Default node
        let allocationId: number

        try {
            allocationId = await pterodactyl.findAvailableAllocation(nodeId)
        } catch (allocError) {
            console.error('Failed to find allocation:', allocError)
            return NextResponse.json(
                { error: 'No available server slots. Please try again later.' },
                { status: 503 }
            )
        }

        // Get egg details
        let eggData
        try {
            eggData = await pterodactyl.getEgg(1, eggId) // Nest 1 for Minecraft
        } catch (eggError) {
            console.error('Failed to get egg:', eggError)
            return NextResponse.json(
                { error: 'Invalid server type selected.' },
                { status: 400 }
            )
        }

        // Determine Pterodactyl user for server ownership
        // If PTERODACTYL_ADMIN_USER_ID is set, use it for all servers (ensures CLIENT_KEY access)
        // Otherwise, create individual user accounts
        let pterodactylUserId = 1
        const adminUserId = process.env.PTERODACTYL_ADMIN_USER_ID

        if (adminUserId && !isNaN(parseInt(adminUserId))) {
            // Use the admin user for all servers - ensures CLIENT_KEY can access them
            pterodactylUserId = parseInt(adminUserId)
            console.log('Using admin user for server creation:', pterodactylUserId)
        } else {
            // Legacy behavior: create individual Pterodactyl users
            try {
                const searchResponse = await pterodactyl.getUserByEmail(session.user.email!)
                if (searchResponse.data && searchResponse.data.length > 0) {
                    pterodactylUserId = searchResponse.data[0].attributes.id
                } else {
                    // Create user in Pterodactyl if not found
                    const newUser = await pterodactyl.createUser({
                        email: session.user.email!,
                        username: session.user.email!.split('@')[0] + Math.random().toString(36).substring(2, 7),
                        first_name: session.user.name?.split(' ')[0] || 'User',
                        last_name: session.user.name?.split(' ').slice(1).join(' ') || 'Player',
                    })
                    pterodactylUserId = newUser.attributes.id
                }
            } catch (e) {
                console.error('Failed to find/create Pterodactyl user:', e)
                return NextResponse.json(
                    { error: 'Failed to set up user account. Please try again.' },
                    { status: 500 }
                )
            }
        }

        // Create environment object with default values from egg variables
        const environment: Record<string, string> = {}
        if (eggData.attributes.relationships?.variables?.data) {
            eggData.attributes.relationships.variables.data.forEach((variable: any) => {
                environment[variable.attributes.env_variable] = variable.attributes.default_value || ''
            })
        }

        // Apply specific overrides
        environment['SERVER_JARFILE'] = 'server.jar'
        if (version) {
            environment['VERSION'] = version
        }
        // Common Minecraft variables usually named BUILD_NUMBER or DL_VERSION
        if (environment['BUILD_NUMBER'] === '' || !environment['BUILD_NUMBER']) {
            environment['BUILD_NUMBER'] = 'latest'
        }

        // Create server on Pterodactyl
        let pterodactylServer
        try {
            pterodactylServer = await pterodactyl.createServer({
                name: serverName,
                user: pterodactylUserId,
                egg: eggId,
                docker_image: eggData.attributes.docker_image,
                startup: eggData.attributes.startup,
                environment,
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
        } catch (serverError) {
            console.error('Failed to create Pterodactyl server:', serverError)
            const detail = serverError instanceof Error ? serverError.message : 'Unknown provisioning error'
            return NextResponse.json(
                { error: `Failed to provision server: ${detail}` },
                { status: 500 }
            )
        }

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
                planId: freePlan.id,
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
