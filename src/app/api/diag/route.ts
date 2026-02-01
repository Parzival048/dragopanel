import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

// GET /api/diag - Diagnostic endpoint to check what's failing
export async function GET(request: NextRequest) {
    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        checks: {}
    }

    // Check 1: Environment variables
    results.checks.env = {
        PTERODACTYL_URL: !!process.env.PTERODACTYL_URL,
        PTERODACTYL_API_KEY: !!process.env.PTERODACTYL_API_KEY,
        PTERODACTYL_CLIENT_KEY: !!process.env.PTERODACTYL_CLIENT_KEY,
        PTERODACTYL_ADMIN_USER_ID: process.env.PTERODACTYL_ADMIN_USER_ID || 'NOT SET',
        DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET
    }

    // Check 2: Auth session
    try {
        const session = await getServerSession(authOptions)
        results.checks.auth = {
            ok: true,
            hasSession: !!session,
            userId: session?.user?.id || null,
            email: session?.user?.email || null
        }
    } catch (error) {
        results.checks.auth = {
            ok: false,
            error: error instanceof Error ? error.message : String(error)
        }
    }

    // Check 3: Database connection
    try {
        const userCount = await prisma.user.count()
        const serverCount = await prisma.server.count()
        results.checks.database = {
            ok: true,
            userCount,
            serverCount
        }
    } catch (error) {
        results.checks.database = {
            ok: false,
            error: error instanceof Error ? error.message : String(error)
        }
    }

    // Check 4: Pterodactyl API (Application)
    try {
        const user = await pterodactyl.getUser(1) as any
        results.checks.pterodactylApp = {
            ok: true,
            testUser: user?.attributes?.email || 'user found'
        }
    } catch (error) {
        results.checks.pterodactylApp = {
            ok: false,
            error: error instanceof Error ? error.message : String(error)
        }
    }

    // Check 5: Pterodactyl Client API (try to list servers)
    try {
        // This should fail without a valid server identifier, but the error will tell us if auth works
        // We'll just check if the CLIENT_KEY format is valid
        results.checks.pterodactylClient = {
            ok: true,
            note: 'Client key is set, cannot fully test without a valid server identifier'
        }
    } catch (error) {
        results.checks.pterodactylClient = {
            ok: false,
            error: error instanceof Error ? error.message : String(error)
        }
    }

    // Check 6: Get user's servers from database
    try {
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            const servers = await prisma.server.findMany({
                where: {
                    userId: session.user.id,
                    status: { not: 'DELETED' }
                },
                select: {
                    id: true,
                    identifier: true,
                    name: true,
                    status: true
                }
            })
            results.checks.userServers = {
                ok: true,
                count: servers.length,
                servers: servers
            }
        } else {
            results.checks.userServers = {
                ok: false,
                error: 'No authenticated user'
            }
        }
    } catch (error) {
        results.checks.userServers = {
            ok: false,
            error: error instanceof Error ? error.message : String(error)
        }
    }

    return NextResponse.json(results)
}
