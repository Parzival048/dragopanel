import { NextRequest, NextResponse } from 'next/server'
import { modrinth } from '@/lib/modrinth'

// GET /api/modrinth/search - Search plugins on Modrinth
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('query') || ''
        const sortBy = searchParams.get('sortBy') || 'relevance'
        const gameVersion = searchParams.get('gameVersion') || '1.20.4'
        const loader = searchParams.get('loader') || 'paper'

        const result = await modrinth.searchPlugins({
            query,
            index: sortBy as 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated',
            gameVersions: [gameVersion],
            loaders: [loader],
            limit: 20
        })

        return NextResponse.json({
            plugins: result.hits.map((hit: typeof result.hits[number]) => ({
                slug: hit.slug,
                title: hit.title,
                description: hit.description,
                categories: hit.categories,
                client_side: hit.client_side,
                server_side: hit.server_side,
                downloads: hit.downloads,
                follows: hit.follows,
                icon_url: hit.icon_url,
                project_type: hit.project_type,
                versions: hit.versions,
                latest_version: hit.latest_version,
            })),
            total: result.total_hits,
            offset: result.offset,
            limit: result.limit
        })
    } catch (error) {
        console.error('Modrinth search failed:', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
