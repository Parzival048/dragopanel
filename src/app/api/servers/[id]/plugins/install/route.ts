import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { modrinth } from '@/lib/modrinth'
import { pterodactyl } from '@/lib/pterodactyl'

// POST /api/servers/[id]/plugins/install - Install a plugin from Modrinth
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

        const { slug, gameVersion, loader } = await request.json()

        // Verify ownership
        const server = await prisma.server.findFirst({
            where: { identifier: serverId, userId: session.user.id }
        })

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        // Get project info from Modrinth
        const project = await modrinth.getProject(slug)

        // Get versions and find compatible one
        const versions = await modrinth.getProjectVersions(slug)
        const compatibleVersion = versions.find((v: { game_versions: string[]; loaders: string[] }) =>
            v.game_versions.includes(gameVersion) &&
            v.loaders.some((l: string) => l.toLowerCase() === loader.toLowerCase())
        )

        if (!compatibleVersion) {
            return NextResponse.json({
                error: 'No compatible version found for your server'
            }, { status: 400 })
        }

        // Find the primary jar file
        const primaryFile = compatibleVersion.files.find((f: { primary: boolean }) => f.primary) || compatibleVersion.files[0]
        if (!primaryFile) {
            return NextResponse.json({ error: 'No download file found' }, { status: 400 })
        }

        // Download the plugin to the server
        // Use Pterodactyl's file download from URL feature
        await pterodactyl.downloadFileFromUrl(
            serverId,
            primaryFile.url,
            `/plugins/${primaryFile.filename}`
        )

        return NextResponse.json({
            success: true,
            plugin: {
                name: project.title,
                version: compatibleVersion.version_number,
                file: primaryFile.filename
            }
        })
    } catch (error) {
        console.error('Failed to install plugin:', error)
        return NextResponse.json({ error: 'Failed to install plugin' }, { status: 500 })
    }
}
