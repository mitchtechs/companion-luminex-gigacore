/**
 * Luminex GigaCore Gen1 REST API client
 *
 * Gen1 devices: GigaCore 10, 12, 14R, 16Xt, 16RFO, 26i
 * Uses pipe-delimited responses and form-encoded POST bodies.
 * No WebSocket support - polling only.
 */

export class GigaCoreGen1Api {
	#host
	#authHeader

	constructor(host, password) {
		this.#host = host
		this.#authHeader = password ? 'Basic ' + Buffer.from('admin:' + password).toString('base64') : null
	}

	get baseUrl() {
		return `http://${this.#host}`
	}

	get supportsWebSocket() {
		return false
	}

	#headers(contentType) {
		const h = { Accept: '*/*' }
		if (this.#authHeader) {
			h['Authorization'] = this.#authHeader
		}
		if (contentType) {
			h['Content-Type'] = contentType
		}
		return h
	}

	async #get(path) {
		const res = await fetch(`${this.baseUrl}${path}`, {
			method: 'GET',
			headers: this.#headers(),
		})
		if (!res.ok) {
			throw new Error(`Gen1 GET ${path} failed: ${res.status} ${res.statusText}`)
		}
		return res.text()
	}

	async #post(path, params) {
		const body = new URLSearchParams(params).toString()
		const res = await fetch(`${this.baseUrl}${path}`, {
			method: 'POST',
			headers: this.#headers('application/x-www-form-urlencoded'),
			body,
		})
		if (!res.ok) {
			throw new Error(`Gen1 POST ${path} failed: ${res.status} ${res.statusText}`)
		}
		return res.text()
	}

	// --- Device ---

	async getDevice() {
		const raw = await this.#get('/config/switchlegend')
		// Format: "name|description|serial|mac"
		const parts = raw.trim().split('|')
		return {
			name: parts[0] ?? '',
			description: parts[1] ?? '',
			serial: parts[2] ?? '',
			mac_address: parts[3] ?? '',
			model: 'GigaCore (Gen1)',
		}
	}

	async identify(duration = 10) {
		await this.#post('/config/lmx', { identify: duration })
	}

	async reboot(_wait = 0) {
		await this.#post('/config/misc', { reboot: 1 })
	}

	async reset({ keepIp = true, keepProfiles = true } = {}) {
		const params = { factory_reset: 1 }
		if (keepIp) params.keep_ip = 1
		if (keepProfiles) params.keep_profiles = 1
		await this.#post('/config/misc', params)
	}

	// --- Ports ---

	async getPorts() {
		const [portsRaw, legendsRaw, protectRaw] = await Promise.all([
			this.#get('/config/ports'),
			this.#get('/config/portlegend'),
			this.#get('/config/portprotect').catch(() => ''),
		])

		const legends = legendsRaw.trim().split('|')
		const protections = protectRaw.trim().split('|')

		// ports format: each port is "port_nr|enabled|link_state" separated by newlines or similar
		// The exact format varies, but commonly: "enabled1|link1|enabled2|link2|..."
		// We'll parse assuming pipe-delimited flat list: enabled, link pairs per port
		const portValues = portsRaw.trim().split('|')
		const ports = []

		// Determine port count from legends (most reliable)
		const portCount = legends.length

		for (let i = 0; i < portCount; i++) {
			const enabled = portValues[i * 2] === '1'
			const linkRaw = portValues[i * 2 + 1] ?? '0'
			const linkState = linkRaw === '1' ? 'up' : 'down'

			ports.push({
				port_number: i + 1,
				legend: legends[i] || `Port ${i + 1}`,
				enabled,
				link_state: linkState,
				protected: protections[i] === '1',
				member_of: null, // filled in by getGroups
			})
		}

		return ports
	}

	async setPortEnabled(portNr, enabled) {
		await this.#post('/config/ports', {
			port: portNr,
			enabled: enabled ? 1 : 0,
		})
	}

	async setPortMemberOf(portNr, id, type) {
		await this.#post('/config/group_port', {
			port: portNr,
			[type]: id,
		})
	}

	// --- Groups & Trunks ---

	async getGroups() {
		const raw = await this.#get('/config/groups')
		// Format: "port1_group|port2_group|..." where values are group IDs
		// Group 0 = default, trunk assignments may be negative or use a separate range
		const values = raw.trim().split('|')

		// Build group list from unique IDs found
		const groupIds = new Set()
		const portAssignments = []

		for (let i = 0; i < values.length; i++) {
			const val = parseInt(values[i], 10)
			if (!isNaN(val) && val >= 0) {
				groupIds.add(val)
				portAssignments.push({ port: i + 1, groupId: val, type: 'group' })
			} else if (!isNaN(val) && val < 0) {
				// Negative values often represent trunk assignments
				portAssignments.push({ port: i + 1, groupId: Math.abs(val), type: 'trunk' })
			}
		}

		// Store port assignments for later merging in poll()
		this._lastPortAssignments = portAssignments

		return [...groupIds].map((id) => ({
			group_id: id,
			name: `Group ${id}`,
			color: null,
		}))
	}

	async getTrunks() {
		// Gen1 trunks are derived from the groups endpoint (negative values)
		// Already parsed in getGroups, return unique trunk IDs
		const trunkIds = new Set()
		if (this._lastPortAssignments) {
			for (const a of this._lastPortAssignments) {
				if (a.type === 'trunk') trunkIds.add(a.groupId)
			}
		}
		return [...trunkIds].map((id) => ({
			trunk_id: id,
			name: `Trunk ${id}`,
			color: null,
		}))
	}

	/**
	 * Merge port assignment data from getGroups() into port objects.
	 * Call this after both getPorts() and getGroups() have returned.
	 */
	mergePortAssignments(ports) {
		if (!this._lastPortAssignments) return ports
		for (const assignment of this._lastPortAssignments) {
			const port = ports.find((p) => p.port_number === assignment.port)
			if (port) {
				port.member_of = { id: assignment.groupId, type: assignment.type }
			}
		}
		return ports
	}

	// --- Profiles ---

	async getActiveProfileName() {
		const raw = await this.#get('/config/profile_name')
		return { name: raw.trim() }
	}

	async getProfiles() {
		const raw = await this.#get('/config/icfg_profile_list')
		// Format: "slot1_name|slot2_name|..." up to 10 slots
		const names = raw.trim().split('|')
		return names.map((name, i) => ({
			slot: i + 1,
			name: name || '',
			protected: false,
		}))
	}

	async recallProfile(slot) {
		await this.#post('/config/icfg_profile_activate', { profile: slot })
	}

	async saveProfile(slot, name) {
		const params = { profile: slot }
		if (name) params.name = name
		await this.#post('/config/icfg_profile_save', params)
	}

	// --- PoE ---

	async getPoeCapable() {
		try {
			const raw = await this.#get('/config/poe_config')
			// If the endpoint exists and returns data, PoE is supported
			return raw.trim().length > 0
		} catch {
			return false
		}
	}

	async getPoePorts() {
		const [configRaw, statusRaw] = await Promise.all([
			this.#get('/config/poe_config'),
			this.#get('/stat/poe_status').catch(() => ''),
		])

		const configs = configRaw.trim().split('|')
		const statuses = statusRaw.trim().split('|')

		return configs.map((val, i) => ({
			port_number: i + 1,
			enabled: val === '1',
			indication: statuses[i] === '1' ? 'sourcing' : 'disabled',
		}))
	}

	async setPoeEnabled(portNr, enabled) {
		await this.#post('/config/poe_config', {
			port: portNr,
			enabled: enabled ? 1 : 0,
		})
	}
}
