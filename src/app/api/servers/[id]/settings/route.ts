import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers/[id]/settings - Get server settings
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: serverId } = await params

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify ownership
        const server = await prisma.server.findFirst({
            where: { identifier: serverId, userId: session.user.id }
        })

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        const settings: Record<string, string | number | boolean> = {}

        try {
            // Get server.properties
            const propertiesContent = await pterodactyl.getFileContent(serverId, '/server.properties')
            if (propertiesContent) {
                const lines = propertiesContent.split('\n')
                for (const line of lines) {
                    if (line.startsWith('#') || !line.includes('=')) continue
                    const [key, ...valueParts] = line.split('=')
                    const value = valueParts.join('=').trim()

                    // Parse boolean and number values
                    if (value === 'true') {
                        settings[key.trim()] = true
                    } else if (value === 'false') {
                        settings[key.trim()] = false
                    } else if (!isNaN(Number(value)) && value !== '') {
                        settings[key.trim()] = Number(value)
                    } else {
                        settings[key.trim()] = value
                    }
                }
            }
        } catch {
            // File might not exist
        }

        // Get startup variables from Pterodactyl (using client API)
        try {
            const serverInfo = await pterodactyl.getServerByIdentifier(serverId)
            if (serverInfo?.attributes?.container?.environment) {
                const env = serverInfo.attributes.container.environment
                settings['MEMORY'] = env.MEMORY || ''
                settings['STARTUP'] = serverInfo.attributes.container.startup_command || ''
            }
        } catch {
            // Could not get startup variables
        }

        return NextResponse.json({ settings })
    } catch (error) {
        console.error('Failed to get settings:', error)
        return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
    }
}

// POST /api/servers/[id]/settings - Update server settings
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: serverId } = await params

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { settings } = await request.json()

        // Verify ownership
        const server = await prisma.server.findFirst({
            where: { identifier: serverId, userId: session.user.id }
        })

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        // Build server.properties content
        const propertiesSettings = { ...settings }
        delete propertiesSettings['MEMORY']
        delete propertiesSettings['STARTUP']

        const propertiesContent = Object.entries(propertiesSettings)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n')

        // Write server.properties
        await pterodactyl.writeFileContent(serverId, '/server.properties', propertiesContent)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to update settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
