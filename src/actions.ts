import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import type { GroupInfo, PortInfo, ProfileInfo, TrunkInfo } from './types.js'

export enum ActionId {
	RecallProfile = 'recall_profile',
	SaveProfile = 'save_profile',
	SetPortGroup = 'set_port_group',
	SetPortTrunk = 'set_port_trunk',
	TogglePort = 'toggle_port',
	TogglePoe = 'toggle_poe',
	Identify = 'identify',
	Reboot = 'reboot',
}

export function UpdateActions(self: ModuleInstance): void {
	const portChoices = buildPortChoices(self.state.ports)
	const groupChoices = buildGroupChoices(self.state.groups)
	const trunkChoices = buildTrunkChoices(self.state.trunks)
	const profileChoices = buildProfileChoices(self.state.profiles)

	const actions: CompanionActionDefinitions = {
		[ActionId.RecallProfile]: {
			name: 'Recall Profile',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Profile',
					choices: profileChoices,
					default: profileChoices[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				try {
					await self.api!.recallProfile(action.options.slot as number)
					self.log('info', `Recalled profile slot ${action.options.slot}`)
					await self.poll()
				} catch (e) {
					self.log('error', `Recall profile failed: ${(e as Error).message}`)
				}
			},
		},

		[ActionId.SaveProfile]: {
			name: 'Save Profile',
			options: [
				{
					id: 'slot',
					type: 'number',
					label: 'Profile Slot',
					default: 1,
					min: 1,
					max: 40,
				},
				{
					id: 'name',
					type: 'textinput',
					label: 'Profile Name (optional)',
					default: '',
				},
			],
			callback: async (action) => {
				try {
					const name = (action.options.name as string) || undefined
					await self.api!.saveProfile(action.options.slot as number, name)
					self.log('info', `Saved profile to slot ${action.options.slot}`)
					await self.poll()
				} catch (e) {
					self.log('error', `Save profile failed: ${(e as Error).message}`)
				}
			},
		},

		[ActionId.SetPortGroup]: {
			name: 'Set Port Group',
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					choices: portChoices,
					default: portChoices[0]?.id ?? 1,
				},
				{
					id: 'group',
					type: 'dropdown',
					label: 'Group',
					choices: groupChoices,
					default: groupChoices[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				try {
					await self.api!.setPortMemberOf(action.options.port as number, action.options.group as number, 'group')
					await self.poll()
				} catch (e) {
					self.log('error', `Set port group failed: ${(e as Error).message}`)
				}
			},
		},

		[ActionId.SetPortTrunk]: {
			name: 'Set Port Trunk',
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					choices: portChoices,
					default: portChoices[0]?.id ?? 1,
				},
				{
					id: 'trunk',
					type: 'dropdown',
					label: 'Trunk',
					choices: trunkChoices,
					default: trunkChoices[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				try {
					await self.api!.setPortMemberOf(action.options.port as number, action.options.trunk as number, 'trunk')
					await self.poll()
				} catch (e) {
					self.log('error', `Set port trunk failed: ${(e as Error).message}`)
				}
			},
		},

		[ActionId.TogglePort]: {
			name: 'Toggle Port Enabled',
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					choices: portChoices,
					default: portChoices[0]?.id ?? 1,
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'toggle',
				},
			],
			callback: async (action) => {
				try {
					let enabled: boolean
					if (action.options.state === 'toggle') {
						const port = self.state.ports.find((p) => p.port_number === action.options.port)
						enabled = !port?.enabled
					} else {
						enabled = action.options.state === 'on'
					}
					await self.api!.setPortEnabled(action.options.port as number, enabled)
					await self.poll()
				} catch (e) {
					self.log('error', `Toggle port failed: ${(e as Error).message}`)
				}
			},
		},

		[ActionId.TogglePoe]: {
			name: 'Toggle PoE',
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					choices: portChoices,
					default: portChoices[0]?.id ?? 1,
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'toggle',
				},
			],
			callback: async (action) => {
				if (!self.state.poeCapable) {
					self.log('warn', 'Device does not support PoE')
					return
				}
				try {
					let enabled: boolean
					if (action.options.state === 'toggle') {
						const poePort = self.state.poePorts.find((p) => p.port_number === action.options.port)
						enabled = !poePort?.enabled
					} else {
						enabled = action.options.state === 'on'
					}
					await self.api!.setPoeEnabled(action.options.port as number, enabled)
					await self.poll()
				} catch (e) {
					self.log('error', `Toggle PoE failed: ${(e as Error).message}`)
				}
			},
		},

		[ActionId.Identify]: {
			name: 'Identify Device',
			options: [
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 10,
					min: 0,
					max: 30000,
				},
			],
			callback: async (action) => {
				try {
					await self.api!.identify(action.options.duration as number)
				} catch (e) {
					self.log('error', `Identify failed: ${(e as Error).message}`)
				}
			},
		},

		[ActionId.Reboot]: {
			name: 'Reboot Device',
			options: [],
			callback: async () => {
				try {
					await self.api!.reboot()
					self.log('warn', 'Device is rebooting')
				} catch (e) {
					self.log('error', `Reboot failed: ${(e as Error).message}`)
				}
			},
		},
	}

	self.setActionDefinitions(actions)
}

function buildPortChoices(ports: PortInfo[]) {
	if (!ports.length) return [{ id: 1, label: 'Port 1' }]
	return ports.map((p) => ({ id: p.port_number, label: p.legend || `Port ${p.port_number}` }))
}

function buildGroupChoices(groups: GroupInfo[]) {
	if (!groups.length) return [{ id: 1, label: 'Group 1' }]
	return groups.map((g) => ({ id: g.group_id, label: g.name || `Group ${g.group_id}` }))
}

function buildTrunkChoices(trunks: TrunkInfo[]) {
	if (!trunks.length) return [{ id: 1, label: 'Trunk 1' }]
	return trunks.map((t) => ({ id: t.trunk_id, label: t.name || `Trunk ${t.trunk_id}` }))
}

function buildProfileChoices(profiles: ProfileInfo[]) {
	if (!profiles.length) return [{ id: 1, label: 'Slot 1' }]
	return profiles
		.filter((p) => p.name)
		.map((p) => ({ id: p.slot, label: p.name || `Slot ${p.slot}` }))
}
