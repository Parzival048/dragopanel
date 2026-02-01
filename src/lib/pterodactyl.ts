// Pterodactyl API Client
// Handles all communication with the Pterodactyl Panel API

const PTERODACTYL_URL = process.env.PTERODACTYL_URL!
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY!
const PTERODACTYL_CLIENT_KEY = process.env.PTERODACTYL_CLIENT_KEY!
// Email of the admin user whose CLIENT_KEY we're using - used for subuser access
const PTERODACTYL_CLIENT_EMAIL = process.env.PTERODACTYL_CLIENT_EMAIL || ''

interface ApiResponse<T> {
    object: string
    attributes?: T // Single item attributes
    data?: T // List data or single item attributes in some versions
    meta?: {
        pagination?: {
            total: number
            count: number
            per_page: number
            current_page: number
            total_pages: number
        }
    }
}

interface ServerAllocation {
    id: number
    ip: string
    ip_alias: string | null
    port: number
    notes: string | null
    is_default: boolean
}

interface PterodactylServer {
    id: number
    external_id: string | null
    uuid: string
    identifier: string
    name: string
    description: string
    status: string | null
    suspended: boolean
    limits: {
        memory: number
        swap: number
        disk: number
        io: number
        cpu: number
        threads: string | null
        oom_disabled: boolean
    }
    feature_limits: {
        databases: number
        allocations: number
        backups: number
    }
    user: number
    node: number
    allocation: number
    nest: number
    egg: number
    container: {
        startup_command: string
        image: string
        installed: number
        environment: Record<string, string>
    }
    created_at: string
    updated_at: string
    relationships?: {
        allocations?: {
            data: Array<{ attributes: ServerAllocation }>
        }
    }
}

interface CreateServerParams {
    name: string
    user: number
    egg: number
    docker_image: string
    startup: string
    environment: Record<string, string>
    limits: {
        memory: number
        swap: number
        disk: number
        io: number
        cpu: number
    }
    feature_limits: {
        databases: number
        allocations: number
        backups: number
    }
    allocation: {
        default: number
    }
    start_on_completion?: boolean
}

class PterodactylAPI {
    private baseUrl: string
    private apiKey: string
    private clientKey: string

    constructor() {
        this.baseUrl = PTERODACTYL_URL
        this.apiKey = PTERODACTYL_API_KEY
        this.clientKey = PTERODACTYL_CLIENT_KEY
    }

