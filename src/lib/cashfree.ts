// Cashfree Payment Gateway API Client
// Handles all payment-related operations with Cashfree

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox'

const BASE_URL = CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'

interface CreateOrderParams {
    orderId: string
    orderAmount: number
    orderCurrency?: string
    customerDetails: {
        customerId: string
        customerEmail: string
        customerPhone: string
        customerName?: string
    }
    orderMeta?: {
        returnUrl?: string
        notifyUrl?: string
        paymentMethods?: string
    }
    orderNote?: string
    orderTags?: Record<string, string>
}

interface CashfreeOrder {
    cf_order_id: string
    order_id: string
    entity: string
    order_currency: string
    order_amount: number
    order_status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED'
    payment_session_id: string
    order_expiry_time: string
    order_note: string | null
    created_at: string
    customer_details: {
        customer_id: string
        customer_name: string | null
        customer_email: string
        customer_phone: string
    }
    order_meta: {
        return_url: string | null
        notify_url: string | null
        payment_methods: string | null
    }
    payments?: {
        url: string
    }
    settlements?: {
        url: string
    }
    refunds?: {
        url: string
    }
}

interface PaymentDetails {
    cf_payment_id: string
    order_id: string
    entity: string
    payment_currency: string
    payment_amount: number
    payment_status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED' | 'CANCELLED'
    payment_message: string
    payment_time: string
    payment_completion_time: string | null
    payment_method: {
        [key: string]: unknown
    }
    bank_reference: string | null
    auth_id: string | null
    error_details: {
        error_code: string
        error_description: string
        error_reason: string
        error_source: string
    } | null
}

class CashfreeAPI {
    private appId: string
    private secretKey: string
    private baseUrl: string

    constructor() {
        this.appId = CASHFREE_APP_ID
        this.secretKey = CASHFREE_SECRET_KEY
        this.baseUrl = BASE_URL
    }

    private async request<T>(
        endpoint: string,
        method: 'GET' | 'POST' = 'GET',
        body?: unknown
    ): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': this.appId,
                'x-client-secret': this.secretKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || `Cashfree API Error: ${response.status}`)
        }

        return data
    }

    // ========================
    // ORDER MANAGEMENT
    // ========================

    async createOrder(params: CreateOrderParams): Promise<CashfreeOrder> {
        return this.request<CashfreeOrder>('/orders', 'POST', {
            order_id: params.orderId,
            order_amount: params.orderAmount,
            order_currency: params.orderCurrency || 'INR',
            customer_details: {
                customer_id: params.customerDetails.customerId,
                customer_email: params.customerDetails.customerEmail,
                customer_phone: params.customerDetails.customerPhone,
                customer_name: params.customerDetails.customerName,
            },
            order_meta: {
                return_url: params.orderMeta?.returnUrl,
                notify_url: params.orderMeta?.notifyUrl,
                payment_methods: params.orderMeta?.paymentMethods,
            },
            order_note: params.orderNote,
            order_tags: params.orderTags,
        })
    }

    async getOrder(orderId: string): Promise<CashfreeOrder> {
        return this.request<CashfreeOrder>(`/orders/${orderId}`)
    }

    // ========================
    // PAYMENT VERIFICATION
    // ========================

    async getPaymentsForOrder(orderId: string): Promise<PaymentDetails[]> {
        return this.request<PaymentDetails[]>(`/orders/${orderId}/payments`)
    }

    async verifyPayment(orderId: string): Promise<{
        isSuccessful: boolean
        payment: PaymentDetails | null
    }> {
        try {
            const payments = await this.getPaymentsForOrder(orderId)
            const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS')

            return {
                isSuccessful: !!successfulPayment,
                payment: successfulPayment || null,
            }
        } catch {
            return { isSuccessful: false, payment: null }
        }
    }

    // ========================
    // REFUNDS
    // ========================

    async createRefund(
        orderId: string,
        refundAmount: number,
        refundId: string,
        refundNote?: string
    ) {
        return this.request<{
            cf_payment_id: string
            cf_refund_id: string
            order_id: string
            refund_id: string
            entity: string
            refund_amount: number
            refund_currency: string
            refund_note: string | null
            refund_status: string
            refund_arn: string | null
            refund_charge: number
            status_description: string
            created_at: string
            processed_at: string | null
        }>(`/orders/${orderId}/refunds`, 'POST', {
            refund_amount: refundAmount,
            refund_id: refundId,
            refund_note: refundNote,
        })
    }

    async getRefund(orderId: string, refundId: string) {
        return this.request(`/orders/${orderId}/refunds/${refundId}`)
    }

    // ========================
    // SETTLEMENTS
    // ========================

    async getSettlements(orderId: string) {
        return this.request(`/orders/${orderId}/settlements`)
    }

    // ========================
    // PAYMENT LINKS
    // ========================

    async createPaymentLink(params: {
        linkId: string
        linkAmount: number
        linkCurrency?: string
        linkPurpose: string
        customerDetails: {
            customerPhone: string
            customerEmail?: string
            customerName?: string
        }
        linkExpiryTime?: string
        linkNotify?: {
            sendSms?: boolean
            sendEmail?: boolean
        }
        linkMeta?: {
            returnUrl?: string
            notifyUrl?: string
        }
    }) {
        return this.request('/links', 'POST', {
            link_id: params.linkId,
            link_amount: params.linkAmount,
            link_currency: params.linkCurrency || 'INR',
            link_purpose: params.linkPurpose,
            customer_details: {
                customer_phone: params.customerDetails.customerPhone,
                customer_email: params.customerDetails.customerEmail,
                customer_name: params.customerDetails.customerName,
            },
            link_expiry_time: params.linkExpiryTime,
            link_notify: {
                send_sms: params.linkNotify?.sendSms,
                send_email: params.linkNotify?.sendEmail,
            },
            link_meta: {
                return_url: params.linkMeta?.returnUrl,
                notify_url: params.linkMeta?.notifyUrl,
            },
        })
    }

    async getPaymentLink(linkId: string) {
        return this.request(`/links/${linkId}`)
    }

    async cancelPaymentLink(linkId: string) {
        return this.request(`/links/${linkId}/cancel`, 'POST')
    }

    // ========================
    // HELPERS
    // ========================

    generateCheckoutUrl(paymentSessionId: string): string {
        const domain = CASHFREE_ENV === 'production' ? 'payments' : 'sandbox'
        return `https://${domain}.cashfree.com/pg/view/order/${paymentSessionId}`
    }

    verifyWebhookSignature(
        payload: string,
        timestamp: string,
        signature: string
    ): boolean {
        const crypto = require('crypto')
        const signedPayload = `${timestamp}${payload}`
        const expectedSignature = crypto
            .createHmac('sha256', this.secretKey)
            .update(signedPayload)
            .digest('base64')

        return signature === expectedSignature
    }
}

export const cashfree = new CashfreeAPI()
export type { CreateOrderParams, CashfreeOrder, PaymentDetails }
