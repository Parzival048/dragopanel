import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/servers/[id]/plugins - List installed plugins
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

        // List files in /plugins directory
        try {
            const files = await pterodactyl.listFiles(serverId, '/plugins')
            const plugins = files.data
                .filter((f: { attributes: { is_file: boolean; name: string } }) =>
                    f.attributes.is_file && f.attributes.name.endsWith('.jar')
                )
                .map((f: { attributes: { name: string } }) => ({
                    name: f.attributes.name.replace('.jar', ''),
                    file: f.attributes.name,
                    version: extractVersion(f.attributes.name)
                }))

            return NextResponse.json({ plugins })
        } catch {
            // Plugins folder might not exist
            return NextResponse.json({ plugins: [] })
        }
    } catch (error) {
        console.error('Failed to list plugins:', error)
        return NextResponse.json({ error: 'Failed to list plugins' }, { status: 500 })
    }
}

// Extract version from plugin filename
function extractVersion(filename: string): string | null {
    const match = filename.match(/-(\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?)/i)
    return match ? match[1] : null
}