    // Application API (Admin)
    private async applicationRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
        body?: unknown
    ): Promise<T> {
        const response = await fetch(`${this.baseUrl}/api/application${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.errors?.[0]?.detail || `API Error: ${response.status}`)
        }

        return response.json()
    }

    // Client API (User)
    private async clientRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
        body?: unknown
    ): Promise<T> {
        const response = await fetch(`${this.baseUrl}/api/client${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.clientKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.errors?.[0]?.detail || `API Error: ${response.status}`)
        }

        return response.json()
    }

    // ========================
    // USER MANAGEMENT
    // ========================

    async createUser(data: {
        email: string
        username: string
        first_name: string
        last_name: string
        password?: string
    }) {
        return this.applicationRequest<{ attributes: { id: number; uuid: string } }>(
            '/users',
            'POST',
            data
        )
    }

    async getUser(id: number) {
        return this.applicationRequest<ApiResponse<{ attributes: unknown }>>(
            `/users/${id}`
        )
    }

    async getUserByEmail(email: string) {
        return this.applicationRequest<ApiResponse<Array<{ attributes: { id: number } }>>>(
            `/users?filter[email]=${encodeURIComponent(email)}`
        )
    }

    // ========================
    // SERVER MANAGEMENT
    // ========================

    async listServers(page = 1) {
        return this.applicationRequest<ApiResponse<Array<{ attributes: PterodactylServer }>>>(
            `/servers?page=${page}&include=allocations`
        )
    }

    async getServer(id: number) {
        return this.applicationRequest<ApiResponse<{ attributes: PterodactylServer }>>(
            `/servers/${id}?include=allocations`
        )
    }

    async getServerByIdentifier(identifier: string) {
        return this.clientRequest<{ attributes: PterodactylServer }>(
            `/servers/${identifier}`
        )
    }

    async createServer(params: CreateServerParams) {
        return this.applicationRequest<{ attributes: PterodactylServer }>(
            '/servers',
            'POST',
            params
        )
    }

    async updateServerBuild(id: number, data: Partial<{
        allocation: number
        memory: number
        swap: number
        io: number
        cpu: number
        disk: number
        threads: string | null
        feature_limits: {
            databases: number
            allocations: number
            backups: number
        }
    }>) {
        return this.applicationRequest<ApiResponse<{ attributes: PterodactylServer }>>(
            `/servers/${id}/build`,
            'PATCH',
            data
        )
    }

    async suspendServer(id: number) {
        return this.applicationRequest<void>(`/servers/${id}/suspend`, 'POST')
    }

    async unsuspendServer(id: number) {
        return this.applicationRequest<void>(`/servers/${id}/unsuspend`, 'POST')
    }

    async reinstallServer(id: number) {
        return this.applicationRequest<void>(`/servers/${id}/reinstall`, 'POST')
    }

    async deleteServer(id: number, force = false) {
        return this.applicationRequest<void>(
            `/servers/${id}${force ? '/force' : ''}`,
            'DELETE'
        )
    }

    // ========================
    // SERVER POWER ACTIONS (Client API)
    // ========================

    async sendPowerAction(identifier: string, action: 'start' | 'stop' | 'restart' | 'kill') {
        return this.clientRequest<void>(
            `/servers/${identifier}/power`,
            'POST',
            { signal: action }
        )
    }

    async sendCommand(identifier: string, command: string) {
        return this.clientRequest<void>(
            `/servers/${identifier}/command`,
            'POST',
            { command }
        )
    }

    // ========================
    // SERVER RESOURCES
    // ========================

    async getServerResources(identifier: string) {
        return this.clientRequest<{
            attributes: {
                current_state: string
                is_suspended: boolean
                resources: {
                    memory_bytes: number
                    cpu_absolute: number
                    disk_bytes: number
                    network_rx_bytes: number
                    network_tx_bytes: number
                    uptime: number
                }
            }
        }>(`/servers/${identifier}/resources`)
    }

    // ========================
    // SUBUSER MANAGEMENT (Client API)
    // ========================

    // Get the admin email for subuser access
    getClientEmail(): string {
        return PTERODACTYL_CLIENT_EMAIL
    }

    // Add a subuser to a server (must be called by server owner's API key)
    async addSubuser(identifier: string, email: string, permissions: string[]) {
        return this.clientRequest<{
            attributes: {
                uuid: string
                username: string
                email: string
                permissions: string[]
            }
        }>(`/servers/${identifier}/users`, 'POST', {
            email,
            permissions
        })
    }

    // Get list of subusers
    async listSubusers(identifier: string) {
        return this.clientRequest<{
            data: Array<{
                attributes: {
                    uuid: string
                    username: string
                    email: string
                    permissions: string[]
                }
            }>
        }>(`/servers/${identifier}/users`)
    }

    // ========================
    // WEBSOCKET
    // ========================

    async getWebSocketCredentials(identifier: string) {
        return this.clientRequest<{
            data: {
                token: string
                socket: string
            }
        }>(`/servers/${identifier}/websocket`)
    }

    // ========================
    // FILES
    // ========================

    async listFiles(identifier: string, directory = '/') {
        return this.clientRequest<{
            data: Array<{
                attributes: {
                    name: string
                    mode: string
                    mode_bits: string
                    size: number
                    is_file: boolean
                    is_symlink: boolean
                    mimetype: string
                    created_at: string
                    modified_at: string
                }
            }>
        }>(`/servers/${identifier}/files/list?directory=${encodeURIComponent(directory)}`)
    }

    async getFileContents(identifier: string, file: string) {
        const response = await fetch(
            `${this.baseUrl}/api/client/servers/${identifier}/files/contents?file=${encodeURIComponent(file)}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.clientKey}`,
                    'Accept': 'application/json',
                },
            }
        )
        return response.text()
    }

    async writeFile(identifier: string, file: string, content: string) {
        return this.clientRequest<void>(
            `/servers/${identifier}/files/write?file=${encodeURIComponent(file)}`,
            'POST',
            content
        )
    }

    async deleteFiles(identifier: string, root: string, files: string[]) {
        return this.clientRequest<void>(
            `/servers/${identifier}/files/delete`,
            'POST',
            { root, files }
        )
    }

    async createFolder(identifier: string, root: string, name: string) {
        return this.clientRequest<void>(
            `/servers/${identifier}/files/create-folder`,
            'POST',
            { root, name }
        )
    }

    async renameFile(identifier: string, root: string, from: string, to: string) {
        return this.clientRequest<void>(
            `/servers/${identifier}/files/rename`,
            'POST',
            { root, files: [{ from, to }] }
        )
    }

    async compressFiles(identifier: string, root: string, files: string[]) {
        return this.clientRequest<{ attributes: { name: string } }>(
            `/servers/${identifier}/files/compress`,
            'POST',
            { root, files }
        )
    }

    async decompressFile(identifier: string, root: string, file: string) {
        return this.clientRequest<void>(
            `/servers/${identifier}/files/decompress`,
            'POST',
            { root, file }
        )
    }

    async getDownloadUrl(identifier: string, file: string) {
        return this.clientRequest<{ attributes: { url: string } }>(
            `/servers/${identifier}/files/download?file=${encodeURIComponent(file)}`
        )
    }

    async getUploadUrl(identifier: string) {
        return this.clientRequest<{ attributes: { url: string } }>(
            `/servers/${identifier}/files/upload`
        )
    }

    // Helper methods with simpler signatures
    async getFileContent(identifier: string, path: string): Promise<string> {
        return this.getFileContents(identifier, path)
    }

    async writeFileContent(identifier: string, path: string, content: string): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/api/client/servers/${identifier}/files/write?file=${encodeURIComponent(path)}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.clientKey}`,
                    'Content-Type': 'text/plain',
                },
                body: content,
            }
        )
        if (!response.ok) {
            throw new Error(`Failed to write file: ${response.status}`)
        }
    }

    async createFolderByPath(identifier: string, path: string): Promise<void> {
        const parts = path.split('/')
        const name = parts.pop() || ''
        const root = parts.join('/') || '/'
        await this.clientRequest<void>(
            `/servers/${identifier}/files/create-folder`,
            'POST',
            { root, name }
        )
    }

    async deleteFilesByPaths(identifier: string, paths: string[]): Promise<void> {
        // Group files by directory
        const filesByDir: Record<string, string[]> = {}
        for (const path of paths) {
            const parts = path.split('/')
            const name = parts.pop() || ''
            const root = parts.join('/') || '/'
            if (!filesByDir[root]) filesByDir[root] = []
            filesByDir[root].push(name)
        }

        // Delete files in each directory
        for (const [root, files] of Object.entries(filesByDir)) {
            await this.clientRequest<void>(
                `/servers/${identifier}/files/delete`,
                'POST',
                { root, files }
            )
        }
    }

    async downloadFileFromUrl(identifier: string, url: string, targetPath: string): Promise<void> {
        // Use Pterodactyl's pull endpoint to download from URL
        const parts = targetPath.split('/')
        const filename = parts.pop() || ''
        const directory = parts.join('/') || '/'

        await this.clientRequest<void>(
            `/servers/${identifier}/files/pull`,
            'POST',
            {
                url,
                directory,
                filename,
                use_header: false,
                foreground: true
            }
        )
    }

    // ========================
    // BACKUPS
    // ========================

    async listBackups(identifier: string) {
        return this.clientRequest<{
            data: Array<{
                attributes: {
                    uuid: string
                    is_successful: boolean
                    is_locked: boolean
                    name: string
                    ignored_files: string[]
                    checksum: string | null
                    bytes: number
                    created_at: string
                    completed_at: string | null
                }
            }>
        }>(`/servers/${identifier}/backups`)
    }

    async createBackup(identifier: string, name?: string, ignoredFiles?: string) {
        return this.clientRequest<{
            attributes: {
                uuid: string
                name: string
                created_at: string
            }
        }>(`/servers/${identifier}/backups`, 'POST', {
            name,
            ignored: ignoredFiles,
        })
    }

    async getBackupDownloadUrl(identifier: string, backupUuid: string) {
        return this.clientRequest<{ attributes: { url: string } }>(
            `/servers/${identifier}/backups/${backupUuid}/download`
        )
    }

    async restoreBackup(identifier: string, backupUuid: string, truncate = false) {
        return this.clientRequest<void>(
            `/servers/${identifier}/backups/${backupUuid}/restore`,
            'POST',
            { truncate }
        )
    }

    async deleteBackup(identifier: string, backupUuid: string) {
        return this.clientRequest<void>(
            `/servers/${identifier}/backups/${backupUuid}`,
            'DELETE'
        )
    }

    async toggleBackupLock(identifier: string, backupUuid: string) {
        return this.clientRequest<{ attributes: { is_locked: boolean } }>(
            `/servers/${identifier}/backups/${backupUuid}/lock`,
            'POST'
        )
    }

    // ========================
    // DATABASES
    // ========================

    async listDatabases(identifier: string) {
        return this.clientRequest<{
            data: Array<{
                attributes: {
                    id: string
                    host: {
                        address: string
                        port: number
                    }
                    name: string
                    username: string
                    connections_from: string
                    max_connections: number
                }
            }>
        }>(`/servers/${identifier}/databases`)
    }

    async createDatabase(identifier: string, database: string, remote: string = '%') {
        return this.clientRequest<{
            attributes: {
                id: string
                name: string
                username: string
                host: {
                    address: string
                    port: number
                }
                relationships: {
                    password: {
                        attributes: {
                            password: string
                        }
                    }
                }
            }
        }>(`/servers/${identifier}/databases`, 'POST', { database, remote })
    }

    async rotateDatabasePassword(identifier: string, databaseId: string) {
        return this.clientRequest<{
            attributes: {
                relationships: {
                    password: {
                        attributes: {
                            password: string
                        }
                    }
                }
            }
        }>(`/servers/${identifier}/databases/${databaseId}/rotate-password`, 'POST')
    }

    async deleteDatabase(identifier: string, databaseId: string) {
        return this.clientRequest<void>(
            `/servers/${identifier}/databases/${databaseId}`,
            'DELETE'
        )
    }

    // ========================
    // NETWORK / ALLOCATIONS
    // ========================

    async listAllocations(identifier: string) {
        return this.clientRequest<{
            data: Array<{
                attributes: ServerAllocation
            }>
        }>(`/servers/${identifier}/network/allocations`)
    }

    async assignAllocation(identifier: string) {
        return this.clientRequest<{
            attributes: ServerAllocation
        }>(`/servers/${identifier}/network/allocations`, 'POST')
    }

    async setAllocationNote(identifier: string, allocationId: number, notes: string) {
        return this.clientRequest<{
            attributes: ServerAllocation
        }>(`/servers/${identifier}/network/allocations/${allocationId}`, 'POST', { notes })
    }

    async setPrimaryAllocation(identifier: string, allocationId: number) {
        return this.clientRequest<{
            attributes: ServerAllocation
        }>(`/servers/${identifier}/network/allocations/${allocationId}/primary`, 'POST')
    }

    async deleteAllocation(identifier: string, allocationId: number) {
        return this.clientRequest<void>(
            `/servers/${identifier}/network/allocations/${allocationId}`,
            'DELETE'
        )
    }

    // ========================
    // EGGS & NESTS
    // ========================

    async listNests() {
        return this.applicationRequest<{
            data: Array<{
                attributes: {
                    id: number
                    uuid: string
                    author: string
                    name: string
                    description: string
                }
            }>
        }>('/nests')
    }

    async listEggs(nestId: number) {
        return this.applicationRequest<{
            data: Array<{
                attributes: {
                    id: number
                    uuid: string
                    name: string
                    nest: number
                    author: string
                    description: string
                    docker_image: string
                    docker_images: Record<string, string>
                    startup: string
                    script: {
                        privileged: boolean
                        install: string
                        entry: string
                        container: string
                        extends: string | null
                    }
                }
            }>
        }>(`/nests/${nestId}/eggs?include=variables`)
    }

    async getEgg(nestId: number, eggId: number) {
        return this.applicationRequest<{
            attributes: {
                id: number
                uuid: string
                name: string
                nest: number
                author: string
                description: string
                docker_image: string
                docker_images: Record<string, string>
                startup: string
                relationships?: {
                    variables?: {
                        data: Array<{
                            attributes: {
                                id: number
                                name: string
                                description: string
                                env_variable: string
                                default_value: string
                                user_viewable: boolean
                                user_editable: boolean
                                rules: string
                            }
                        }>
                    }
                }
            }
        }>(`/nests/${nestId}/eggs/${eggId}?include=variables`)
    }

    // ========================
    // NODES & ALLOCATIONS (Admin)
    // ========================

    async listNodes() {
        return this.applicationRequest<{
            data: Array<{
                attributes: {
                    id: number
                    uuid: string
                    public: boolean
                    name: string
                    description: string
                    location_id: number
                    fqdn: string
                    scheme: string
                    behind_proxy: boolean
                    maintenance_mode: boolean
                    memory: number
                    memory_overallocate: number
                    disk: number
                    disk_overallocate: number
                    upload_size: number
                    daemon_listen: number
                    daemon_sftp: number
                    daemon_base: string
                }
            }>
        }>('/nodes')
    }

    async getNodeAllocations(nodeId: number, page = 1) {
        return this.applicationRequest<{
            data: Array<{
                attributes: {
                    id: number
                    ip: string
                    alias: string | null
                    port: number
                    notes: string | null
                    assigned: boolean
                }
            }>
            meta: {
                pagination: {
                    total: number
                    count: number
                    per_page: number
                    current_page: number
                    total_pages: number
                }
            }
        }>(`/nodes/${nodeId}/allocations?page=${page}`)
    }

    async findAvailableAllocation(nodeId: number) {
        let page = 1
        while (true) {
            const response = await this.getNodeAllocations(nodeId, page)
            const available = response.data.find(a => !a.attributes.assigned)
            if (available) {
                return available.attributes.id
            }
            if (page >= response.meta.pagination.total_pages) {
                throw new Error('No available allocations on this node')
            }
            page++
        }
    }
}

export const pterodactyl = new PterodactylAPI()
export type { PterodactylServer, CreateServerParams, ServerAllocation }
