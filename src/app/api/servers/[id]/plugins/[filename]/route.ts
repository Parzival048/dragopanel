import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// DELETE /api/servers/[id]/plugins/[filename] - Uninstall a plugin
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; filename: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: serverId, filename } = await params

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

        // Delete plugin file
        await pterodactyl.deleteFilesByPaths(serverId, [`/plugins/${decodeURIComponent(filename)}`])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to uninstall plugin:', error)
        return NextResponse.json({ error: 'Failed to uninstall plugin' }, { status: 500 })
    }
}
