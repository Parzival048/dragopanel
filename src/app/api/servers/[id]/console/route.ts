import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers/[id]/console - Get WebSocket credentials
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

        // Get WebSocket credentials from Pterodactyl
        const credentials = await pterodactyl.getWebSocketCredentials(identifier)

        return NextResponse.json({
            socket: credentials.data.socket,
            token: credentials.data.token
        })
    } catch (error) {
        console.error('Failed to get WebSocket credentials:', error)
        return NextResponse.json(
            { error: 'Failed to get console credentials' },
            { status: 500 }
        )
    }
}

// POST /api/servers/[id]/console - Send command
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
        const { command } = body

        if (!command) {
            return NextResponse.json(
                { error: 'Command is required' },
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

        // Send command to Pterodactyl
        try {
            await pterodactyl.sendCommand(identifier, command)
        } catch (pterodactylError) {
            const detail = pterodactylError instanceof Error ? pterodactylError.message : 'Unknown error'
            console.error('Pterodactyl command error:', detail)
            return NextResponse.json(
                { error: `Pterodactyl error: ${detail}` },
                { status: 500 }
            )
        }

        // Log the command (don't fail if logging fails)
        try {
            await prisma.commandLog.create({
                data: {
                    serverId: server.id,
                    userId: session.user.id,
                    command
                }
            })
        } catch (logError) {
            console.error('Failed to log command:', logError)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to send command:', error)
        const detail = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to send command: ${detail}` },
            { status: 500 }
        )
    }
}
