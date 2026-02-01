import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/plans - List all active plans
export async function GET() {
    try {
        // Try to get plans from database
        let plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        })

        // If no plans exist, return default plans
        if (plans.length === 0) {
            plans = [
                {
                    id: 'starter',
                    name: 'Starter',
                    slug: 'starter',
                    description: 'Perfect for small survival servers',
                    price: 149 as unknown as typeof plans[0]['price'],
                    currency: 'INR',
                    memory: 2048,
                    disk: 10240,
                    cpu: 100,
                    databases: 2,
                    backups: 3,
                    allocations: 2,
                    isPopular: false,
                    isActive: true,
                    features: ['DDoS Protection', 'Custom Subdomains', '24/7 Support'],
                    sortOrder: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'standard',
                    name: 'Standard',
                    slug: 'standard',
                    description: 'Great for growing communities',
                    price: 299 as unknown as typeof plans[0]['price'],
                    currency: 'INR',
                    memory: 4096,
                    disk: 25600,
                    cpu: 200,
                    databases: 5,
                    backups: 5,
                    allocations: 4,
                    isPopular: true,
                    isActive: true,
                    features: ['DDoS Protection', 'Custom Subdomains', 'Priority Support', 'Auto Backups'],
                    sortOrder: 2,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'premium',
                    name: 'Premium',
                    slug: 'premium',
                    description: 'For serious server networks',
                    price: 499 as unknown as typeof plans[0]['price'],
                    currency: 'INR',
                    memory: 8192,
                    disk: 51200,
                    cpu: 300,
                    databases: 10,
                    backups: 10,
                    allocations: 8,
                    isPopular: false,
                    isActive: true,
                    features: ['DDoS Protection', 'Custom Domain', 'Priority Support', 'Dedicated IP', 'Auto Backups'],
                    sortOrder: 3,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'enterprise',
                    name: 'Enterprise',
                    slug: 'enterprise',
                    description: 'Maximum power for networks',
                    price: 999 as unknown as typeof plans[0]['price'],
                    currency: 'INR',
                    memory: 16384,
                    disk: 102400,
                    cpu: 400,
                    databases: 99,
                    backups: 99,
                    allocations: 99,
                    isPopular: false,
                    isActive: true,
                    features: ['Advanced DDoS', 'Custom Domain', '24/7 Priority Support', 'Dedicated Node', 'Unlimited Resources'],
                    sortOrder: 4,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ]
        }

        return NextResponse.json({
            plans: plans.map((plan: typeof plans[number]) => ({
                id: plan.id,
                name: plan.name,
                slug: plan.slug,
                description: plan.description,
                price: Number(plan.price),
                memory: plan.memory,
                disk: plan.disk,
                cpu: plan.cpu,
                databases: plan.databases,
                backups: plan.backups,
                allocations: plan.allocations,
                isPopular: plan.isPopular,
                features: plan.features
            }))
        })
    } catch (error) {
        console.error('Failed to fetch plans:', error)
        return NextResponse.json(
            { error: 'Failed to fetch plans' },
            { status: 500 }
        )
    }
}
