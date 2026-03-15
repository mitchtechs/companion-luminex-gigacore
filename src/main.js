import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base'
import { getConfigFields } from './config.js'
import { GigaCoreApi } from './api.js'
import { updateActionDefinitions } from './actions.js'
import { updateFeedbackDefinitions } from './feedbacks.js'
import { updateVariableDefinitions, updateVariableValues } from './variables.js'
import { updatePresetDefinitions } from './presets.js'
import { UpgradeScripts } from './upgrades.js'

class LuminexGigaCoreInstance extends InstanceBase {
	api = null
	pollTimer = null

	state = {
		device: null,
		ports: [],
		groups: [],
		trunks: [],
		profiles: [],
		activeProfile: '',
		poeCapable: false,
		poePorts: [],
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)

		this.initApi()
		this.initDefinitions()
		await this.poll()
		this.startPolling()
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		this.initApi()
		this.updateStatus(InstanceStatus.Connecting)
		await this.poll()
		this.refreshDefinitions()
		this.startPolling()
	}

	getConfigFields() {
		return getConfigFields()
	}

	async destroy() {
		this.stopPolling()
	}

	initApi() {
		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No host configured')
			return
		}
		this.api = new GigaCoreApi(this.config.host, this.config.password)
	}

	initDefinitions() {
		updateActionDefinitions(this)
		updateFeedbackDefinitions(this)
		updateVariableDefinitions(this)
		updatePresetDefinitions(this)
	}

	refreshDefinitions() {
		updateActionDefinitions(this)
		updateFeedbackDefinitions(this)
		updateVariableDefinitions(this)
		updateVariableValues(this)
		updatePresetDefinitions(this)
		this.checkFeedbacks()
	}

	startPolling() {
		this.stopPolling()
		const interval = this.config.pollInterval ?? 5000
		this.pollTimer = setInterval(() => this.poll(), interval)
	}

	stopPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = null
		}
	}

	async poll() {
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

			const portCountChanged = this.state.ports?.length !== ports?.length
			const groupCountChanged = this.state.groups?.length !== groups?.length

			this.state.device = device
			this.state.ports = ports ?? []
			this.state.groups = groups ?? []
			this.state.trunks = trunks ?? []
			this.state.activeProfile = typeof profileName === 'string' ? profileName : profileName?.name ?? ''
			this.state.profiles = profiles ?? []

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

			// If the shape of data changed, rebuild definitions (new ports/groups discovered)
			if (portCountChanged || groupCountChanged) {
				this.refreshDefinitions()
			} else {
				updateVariableValues(this)
				this.checkFeedbacks()
			}

			this.updateStatus(InstanceStatus.Ok)
		} catch (e) {
			this.log('error', `Poll failed: ${e.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, e.message)
		}
	}
}

runEntrypoint(LuminexGigaCoreInstance, UpgradeScripts)
