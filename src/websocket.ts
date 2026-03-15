import WebSocket from 'ws'

const PING_INTERVAL = 5000
const PING_TIMEOUT = 3500
const RECONNECT_DELAY = 5000

export type WsUpdatePath =
	| 'device'
	| 'ports/port'
	| 'groups/group'
	| 'trunks/trunk'
	| 'config/name'
	| 'config/profiles'
	| 'poe/capable'
	| 'poe/ports'

export interface WsCallbacks {
	onUpdate: (path: WsUpdatePath, data: unknown) => void
	onConnectionChange: (status: 'connected' | 'disconnected' | 'error') => void
	log: (level: 'debug' | 'info' | 'warn' | 'error', msg: string) => void
}

export interface WsOptions extends WsCallbacks {
	host: string
	password: string
}

/**
 * GigaCore Gen2 WebSocket client for real-time state updates.
 *
 * Connects to ws://{host}/api/ws and subscribes to state change events.
 * Falls back gracefully if connection fails (polling continues).
 */
export class GigaCoreWebSocket {
	private host: string
	private password: string
	private ws: WebSocket | null = null
	private pingTimer: ReturnType<typeof setInterval> | null = null
	private pongTimeout: ReturnType<typeof setTimeout> | null = null
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null
	private destroyed = false
	private callbacks: WsCallbacks

	constructor(opts: WsOptions) {
		this.host = opts.host
		this.password = opts.password
		this.callbacks = {
			onUpdate: opts.onUpdate,
			onConnectionChange: opts.onConnectionChange,
			log: opts.log,
		}
	}

	connect(): void {
		if (this.destroyed) return
		this.cleanup()

		const url = `ws://${this.host}/api/ws`
		this.callbacks.log('debug', `WebSocket connecting to ${url}`)

		const headers: Record<string, string> = {}
		if (this.password) {
			headers['Authorization'] = 'Basic ' + Buffer.from('admin:' + this.password).toString('base64')
		}

		this.ws = new WebSocket(url, { headers })

		this.ws.on('open', () => {
			this.callbacks.log('debug', 'WebSocket connected')
			this.callbacks.onConnectionChange('connected')
			this.subscribe()
			this.startPing()
		})

		this.ws.on('message', (data: WebSocket.RawData) => {
			this.handleMessage(data)
		})

		this.ws.on('close', (code: number, reason: Buffer) => {
			this.callbacks.log('debug', `WebSocket closed: ${code} ${reason.toString()}`)
			this.callbacks.onConnectionChange('disconnected')
			this.scheduleReconnect()
		})

		this.ws.on('error', (err: Error) => {
			this.callbacks.log('warn', `WebSocket error: ${err.message}`)
			this.callbacks.onConnectionChange('error')
		})

		this.ws.on('pong', () => {
			if (this.pongTimeout) {
				clearTimeout(this.pongTimeout)
				this.pongTimeout = null
			}
		})
	}

	destroy(): void {
		this.destroyed = true
		this.cleanup()
	}

	private cleanup(): void {
		if (this.pingTimer) clearInterval(this.pingTimer)
		if (this.pongTimeout) clearTimeout(this.pongTimeout)
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
		this.pingTimer = null
		this.pongTimeout = null
		this.reconnectTimer = null

		if (this.ws) {
			this.ws.removeAllListeners()
			if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
				this.ws.close()
			}
			this.ws = null
		}
	}

	private subscribe(): void {
		const subscriptions: Array<{ path: string; method: 'full' | 'changes' }> = [
			{ path: '/api/device', method: 'full' },
			{ path: '/api/ports/port', method: 'changes' },
			{ path: '/api/groups/group', method: 'full' },
			{ path: '/api/trunks/trunk', method: 'full' },
			{ path: '/api/config/name', method: 'full' },
			{ path: '/api/config/profiles', method: 'changes' },
			{ path: '/api/poe/capable', method: 'full' },
			{ path: '/api/poe/ports', method: 'changes' },
		]

		for (const sub of subscriptions) {
			this.send({
				subscription: {
					path: sub.path,
					action: 'add',
					method: sub.method,
				},
			})
		}
	}

	private send(msg: unknown): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(msg))
		}
	}

	private startPing(): void {
		this.pingTimer = setInterval(() => {
			if (this.ws?.readyState === WebSocket.OPEN) {
				this.ws.ping()
				this.pongTimeout = setTimeout(() => {
					this.callbacks.log('warn', 'WebSocket pong timeout, reconnecting')
					this.ws?.terminate()
				}, PING_TIMEOUT)
			}
		}, PING_INTERVAL)
	}

	private scheduleReconnect(): void {
		if (this.destroyed) return
		this.cleanup()
		this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY)
	}

	private handleMessage(raw: WebSocket.RawData): void {
		let msg: Record<string, unknown>
		try {
			msg = JSON.parse(raw.toString()) as Record<string, unknown>
		} catch {
			this.callbacks.log('warn', 'WebSocket received non-JSON message')
			return
		}

		const path =
			(msg.path as string) ??
			((msg.subscription as Record<string, unknown> | undefined)?.path as string | undefined)
		const data = msg.data ?? msg

		if (!path) return

		const normalizedPath = path.replace(/^\/api\//, '') as WsUpdatePath
		this.callbacks.onUpdate(normalizedPath, data)
	}
}
