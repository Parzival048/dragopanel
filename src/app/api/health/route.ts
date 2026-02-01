import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/health - Health check endpoint for debugging
export async function GET() {
    const checks = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database_url_set: !!process.env.DATABASE_URL,
        nextauth_url: process.env.NEXTAUTH_URL,
        nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
        pterodactyl_url: process.env.PTERODACTYL_URL,
        database: 'unknown',
        error: null as string | null
    }

    try {
        // Try to connect to database
        await prisma.$connect()
        const result = await prisma.$queryRaw`SELECT 1 as test`
        checks.database = 'connected'
    } catch (error) {
        checks.database = 'failed'
        checks.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json(checks)
}
