import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { pterodactyl } from '@/lib/pterodactyl'

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json()

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create/Link user in Pterodactyl Panel
        let pterodactylUserId: number | null = null
        try {
            // Check if user already exists in Pterodactyl by email
            const searchResponse = await pterodactyl.getUserByEmail(email)
            if (searchResponse.data && searchResponse.data.length > 0) {
                pterodactylUserId = searchResponse.data[0].attributes.id
                console.log('Linked existing Pterodactyl user:', pterodactylUserId)
            } else {
                // Create new user if not found
                const pterodactylUser = await pterodactyl.createUser({
                    email,
                    username: email.split('@')[0] + Math.random().toString(36).substring(2, 7),
                    first_name: name.split(' ')[0] || name,
                    last_name: name.split(' ').slice(1).join(' ') || 'User',
                    password,
                })
                pterodactylUserId = pterodactylUser.attributes.id
                console.log('Created new Pterodactyl user:', pterodactylUserId)
            }
        } catch (pterodactylError) {
            console.error('Pterodactyl integration failed:', pterodactylError)
            // We continue even if Pterodactyl fails, as we can link it later or the admin can fix it
        }

        // Create user in our database
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                pterodactylId: pterodactylUserId,
            },
        })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Failed to create account. Please try again.' },
            { status: 500 }
        )
    }
}
