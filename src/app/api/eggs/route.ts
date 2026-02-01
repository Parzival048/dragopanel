import { NextResponse } from 'next/server'
import { pterodactyl } from '@/lib/pterodactyl'
import { prisma } from '@/lib/prisma'

// GET /api/eggs - List all available eggs
export async function GET() {
    try {
        // Try to get eggs from our cache first
        let eggs = await prisma.egg.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        })

        // If no eggs cached, fetch from Pterodactyl and cache them
        if (eggs.length === 0) {
            try {
                // Get all nests
                const nests = await pterodactyl.listNests()

                // Get eggs from each nest
                for (const nest of nests.data) {
                    const nestEggs = await pterodactyl.listEggs(nest.attributes.id)

                    for (const egg of nestEggs.data) {
                        // Upsert egg to cache
                        await prisma.egg.upsert({
                            where: { eggId: egg.attributes.id },
                            create: {
                                eggId: egg.attributes.id,
                                nestId: nest.attributes.id,
                                name: egg.attributes.name,
                                description: egg.attributes.description,
                                dockerImage: egg.attributes.docker_image,
                                startup: egg.attributes.startup,
                                features: [],
                                isActive: true
                            },
                            update: {
                                name: egg.attributes.name,
                                description: egg.attributes.description,
                                dockerImage: egg.attributes.docker_image,
                                startup: egg.attributes.startup
                            }
                        })
                    }
                }

                // Fetch cached eggs
                eggs = await prisma.egg.findMany({
                    where: { isActive: true },
                    orderBy: { name: 'asc' }
                })
            } catch (pterodactylError) {
                console.error('Failed to fetch eggs from Pterodactyl:', pterodactylError)

                // Return default Minecraft eggs if Pterodactyl is unavailable
                return NextResponse.json({
                    eggs: [
                        {
                            id: 1,
                            name: 'Paper',
                            description: 'High performance Minecraft server fork with additional optimizations',
                            dockerImages: {
                                'Java 21': 'ghcr.io/pterodactyl/yolks:java_21',
                                'Java 17': 'ghcr.io/pterodactyl/yolks:java_17',
                                'Java 11': 'ghcr.io/pterodactyl/yolks:java_11',
                                'Java 8': 'ghcr.io/pterodactyl/yolks:java_8'
                            }
                        },
                        {
                            id: 2,
                            name: 'Vanilla',
                            description: 'The original Minecraft server experience',
                            dockerImages: {
                                'Java 21': 'ghcr.io/pterodactyl/yolks:java_21',
                                'Java 17': 'ghcr.io/pterodactyl/yolks:java_17'
                            }
                        },
                        {
                            id: 3,
                            name: 'Forge',
                            description: 'Minecraft modding platform for custom modifications',
                            dockerImages: {
                                'Java 17': 'ghcr.io/pterodactyl/yolks:java_17',
                                'Java 8': 'ghcr.io/pterodactyl/yolks:java_8'
                            }
                        },
                        {
                            id: 4,
                            name: 'Fabric',
                            description: 'Lightweight modding toolchain for Minecraft',
                            dockerImages: {
                                'Java 21': 'ghcr.io/pterodactyl/yolks:java_21',
                                'Java 17': 'ghcr.io/pterodactyl/yolks:java_17'
                            }
                        },
                        {
                            id: 5,
                            name: 'Spigot',
                            description: 'Modified Minecraft server with plugin support',
                            dockerImages: {
                                'Java 17': 'ghcr.io/pterodactyl/yolks:java_17',
                                'Java 11': 'ghcr.io/pterodactyl/yolks:java_11'
                            }
                        },
                        {
                            id: 6,
                            name: 'Bungeecord',
                            description: 'Proxy server to connect multiple Minecraft servers',
                            dockerImages: {
                                'Java 17': 'ghcr.io/pterodactyl/yolks:java_17'
                            }
                        },
                        {
                            id: 7,
                            name: 'Velocity',
                            description: 'Modern, high-performance Minecraft proxy',
                            dockerImages: {
                                'Java 17': 'ghcr.io/pterodactyl/yolks:java_17'
                            }
                        },
                        {
                            id: 8,
                            name: 'Purpur',
                            description: 'Fork of Paper with additional gameplay tweaks',
                            dockerImages: {
                                'Java 21': 'ghcr.io/pterodactyl/yolks:java_21',
                                'Java 17': 'ghcr.io/pterodactyl/yolks:java_17'
                            }
                        }
                    ]
                })
            }
        }

        return NextResponse.json({
            eggs: eggs.map((egg: typeof eggs[number]) => ({
                id: egg.eggId,
                name: egg.name,
                description: egg.description,
                dockerImages: {}
            }))
        })
    } catch (error) {
        console.error('Failed to fetch eggs:', error)
        return NextResponse.json(
            { error: 'Failed to fetch eggs' },
            { status: 500 }
        )
    }
}
