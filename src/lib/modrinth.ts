// Modrinth API Client
// Handles plugin search and download operations

const MODRINTH_API_URL = process.env.MODRINTH_API_URL || 'https://api.modrinth.com/v2'

interface ModrinthProject {
    slug: string
    title: string
    description: string
    categories: string[]
    client_side: 'required' | 'optional' | 'unsupported'
    server_side: 'required' | 'optional' | 'unsupported'
    body: string
    status: string
    license: {
        id: string
        name: string
        url: string | null
    }
    downloads: number
    followers: number
    id: string
    project_type: 'mod' | 'modpack' | 'resourcepack' | 'shader' | 'plugin' | 'datapack'
    team: string
    published: string
    updated: string
    versions: string[]
    icon_url: string | null
    gallery: Array<{
        url: string
        featured: boolean
        title: string | null
        description: string | null
        created: string
        ordering: number
    }>
    featured_gallery: string | null
    color: number | null
}

interface ModrinthVersion {
    id: string
    project_id: string
    author_id: string
    featured: boolean
    name: string
    version_number: string
    changelog: string
    changelog_url: string | null
    date_published: string
    downloads: number
    version_type: 'release' | 'beta' | 'alpha'
    status: string
    files: Array<{
        hashes: {
            sha512: string
            sha1: string
        }
        url: string
        filename: string
        primary: boolean
        size: number
        file_type: string | null
    }>
    dependencies: Array<{
        version_id: string | null
        project_id: string | null
        file_name: string | null
        dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
    }>
    game_versions: string[]
    loaders: string[]
}

interface SearchResult {
    hits: Array<{
        slug: string
        title: string
        description: string
        categories: string[]
        client_side: string
        server_side: string
        project_type: string
        downloads: number
        icon_url: string | null
        color: number | null
        project_id: string
        author: string
        display_categories: string[]
        versions: string[]
        follows: number
        date_created: string
        date_modified: string
        latest_version: string
        license: string
        gallery: string[]
        featured_gallery: string | null
    }>
    offset: number
    limit: number
    total_hits: number
}

class ModrinthAPI {
    private baseUrl: string

    constructor() {
        this.baseUrl = MODRINTH_API_URL
    }

    private async request<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Dragohost/1.0.0 (contact@dragohost.com)',
            },
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.description || `Modrinth API Error: ${response.status}`)
        }

        return response.json()
    }

    // ========================
    // SEARCH
    // ========================

    async searchPlugins(params: {
        query?: string
        facets?: string[][]
        index?: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated'
        offset?: number
        limit?: number
        gameVersions?: string[]
        loaders?: string[]
    }): Promise<SearchResult> {
        const searchParams = new URLSearchParams()

        if (params.query) {
            searchParams.set('query', params.query)
        }

        // Build facets for filtering
        const facets: string[][] = [
            ['project_type:plugin'],
            ['server_side:required', 'server_side:optional'],
        ]

        if (params.gameVersions?.length) {
            facets.push(params.gameVersions.map(v => `versions:${v}`))
        }

        if (params.loaders?.length) {
            facets.push(params.loaders.map(l => `categories:${l}`))
        }

        searchParams.set('facets', JSON.stringify(facets))
        searchParams.set('index', params.index || 'relevance')
        searchParams.set('offset', String(params.offset || 0))
        searchParams.set('limit', String(params.limit || 20))

        return this.request<SearchResult>(`/search?${searchParams.toString()}`)
    }

    // ========================
    // PROJECTS
    // ========================

    async getProject(idOrSlug: string): Promise<ModrinthProject> {
        return this.request<ModrinthProject>(`/project/${idOrSlug}`)
    }

    async getProjects(ids: string[]): Promise<ModrinthProject[]> {
        const idsParam = JSON.stringify(ids)
        return this.request<ModrinthProject[]>(`/projects?ids=${encodeURIComponent(idsParam)}`)
    }

    // ========================
    // VERSIONS
    // ========================

    async getProjectVersions(idOrSlug: string, params?: {
        loaders?: string[]
        gameVersions?: string[]
        featured?: boolean
    }): Promise<ModrinthVersion[]> {
        const searchParams = new URLSearchParams()

        if (params?.loaders?.length) {
            searchParams.set('loaders', JSON.stringify(params.loaders))
        }

        if (params?.gameVersions?.length) {
            searchParams.set('game_versions', JSON.stringify(params.gameVersions))
        }

        if (params?.featured !== undefined) {
            searchParams.set('featured', String(params.featured))
        }

        const query = searchParams.toString()
        return this.request<ModrinthVersion[]>(
            `/project/${idOrSlug}/version${query ? `?${query}` : ''}`
        )
    }

    async getVersion(id: string): Promise<ModrinthVersion> {
        return this.request<ModrinthVersion>(`/version/${id}`)
    }

    async getVersions(ids: string[]): Promise<ModrinthVersion[]> {
        const idsParam = JSON.stringify(ids)
        return this.request<ModrinthVersion[]>(`/versions?ids=${encodeURIComponent(idsParam)}`)
    }

    // ========================
    // CATEGORIES & LOADERS
    // ========================

    async getCategories() {
        return this.request<Array<{
            icon: string
            name: string
            project_type: string
            header: string
        }>>('/tag/category')
    }

    async getLoaders() {
        return this.request<Array<{
            icon: string
            name: string
            supported_project_types: string[]
        }>>('/tag/loader')
    }

    async getGameVersions() {
        return this.request<Array<{
            version: string
            version_type: 'release' | 'snapshot' | 'alpha' | 'beta'
            date: string
            major: boolean
        }>>('/tag/game_version')
    }

    // ========================
    // HELPERS
    // ========================

    async getLatestPluginVersion(
        idOrSlug: string,
        gameVersion: string,
        loader: string = 'paper'
    ): Promise<ModrinthVersion | null> {
        const versions = await this.getProjectVersions(idOrSlug, {
            gameVersions: [gameVersion],
            loaders: [loader],
        })

        // Find first release version, or any version if no releases
        const releaseVersion = versions.find(v => v.version_type === 'release')
        return releaseVersion || versions[0] || null
    }

    getDownloadUrl(version: ModrinthVersion): string | null {
        const primaryFile = version.files.find(f => f.primary) || version.files[0]
        return primaryFile?.url || null
    }

    formatDownloads(downloads: number): string {
        if (downloads >= 1000000) {
            return `${(downloads / 1000000).toFixed(1)}M`
        }
        if (downloads >= 1000) {
            return `${(downloads / 1000).toFixed(1)}K`
        }
        return String(downloads)
    }
}

export const modrinth = new ModrinthAPI()
export type { ModrinthProject, ModrinthVersion, SearchResult }
