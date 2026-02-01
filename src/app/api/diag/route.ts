import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pterodactyl } from '@/lib/pterodactyl'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Only allow authenticated users to see diagnostics (or check for admin if you have that role)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [nodes, nests] = await Promise.all([
            pterodactyl.listNodes(),
            pterodactyl.listNests()
        ])

        const diag = {
            nodes: nodes.data.map(n => ({ id: n.attributes.id, name: n.attributes.name })),
            nests: nests.data.map(n => ({ id: n.attributes.id, name: n.attributes.name })),
            config: {
                PTERODACTYL_URL: process.env.PTERODACTYL_URL,
                // Mask keys
                HAS_API_KEY: !!process.env.PTERODACTYL_API_KEY,
                HAS_CLIENT_KEY: !!process.env.PTERODACTYL_CLIENT_KEY
            }
        }

        return NextResponse.json(diag)
    } catch (error) {
        console.error('Diagnostic error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
