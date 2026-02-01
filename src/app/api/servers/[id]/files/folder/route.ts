import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// POST /api/servers/[id]/files/folder - Create folder
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

        const { path } = await request.json()
        if (!path) {
            return NextResponse.json({ error: 'Path required' }, { status: 400 })
        }

        // Verify ownership
        const server = await prisma.server.findFirst({
            where: { identifier: serverId, userId: session.user.id }
        })

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        // Create folder via Pterodactyl
        await pterodactyl.createFolderByPath(serverId, path)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to create folder:', error)
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
    }
}
