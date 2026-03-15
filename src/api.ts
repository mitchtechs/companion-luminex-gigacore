import type { DeviceInfo, GigaCoreApiInterface, GroupInfo, PoePortInfo, PortInfo, ProfileInfo, TrunkInfo } from './types.js'

/**
 * Luminex GigaCore Gen2 REST API client
 */
export class GigaCoreApi implements GigaCoreApiInterface {
	private host: string
	private authHeader: string | null

	constructor(host: string, password: string) {
		this.host = host
		this.authHeader = password ? 'Basic ' + Buffer.from('admin:' + password).toString('base64') : null
	}

	get baseUrl(): string {
		return `http://${this.host}/api`
	}

	get supportsWebSocket(): boolean {
		return true
	}

	private headers(): Record<string, string> {
		const h: Record<string, string> = { Accept: 'application/json' }
		if (this.authHeader) {
			h['Authorization'] = this.authHeader
		}
		return h
	}

	private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
		const url = `${this.baseUrl}${path}`
		const opts: RequestInit = {
			method,
			headers: this.headers(),
		}
		if (body !== undefined) {
			;(opts.headers as Record<string, string>)['Content-Type'] = 'application/json'
			opts.body = JSON.stringify(body)
		}
		const res = await fetch(url, opts)
		if (!res.ok) {
			throw new Error(`API ${method} ${path} failed: ${res.status} ${res.statusText}`)
		}
		const text = await res.text()
		return text ? (JSON.parse(text) as T) : (null as T)
	}

	private async get<T>(path: string): Promise<T> {
		return this.request<T>('GET', path)
	}

	private async put<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>('PUT', path, body)
	}

	// --- Device ---

	async getDevice(): Promise<DeviceInfo> {
		return this.get('/device')
	}

	async identify(duration = 10): Promise<void> {
		await this.put('/identify', { duration })
	}

	async reboot(wait = 0): Promise<void> {
		await this.put('/reboot', { wait })
	}

	async reset({ keepIp = true, keepProfiles = true, wait = 0 } = {}): Promise<void> {
		await this.put('/reset', { keep_ip: keepIp, keep_profiles: keepProfiles, wait })
	}

	// --- Ports ---

	async getPorts(): Promise<PortInfo[]> {
		return this.get('/ports/port')
	}

	async setPortEnabled(portNr: number, enabled: boolean): Promise<void> {
		await this.put(`/ports/port/${portNr}/enabled`, { enabled })
	}

	async setPortMemberOf(portNr: number, id: number, type: 'group' | 'trunk'): Promise<void> {
		await this.put(`/ports/port/${portNr}/member_of`, { id, type })
	}

	// --- Groups & Trunks ---

	async getGroups(): Promise<GroupInfo[]> {
		return this.get('/groups/group')
	}

	async getTrunks(): Promise<TrunkInfo[]> {
		return this.get('/trunks/trunk')
	}

	// --- Profiles ---

	async getActiveProfileName(): Promise<{ name: string }> {
		return this.get('/config/name')
	}

	async getProfiles(): Promise<ProfileInfo[]> {
		return this.get('/config/profiles')
	}

	async recallProfile(slot: number): Promise<void> {
		await this.put(`/config/profiles/${slot}/recall`)
	}

	async saveProfile(slot: number, name?: string): Promise<void> {
		await this.put(`/config/profiles/${slot}/save`, name ? { name } : undefined)
	}

	// --- PoE ---

	async getPoeCapable(): Promise<boolean> {
		return this.get('/poe/capable')
	}

	async getPoePorts(): Promise<PoePortInfo[]> {
		return this.get('/poe/ports')
	}

	async setPoeEnabled(portNr: number, enabled: boolean): Promise<void> {
		await this.put(`/poe/ports/${portNr}/enabled`, { enabled })
	}
}
