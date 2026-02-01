import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cashfree } from '@/lib/cashfree'
import { pterodactyl } from '@/lib/pterodactyl'

// POST /api/payments/webhook - Cashfree webhook handler
export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const signature = request.headers.get('x-webhook-signature') || ''
        const timestamp = request.headers.get('x-webhook-timestamp') || ''

        // Verify webhook signature
        const isValid = cashfree.verifyWebhookSignature(body, timestamp, signature)

        if (!isValid) {
            console.error('Invalid webhook signature')
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        const data = JSON.parse(body)
        const { order_id, order_status, payment_status, cf_payment_id, payment_time, payment_method } = data.data || data

        // Find the payment
        const payment = await prisma.payment.findUnique({
            where: { orderId: order_id },
            include: { user: true }
        })

        if (!payment) {
            console.error('Payment not found:', order_id)
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            )
        }

        // Update payment status
        if (payment_status === 'SUCCESS' || order_status === 'PAID') {
            // Mark payment as successful
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'SUCCESS',
                    cashfreePaymentId: cf_payment_id,
                    paymentMethod: payment_method?.toString(),
                    paymentTime: payment_time ? new Date(payment_time) : new Date()
                }
            })

            // Provision the server
            try {
                const metadata = payment.metadata as { eggId: number; version?: string } | null
                const eggId = metadata?.eggId || 1

                // Get plan details
                let planData = {
                    memory: 2048,
                    disk: 10240,
                    cpu: 100,
                    databases: 2,
                    backups: 3,
                    allocations: 2
                }

                if (payment.planId) {
                    const plan = await prisma.plan.findUnique({
                        where: { id: payment.planId }
                    })
                    if (plan) {
                        planData = {
                            memory: plan.memory,
                            disk: plan.disk,
                            cpu: plan.cpu,
                            databases: plan.databases,
                            backups: plan.backups,
                            allocations: plan.allocations
                        }
                    }
                }

                // Find available allocation
                const nodeId = 1 // Default node
                const allocationId = await pterodactyl.findAvailableAllocation(nodeId)

                // Create server in Pterodactyl
                const pterodactylServer = await pterodactyl.createServer({
                    name: payment.serverName || 'Minecraft Server',
                    user: 1, // Admin user to start
                    egg: eggId,
                    docker_image: 'ghcr.io/pterodactyl/yolks:java_17',
                    startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
                    environment: {
                        SERVER_JARFILE: 'server.jar',
                        BUILD_NUMBER: 'latest'
                    },
                    limits: {
                        memory: planData.memory,
                        swap: 0,
                        disk: planData.disk,
                        io: 500,
                        cpu: planData.cpu
                    },
                    feature_limits: {
                        databases: planData.databases,
                        allocations: planData.allocations,
                        backups: planData.backups
                    },
                    allocation: {
                        default: allocationId
                    },
                    start_on_completion: true
                })

                // Calculate expiration (30 days)
                const expiresAt = new Date()
                expiresAt.setDate(expiresAt.getDate() + 30)

                // Create server in our database
                const server = await prisma.server.create({
                    data: {
                        name: payment.serverName || 'Minecraft Server',
                        pterodactylId: pterodactylServer.data.attributes.id,
                        identifier: pterodactylServer.data.attributes.identifier,
                        uuid: pterodactylServer.data.attributes.uuid,
                        userId: payment.userId,
                        planId: payment.planId || 'starter',
                        eggId,
                        nodeId,
                        allocationId,
                        status: 'INSTALLING',
                        expiresAt
                    }
                })

                // Create subscription
                await prisma.subscription.create({
                    data: {
                        userId: payment.userId,
                        planId: payment.planId || 'starter',
                        serverId: server.id,
                        paymentId: payment.id,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate: expiresAt,
                        autoRenew: true
                    }
                })

                console.log('Server created successfully:', server.identifier)
            } catch (provisionError) {
                console.error('Failed to provision server:', provisionError)
                // Payment still succeeded, but server provisioning failed
                // This should trigger an alert/notification
            }
        } else if (payment_status === 'FAILED' || order_status === 'EXPIRED') {
            // Mark payment as failed
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    failureReason: data.data?.error_details?.error_description || 'Payment failed'
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Webhook processing failed:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
