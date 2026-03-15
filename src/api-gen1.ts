import type { DeviceInfo, GigaCoreApiInterface, GroupInfo, PoePortInfo, PortInfo, ProfileInfo, TrunkInfo } from './types.js'

interface PortAssignment {
	port: number
	groupId: number
	type: 'group' | 'trunk'
}

/**
 * Luminex GigaCore Gen1 REST API client
 *
 * Gen1 devices: GigaCore 10, 12, 14R, 16Xt, 16RFO, 26i
 * Uses pipe-delimited responses and form-encoded POST bodies.
 * No WebSocket support - polling only.
 */
export class GigaCoreGen1Api implements GigaCoreApiInterface {
	private host: string
	private authHeader: string | null
	private lastPortAssignments: PortAssignment[] = []

	constructor(host: string, password: string) {
		this.host = host
		this.authHeader = password ? 'Basic ' + Buffer.from('admin:' + password).toString('base64') : null
	}

	get baseUrl(): string {
		return `http://${this.host}`
	}

	get supportsWebSocket(): boolean {
		return false
	}

	private buildHeaders(contentType?: string): Record<string, string> {
		const h: Record<string, string> = { Accept: '*/*' }
		if (this.authHeader) {
			h['Authorization'] = this.authHeader
		}
		if (contentType) {
			h['Content-Type'] = contentType
		}
		return h
	}

	private async httpGet(path: string): Promise<string> {
		const res = await fetch(`${this.baseUrl}${path}`, {
			method: 'GET',
			headers: this.buildHeaders(),
		})
		if (!res.ok) {
			throw new Error(`Gen1 GET ${path} failed: ${res.status} ${res.statusText}`)
		}
		return res.text()
	}

	private async httpPost(path: string, params: Record<string, string | number>): Promise<string> {
		const body = new URLSearchParams(
			Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
		).toString()
		const res = await fetch(`${this.baseUrl}${path}`, {
			method: 'POST',
			headers: this.buildHeaders('application/x-www-form-urlencoded'),
			body,
		})
		if (!res.ok) {
			throw new Error(`Gen1 POST ${path} failed: ${res.status} ${res.statusText}`)
		}
		return res.text()
	}

	// --- Device ---

	async getDevice(): Promise<DeviceInfo> {
		const raw = await this.httpGet('/config/switchlegend')
		const parts = raw.trim().split('|')
		return {
			name: parts[0] ?? '',
			description: parts[1] ?? '',
			serial: parts[2] ?? '',
			mac_address: parts[3] ?? '',
			model: 'GigaCore (Gen1)',
		}
	}

	async identify(duration = 10): Promise<void> {
		await this.httpPost('/config/lmx', { identify: duration })
	}

	async reboot(_wait = 0): Promise<void> {
		await this.httpPost('/config/misc', { reboot: 1 })
	}

	async reset({ keepIp = true, keepProfiles = true } = {}): Promise<void> {
		const params: Record<string, number> = { factory_reset: 1 }
		if (keepIp) params.keep_ip = 1
		if (keepProfiles) params.keep_profiles = 1
		await this.httpPost('/config/misc', params)
	}

	// --- Ports ---

	async getPorts(): Promise<PortInfo[]> {
		const [portsRaw, legendsRaw, protectRaw] = await Promise.all([
			this.httpGet('/config/ports'),
			this.httpGet('/config/portlegend'),
			this.httpGet('/config/portprotect').catch(() => ''),
		])

		const legends = legendsRaw.trim().split('|')
		const protections = protectRaw.trim().split('|')
		const portValues = portsRaw.trim().split('|')
		const ports: PortInfo[] = []
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
				member_of: null,
			})
		}

		return ports
	}

	async setPortEnabled(portNr: number, enabled: boolean): Promise<void> {
		await this.httpPost('/config/ports', { port: portNr, enabled: enabled ? 1 : 0 })
	}

	async setPortMemberOf(portNr: number, id: number, type: 'group' | 'trunk'): Promise<void> {
		await this.httpPost('/config/group_port', { port: portNr, [type]: id })
	}

	// --- Groups & Trunks ---

	async getGroups(): Promise<GroupInfo[]> {
		const raw = await this.httpGet('/config/groups')
		const values = raw.trim().split('|')

		const groupIds = new Set<number>()
		const portAssignments: PortAssignment[] = []

		for (let i = 0; i < values.length; i++) {
			const val = parseInt(values[i], 10)
			if (isNaN(val)) continue

			if (val >= 0) {
				groupIds.add(val)
				portAssignments.push({ port: i + 1, groupId: val, type: 'group' })
			} else {
				portAssignments.push({ port: i + 1, groupId: Math.abs(val), type: 'trunk' })
			}
		}

		this.lastPortAssignments = portAssignments

		return [...groupIds].map((id) => ({
			group_id: id,
			name: `Group ${id}`,
			color: null,
		}))
	}

	async getTrunks(): Promise<TrunkInfo[]> {
		const trunkIds = new Set<number>()
		for (const a of this.lastPortAssignments) {
			if (a.type === 'trunk') trunkIds.add(a.groupId)
		}
		return [...trunkIds].map((id) => ({
			trunk_id: id,
			name: `Trunk ${id}`,
			color: null,
		}))
	}

	mergePortAssignments(ports: PortInfo[]): PortInfo[] {
		for (const assignment of this.lastPortAssignments) {
			const port = ports.find((p) => p.port_number === assignment.port)
			if (port) {
				port.member_of = { id: assignment.groupId, type: assignment.type }
			}
		}
		return ports
	}

	// --- Profiles ---

	async getActiveProfileName(): Promise<{ name: string }> {
		const raw = await this.httpGet('/config/profile_name')
		return { name: raw.trim() }
	}

	async getProfiles(): Promise<ProfileInfo[]> {
		const raw = await this.httpGet('/config/icfg_profile_list')
		const names = raw.trim().split('|')
		return names.map((name, i) => ({
			slot: i + 1,
			name: name || '',
			protected: false,
		}))
	}

	async recallProfile(slot: number): Promise<void> {
		await this.httpPost('/config/icfg_profile_activate', { profile: slot })
	}

	async saveProfile(slot: number, name?: string): Promise<void> {
		const params: Record<string, string | number> = { profile: slot }
		if (name) params.name = name
		await this.httpPost('/config/icfg_profile_save', params)
	}

	// --- PoE ---

	async getPoeCapable(): Promise<boolean> {
		try {
			const raw = await this.httpGet('/config/poe_config')
			return raw.trim().length > 0
		} catch {
			return false
		}
	}

	async getPoePorts(): Promise<PoePortInfo[]> {
		const [configRaw, statusRaw] = await Promise.all([
			this.httpGet('/config/poe_config'),
			this.httpGet('/stat/poe_status').catch(() => ''),
		])

		const configs = configRaw.trim().split('|')
		const statuses = statusRaw.trim().split('|')

		return configs.map((val, i) => ({
			port_number: i + 1,
			enabled: val === '1',
			indication: statuses[i] === '1' ? 'sourcing' : 'disabled',
		}))
	}

	async setPoeEnabled(portNr: number, enabled: boolean): Promise<void> {
		await this.httpPost('/config/poe_config', { port: portNr, enabled: enabled ? 1 : 0 })
	}
}
