import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers/[id]/files - List files in a directory
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

        const path = request.nextUrl.searchParams.get('path') || '/'

        // Verify ownership
        const server = await prisma.server.findFirst({
            where: { identifier: serverId, userId: session.user.id }
        })

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        // Fetch files from Pterodactyl
        const files = await pterodactyl.listFiles(serverId, path)

        return NextResponse.json({
            files: files.data.map((f: { attributes: Record<string, unknown> }) => f.attributes)
        })
    } catch (error) {
        console.error('Failed to list files:', error)
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
    }
}

// DELETE /api/servers/[id]/files - Delete files
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: serverId } = await params

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { paths } = await request.json()

        // Verify ownership
        const server = await prisma.server.findFirst({
            where: { identifier: serverId, userId: session.user.id }
        })

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        // Delete files via Pterodactyl
        await pterodactyl.deleteFilesByPaths(serverId, paths)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete files:', error)
        return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 })
    }
}
