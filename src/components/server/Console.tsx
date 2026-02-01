'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'
import { Loader2, Terminal as TerminalIcon, Send } from 'lucide-react'

interface ConsoleProps {
    serverId: string
    identifier: string
}

export default function Console({ serverId, identifier }: ConsoleProps) {
    const terminalRef = useRef<HTMLDivElement>(null)
    const xtermRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
    const [command, setCommand] = useState('')

    useEffect(() => {
        if (!terminalRef.current) return

        // Initialize xterm
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
            theme: {
                background: '#0a0a0a',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selectionBackground: 'rgba(255, 255, 255, 0.3)',
                black: '#000000',
                red: '#e54b4b',
                green: '#9ece6a',
                yellow: '#e0af68',
                blue: '#7aa2f7',
                magenta: '#bb9af7',
                cyan: '#7dcfff',
                white: '#a9b1d6',
            },
            allowProposedApi: true
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.loadAddon(new WebLinksAddon())

        term.open(terminalRef.current)
        fitAddon.fit()

        xtermRef.current = term
        fitAddonRef.current = fitAddon

        term.writeln('\x1b[36mConnecting to server console...\x1b[0m')

        // Fetch WebSocket credentials
        async function connect() {
            try {
                const response = await fetch(`/api/servers/${identifier}/console`)
                if (!response.ok) throw new Error('Failed to get credentials')
                const { socket: socketUrl, token } = await response.json()

                const ws = new WebSocket(socketUrl)
                socketRef.current = ws

                ws.onopen = () => {
                    setStatus('connected')
                    ws.send(JSON.stringify({ event: 'auth', args: [token] }))
                    term.writeln('\x1b[32mSuccessfully connected to console.\x1b[0m')
                }

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data)
                    switch (data.event) {
                        case 'console output':
                            term.write(data.args[0])
                            break
                        case 'status':
                            term.writeln(`\x1b[33mServer status changed to: ${data.args[0]}\x1b[0m`)
                            break
                        case 'stats':
                            // Handle stats if needed
                            break
                        case 'token expiring':
                            // Refresh token logic
                            break
                    }
                }

                ws.onclose = () => {
                    setStatus('disconnected')
                    term.writeln('\x1b[31mConnection closed.\x1b[0m')
                }

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    term.writeln('\x1b[31mWebSocket error occurred.\x1b[0m')
                }

            } catch (error) {
                console.error('Failed to connect to console:', error)
                term.writeln('\x1b[31mFailed to connect to console.\x1b[0m')
                setStatus('disconnected')
            }
        }

        connect()

        // Handle resize
        const handleResize = () => {
            fitAddon.fit()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            if (socketRef.current) socketRef.current.close()
            term.dispose()
        }
    }, [identifier])

    const sendCommand = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!command.trim() || !socketRef.current) return

        if (socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ event: 'send command', args: [command] }))
            setCommand('')
        }
    }

    return (
        <div className="flex flex-col h-full min-h-[500px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden">
            {/* Console Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Server Console</span>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'connecting' && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
                    <span className={`text-[10px] font-bold uppercase ${status === 'connected' ? 'text-green-500' :
                            status === 'connecting' ? 'text-cyan-500' : 'text-red-500'
                        }`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Terminal Container */}
            <div className="flex-1 p-2 overflow-hidden relative group">
                <div ref={terminalRef} className="h-full w-full" />
                {status === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity group-hover:opacity-0">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                            <p className="text-sm text-gray-400 font-medium">Establishing secure connection...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Command Input */}
            <form onSubmit={sendCommand} className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center text-gray-500 group-focus-within:text-cyan-500 transition-colors">
                        <span className="font-mono text-sm shadow-sm">$</span>
                    </div>
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Type a command to send to the server..."
                        className="w-full bg-black/40 border border-white/5 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono"
                    />
                </div>
                <button
                    type="submit"
                    disabled={status !== 'connected' || !command.trim()}
                    className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    )
}
