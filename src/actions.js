export function updateActionDefinitions(self) {
	const portChoices = buildPortChoices(self)
	const groupChoices = buildGroupChoices(self)
	const trunkChoices = buildTrunkChoices(self)
	const profileChoices = buildProfileChoices(self)

	self.setActionDefinitions({
		recall_profile: {
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
					await self.api.recallProfile(action.options.slot)
					self.log('info', `Recalled profile slot ${action.options.slot}`)
					await self.poll()
				} catch (e) {
					self.log('error', `Recall profile failed: ${e.message}`)
				}
			},
		},

		save_profile: {
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
					await self.api.saveProfile(action.options.slot, action.options.name || undefined)
					self.log('info', `Saved profile to slot ${action.options.slot}`)
					await self.poll()
				} catch (e) {
					self.log('error', `Save profile failed: ${e.message}`)
				}
			},
		},

		set_port_group: {
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
					await self.api.setPortMemberOf(action.options.port, action.options.group, 'group')
					await self.poll()
				} catch (e) {
					self.log('error', `Set port group failed: ${e.message}`)
				}
			},
		},

		set_port_trunk: {
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
					await self.api.setPortMemberOf(action.options.port, action.options.trunk, 'trunk')
					await self.poll()
				} catch (e) {
					self.log('error', `Set port trunk failed: ${e.message}`)
				}
			},
		},

		toggle_port: {
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
					let enabled
					if (action.options.state === 'toggle') {
						const port = self.state.ports?.find((p) => p.port_number === action.options.port)
						enabled = !port?.enabled
					} else {
						enabled = action.options.state === 'on'
					}
					await self.api.setPortEnabled(action.options.port, enabled)
					await self.poll()
				} catch (e) {
					self.log('error', `Toggle port failed: ${e.message}`)
				}
			},
		},

		toggle_poe: {
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
					let enabled
					if (action.options.state === 'toggle') {
						const poePort = self.state.poePorts?.find((p) => p.port_number === action.options.port)
						enabled = !poePort?.enabled
					} else {
						enabled = action.options.state === 'on'
					}
					await self.api.setPoeEnabled(action.options.port, enabled)
					await self.poll()
				} catch (e) {
					self.log('error', `Toggle PoE failed: ${e.message}`)
				}
			},
		},

		identify: {
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
					await self.api.identify(action.options.duration)
				} catch (e) {
					self.log('error', `Identify failed: ${e.message}`)
				}
			},
		},

		reboot: {
			name: 'Reboot Device',
			options: [],
			callback: async () => {
				try {
					await self.api.reboot()
					self.log('warn', 'Device is rebooting')
				} catch (e) {
					self.log('error', `Reboot failed: ${e.message}`)
				}
			},
		},
	})
}

function buildPortChoices(self) {
	if (!self.state?.ports?.length) {
		return [{ id: 1, label: 'Port 1' }]
	}
	return self.state.ports.map((p) => ({
		id: p.port_number,
		label: p.legend || `Port ${p.port_number}`,
	}))
}

function buildGroupChoices(self) {
	if (!self.state?.groups?.length) {
		return [{ id: 1, label: 'Group 1' }]
	}
	return self.state.groups.map((g) => ({
		id: g.group_id,
		label: g.name || `Group ${g.group_id}`,
	}))
}

function buildTrunkChoices(self) {
	if (!self.state?.trunks?.length) {
		return [{ id: 1, label: 'Trunk 1' }]
	}
	return self.state.trunks.map((t) => ({
		id: t.trunk_id,
		label: t.name || `Trunk ${t.trunk_id}`,
	}))
}

function buildProfileChoices(self) {
	if (!self.state?.profiles?.length) {
		return [{ id: 1, label: 'Slot 1' }]
	}
	return self.state.profiles
		.filter((p) => p.name)
		.map((p) => ({
			id: p.slot,
			label: p.name || `Slot ${p.slot}`,
		}))
}
