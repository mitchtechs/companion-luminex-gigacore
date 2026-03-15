/**
 * Luminex GigaCore Gen2 REST API client
 */

export class GigaCoreApi {
	#host
	#authHeader

	constructor(host, password) {
		this.#host = host
		this.#authHeader = password ? 'Basic ' + Buffer.from('admin:' + password).toString('base64') : null
	}

	get baseUrl() {
		return `http://${this.#host}/api`
	}

	get supportsWebSocket() {
		return true
	}

	#headers() {
		const h = { Accept: 'application/json' }
		if (this.#authHeader) {
			h['Authorization'] = this.#authHeader
		}
		return h
	}

	async #request(method, path, body) {
		const url = `${this.baseUrl}${path}`
		const opts = {
			method,
			headers: this.#headers(),
		}
		if (body !== undefined) {
			opts.headers['Content-Type'] = 'application/json'
			opts.body = JSON.stringify(body)
		}
		const res = await fetch(url, opts)
		if (!res.ok) {
			throw new Error(`API ${method} ${path} failed: ${res.status} ${res.statusText}`)
		}
		const text = await res.text()
		return text ? JSON.parse(text) : null
	}

	async get(path) {
		return this.#request('GET', path)
	}

	async put(path, body) {
		return this.#request('PUT', path, body)
	}

	// --- Device ---

	async getDevice() {
		return this.get('/device')
	}

	async identify(duration = 10) {
		return this.put('/identify', { duration })
	}

	async reboot(wait = 0) {
		return this.put('/reboot', { wait })
	}

	async reset({ keepIp = true, keepProfiles = true, wait = 0 } = {}) {
		return this.put('/reset', { keep_ip: keepIp, keep_profiles: keepProfiles, wait })
	}

	// --- Ports ---

	async getPorts() {
		return this.get('/ports/port')
	}

	async setPortEnabled(portNr, enabled) {
		return this.put(`/ports/port/${portNr}/enabled`, { enabled })
	}

	async setPortMemberOf(portNr, id, type) {
		return this.put(`/ports/port/${portNr}/member_of`, { id, type })
	}

	// --- Groups & Trunks ---

	async getGroups() {
		return this.get('/groups/group')
	}

	async getTrunks() {
		return this.get('/trunks/trunk')
	}

	// --- Profiles ---

	async getActiveProfileName() {
		return this.get('/config/name')
	}

	async getProfiles() {
		return this.get('/config/profiles')
	}

	async recallProfile(slot) {
		return this.put(`/config/profiles/${slot}/recall`)
	}

	async saveProfile(slot, name) {
		return this.put(`/config/profiles/${slot}/save`, name ? { name } : undefined)
	}

	// --- PoE ---

	async getPoeCapable() {
		return this.get('/poe/capable')
	}

	async getPoePorts() {
		return this.get('/poe/ports')
	}

	async setPoeEnabled(portNr, enabled) {
		return this.put(`/poe/ports/${portNr}/enabled`, { enabled })
	}
}
