import { redirect } from 'next/navigation'
import { use } from 'react'

// Redirect from old /dashboard/server/[id] to new /dashboard/servers/[id]
export default function ServerRedirectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    redirect(`/dashboard/servers/${id}`)
}
