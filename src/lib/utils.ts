import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatCurrency(amount: number, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
    }).format(amount)
}

export function formatDate(date: Date | string) {
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date))
}

export function generateOrderId() {
    return `DH${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

export function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}

export function getServerStatusColor(status: string) {
    const colors: Record<string, string> = {
        RUNNING: 'text-green-400',
        STOPPED: 'text-red-400',
        INSTALLING: 'text-yellow-400',
        PENDING: 'text-blue-400',
        SUSPENDED: 'text-orange-400',
    }
    return colors[status] || 'text-gray-400'
}

export function getServerStatusBgColor(status: string) {
    const colors: Record<string, string> = {
        RUNNING: 'bg-green-500/20 text-green-400 border-green-500/30',
        STOPPED: 'bg-red-500/20 text-red-400 border-red-500/30',
        INSTALLING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        PENDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        SUSPENDED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}
