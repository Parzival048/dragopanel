import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers/[id]/files/content - Get file content
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

        const path = request.nextUrl.searchParams.get('path')
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

        // Fetch file content from Pterodactyl
        const content = await pterodactyl.getFileContent(serverId, path)

        return NextResponse.json({ content })
    } catch (error) {
        console.error('Failed to get file content:', error)
        return NextResponse.json({ error: 'Failed to get file content' }, { status: 500 })
    }
}

// POST /api/servers/[id]/files/content - Write file content
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

        const { path, content } = await request.json()
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

        // Write file content via Pterodactyl
        await pterodactyl.writeFileContent(serverId, path, content)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to write file content:', error)
        return NextResponse.json({ error: 'Failed to write file content' }, { status: 500 })
    }
}
