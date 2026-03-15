import WebSocket from 'ws'

/**
 * GigaCore Gen2 WebSocket client for real-time state updates.
 *
 * Connects to ws://{host}/api/ws and subscribes to state change events.
 * Falls back gracefully if WebSocket connection fails (polling continues).
 */

const PING_INTERVAL = 5000
const PING_TIMEOUT = 3500
const RECONNECT_DELAY = 5000

export class GigaCoreWebSocket {
	#host
	#password
	#ws = null
	#pingTimer = null
	#pongTimeout = null
	#reconnectTimer = null
	#destroyed = false
	#onUpdate
	#onConnectionChange
	#log

	constructor({ host, password, onUpdate, onConnectionChange, log }) {
		this.#host = host
		this.#password = password
		this.#onUpdate = onUpdate
		this.#onConnectionChange = onConnectionChange
		this.#log = log
	}

	connect() {
		if (this.#destroyed) return
		this.#cleanup()

		const url = `ws://${this.#host}/api/ws`
		this.#log('debug', `WebSocket connecting to ${url}`)

		this.#ws = new WebSocket(url, {
			headers: this.#password
				? { Authorization: 'Basic ' + Buffer.from('admin:' + this.#password).toString('base64') }
				: {},
		})

		this.#ws.on('open', () => {
			this.#log('debug', 'WebSocket connected')
			this.#onConnectionChange('connected')
			this.#subscribe()
			this.#startPing()
		})

		this.#ws.on('message', (data) => {
			this.#handleMessage(data)
		})

		this.#ws.on('close', (code, reason) => {
			this.#log('debug', `WebSocket closed: ${code} ${reason}`)
			this.#onConnectionChange('disconnected')
			this.#scheduleReconnect()
		})

		this.#ws.on('error', (err) => {
			this.#log('warn', `WebSocket error: ${err.message}`)
			this.#onConnectionChange('error')
		})

		this.#ws.on('pong', () => {
			clearTimeout(this.#pongTimeout)
			this.#pongTimeout = null
		})
	}

	destroy() {
		this.#destroyed = true
		this.#cleanup()
	}

	#cleanup() {
		clearInterval(this.#pingTimer)
		clearTimeout(this.#pongTimeout)
		clearTimeout(this.#reconnectTimer)
		this.#pingTimer = null
		this.#pongTimeout = null
		this.#reconnectTimer = null

		if (this.#ws) {
			this.#ws.removeAllListeners()
			if (this.#ws.readyState === WebSocket.OPEN || this.#ws.readyState === WebSocket.CONNECTING) {
				this.#ws.close()
			}
			this.#ws = null
		}
	}

	#subscribe() {
		const subscriptions = [
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
			this.#send({
				subscription: {
					path: sub.path,
					action: 'add',
					method: sub.method,
				},
			})
		}
	}

	#send(msg) {
		if (this.#ws?.readyState === WebSocket.OPEN) {
			this.#ws.send(JSON.stringify(msg))
		}
	}

	#startPing() {
		this.#pingTimer = setInterval(() => {
			if (this.#ws?.readyState === WebSocket.OPEN) {
				this.#ws.ping()
				this.#pongTimeout = setTimeout(() => {
					this.#log('warn', 'WebSocket pong timeout, reconnecting')
					this.#ws?.terminate()
				}, PING_TIMEOUT)
			}
		}, PING_INTERVAL)
	}

	#scheduleReconnect() {
		if (this.#destroyed) return
		this.#cleanup()
		this.#reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY)
	}

	#handleMessage(raw) {
		let msg
		try {
			msg = JSON.parse(raw.toString())
		} catch {
			this.#log('warn', `WebSocket received non-JSON message`)
			return
		}

		// Subscription responses contain a "path" and "data" field
		const path = msg.path ?? msg.subscription?.path
		const data = msg.data ?? msg

		if (!path) return

		// Normalize path - strip leading /api/
		const normalizedPath = path.replace(/^\/api\//, '')

		this.#onUpdate(normalizedPath, data)
	}
}
