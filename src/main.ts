import { InstanceBase, InstanceStatus, type SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { GigaCoreApi } from './api.js'
import { GigaCoreGen1Api } from './api-gen1.js'
import { GigaCoreWebSocket, type WsUpdatePath } from './websocket.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdateVariableDefinitions, UpdateVariableValues } from './variables.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'
import type { GigaCoreApiInterface, GigaCoreState, PoePortInfo, PortInfo, ProfileInfo } from './types.js'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig
	api: GigaCoreApiInterface | null = null
	private ws: GigaCoreWebSocket | null = null
	private pollTimer: ReturnType<typeof setInterval> | null = null

	state: GigaCoreState = {
		device: null,
		ports: [],
		groups: [],
		trunks: [],
		profiles: [],
		activeProfile: '',
		poeCapable: false,
		poePorts: [],
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)

		this.initApi()
		this.initDefinitions()
		await this.poll()
		this.startPolling()
		this.connectWebSocket()
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.destroyConnections()
		this.initApi()
		this.updateStatus(InstanceStatus.Connecting)
		await this.poll()
		this.refreshDefinitions()
		this.startPolling()
		this.connectWebSocket()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	async destroy(): Promise<void> {
		this.destroyConnections()
	}

	private destroyConnections(): void {
		this.stopPolling()
		if (this.ws) {
			this.ws.destroy()
			this.ws = null
		}
	}

	private initApi(): void {
		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No host configured')
			return
		}

		if (this.config.generation === 'gen1') {
			this.api = new GigaCoreGen1Api(this.config.host, this.config.password)
		} else {
			this.api = new GigaCoreApi(this.config.host, this.config.password)
		}
	}

	private connectWebSocket(): void {
		if (!this.api?.supportsWebSocket || !this.config.host) return

		this.ws = new GigaCoreWebSocket({
			host: this.config.host,
			password: this.config.password,
			onUpdate: (path, data) => this.handleWebSocketUpdate(path, data),
			onConnectionChange: (status) => this.handleWebSocketStatus(status),
			log: (level, msg) => this.log(level, msg),
		})
		this.ws.connect()
	}

	private handleWebSocketStatus(status: 'connected' | 'disconnected' | 'error'): void {
		if (status === 'connected') {
			this.log('debug', 'WebSocket connected - real-time updates active')
		} else {
			this.log('debug', 'WebSocket disconnected - falling back to polling')
		}
	}

	private handleWebSocketUpdate(path: WsUpdatePath, data: unknown): void {
		let changed = false

		switch (path) {
			case 'device':
				this.state.device = data as GigaCoreState['device']
				changed = true
				break

			case 'ports/port': {
				const updates = Array.isArray(data) ? (data as PortInfo[]) : [data as PortInfo]
				for (const update of updates) {
					const idx = this.state.ports.findIndex((p) => p.port_number === update.port_number)
					if (idx >= 0) {
						this.state.ports[idx] = { ...this.state.ports[idx], ...update }
					} else {
						this.state.ports.push(update)
					}
				}
				changed = true
				break
			}

			case 'groups/group':
				this.state.groups = Array.isArray(data)
					? (data as GigaCoreState['groups'])
					: [data as GigaCoreState['groups'][0]]
				changed = true
				break

			case 'trunks/trunk':
				this.state.trunks = Array.isArray(data)
					? (data as GigaCoreState['trunks'])
					: [data as GigaCoreState['trunks'][0]]
				changed = true
				break

			case 'config/name':
				this.state.activeProfile =
					typeof data === 'string' ? data : ((data as { name?: string })?.name ?? '')
				changed = true
				break

			case 'config/profiles': {
				const profileUpdates = Array.isArray(data)
					? (data as ProfileInfo[])
					: [data as ProfileInfo]
				for (const update of profileUpdates) {
					const idx = this.state.profiles.findIndex((p) => p.slot === update.slot)
					if (idx >= 0) {
						this.state.profiles[idx] = { ...this.state.profiles[idx], ...update }
					} else {
						this.state.profiles.push(update)
					}
				}
				changed = true
				break
			}

			case 'poe/capable':
				this.state.poeCapable = !!data
				changed = true
				break

			case 'poe/ports': {
				const poeUpdates = Array.isArray(data)
					? (data as PoePortInfo[])
					: [data as PoePortInfo]
				for (const update of poeUpdates) {
					const idx = this.state.poePorts.findIndex((p) => p.port_number === update.port_number)
					if (idx >= 0) {
						this.state.poePorts[idx] = { ...this.state.poePorts[idx], ...update }
					} else {
						this.state.poePorts.push(update)
					}
				}
				changed = true
				break
			}
		}

		if (changed) {
			UpdateVariableValues(this)
			this.checkFeedbacks()
		}
	}

	private initDefinitions(): void {
		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdateVariableDefinitions(this)
		UpdatePresets(this)
	}

	private refreshDefinitions(): void {
		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdateVariableDefinitions(this)
		UpdateVariableValues(this)
		UpdatePresets(this)
		this.checkFeedbacks()
	}

	private startPolling(): void {
		this.stopPolling()
		const interval = this.config.pollInterval ?? 5000
		this.pollTimer = setInterval(() => this.poll(), interval)
	}

	private stopPolling(): void {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = null
		}
	}

	async poll(): Promise<void> {
		if (!this.api) return

		try {
			const [device, ports, groups, trunks, profileName, profiles] = await Promise.all([
				this.api.getDevice(),
				this.api.getPorts(),
				this.api.getGroups(),
				this.api.getTrunks(),
				this.api.getActiveProfileName(),
				this.api.getProfiles(),
			])

			const portCountChanged = this.state.ports.length !== ports.length
			const groupCountChanged = this.state.groups.length !== groups.length

			this.state.device = device
			this.state.ports = ports ?? []
			this.state.groups = groups ?? []
			this.state.trunks = trunks ?? []
			this.state.activeProfile =
				typeof profileName === 'string' ? profileName : (profileName?.name ?? '')
			this.state.profiles = profiles ?? []

			// Gen1: merge group/trunk assignments into port objects
			if (this.api.mergePortAssignments) {
				this.api.mergePortAssignments(this.state.ports)
			}

			// Fetch PoE state if capable
			try {
				const poeCapable = await this.api.getPoeCapable()
				this.state.poeCapable = !!poeCapable
				if (this.state.poeCapable) {
					this.state.poePorts = (await this.api.getPoePorts()) ?? []
				}
			} catch {
				this.state.poeCapable = false
			}

			if (portCountChanged || groupCountChanged) {
				this.refreshDefinitions()
			} else {
				UpdateVariableValues(this)
				this.checkFeedbacks()
			}

			this.updateStatus(InstanceStatus.Ok)
		} catch (e) {
			this.log('error', `Poll failed: ${(e as Error).message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, (e as Error).message)
		}
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
