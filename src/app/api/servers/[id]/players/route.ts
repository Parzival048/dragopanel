import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers/[id]/players - Get player lists
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

        // Parse player data from server files
        const players = {
            online: [] as { uuid: string; name: string; isOp: boolean; isOnline: boolean }[],
            whitelist: [] as { uuid: string; name: string; isOp: boolean; isOnline: boolean }[],
            banned: [] as { uuid: string; name: string; isOp: boolean; isOnline: boolean }[],
            ops: [] as { uuid: string; name: string; isOp: boolean; isOnline: boolean }[]
        }

        try {
            // Try to get whitelist
            const whitelistContent = await pterodactyl.getFileContent(serverId, '/whitelist.json')
            if (whitelistContent) {
                const whitelist = JSON.parse(whitelistContent)
                players.whitelist = whitelist.map((p: { uuid: string; name: string }) => ({
                    uuid: p.uuid,
                    name: p.name,
                    isOp: false,
                    isOnline: false
                }))
            }
        } catch {
            // File might not exist
        }

        try {
            // Try to get banned players
            const bannedContent = await pterodactyl.getFileContent(serverId, '/banned-players.json')
            if (bannedContent) {
                const banned = JSON.parse(bannedContent)
                players.banned = banned.map((p: { uuid: string; name: string }) => ({
                    uuid: p.uuid,
                    name: p.name,
                    isOp: false,
                    isOnline: false
                }))
            }
        } catch {
            // File might not exist
        }

        try {
            // Try to get ops
            const opsContent = await pterodactyl.getFileContent(serverId, '/ops.json')
            if (opsContent) {
                const ops = JSON.parse(opsContent)
                players.ops = ops.map((p: { uuid: string; name: string }) => ({
                    uuid: p.uuid,
                    name: p.name,
                    isOp: true,
                    isOnline: false
                }))
            }
        } catch {
            // File might not exist
        }

        return NextResponse.json(players)
    } catch (error) {
        console.error('Failed to get players:', error)
        return NextResponse.json({ error: 'Failed to get players' }, { status: 500 })
    }
}
