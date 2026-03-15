import { combineRgb } from '@companion-module/base'

export function updateFeedbackDefinitions(self) {
	const portChoices = buildPortChoices(self)
	const profileChoices = buildProfileChoices(self)

	self.setFeedbackDefinitions({
		port_enabled: {
			name: 'Port Enabled',
			type: 'boolean',
			description: 'True when the specified port is enabled',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					choices: portChoices,
					default: portChoices[0]?.id ?? 1,
				},
			],
			callback: (feedback) => {
				const port = self.state.ports?.find((p) => p.port_number === feedback.options.port)
				return port?.enabled === true
			},
		},

		port_link_up: {
			name: 'Port Link Up',
			type: 'boolean',
			description: 'True when the specified port has an active link',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					choices: portChoices,
					default: portChoices[0]?.id ?? 1,
				},
			],
			callback: (feedback) => {
				const port = self.state.ports?.find((p) => p.port_number === feedback.options.port)
				return port?.link_state === 'up'
			},
		},

		port_in_group: {
			name: 'Port in Group',
			type: 'boolean',
			description: 'True when the specified port is assigned to the specified group',
			defaultStyle: {
				bgcolor: combineRgb(0, 102, 204),
				color: combineRgb(255, 255, 255),
			},
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
					type: 'number',
					label: 'Group ID',
					default: 1,
					min: 1,
					max: 32,
				},
			],
			callback: (feedback) => {
				const port = self.state.ports?.find((p) => p.port_number === feedback.options.port)
				return port?.member_of?.type === 'group' && port?.member_of?.id === feedback.options.group
			},
		},

		active_profile: {
			name: 'Active Profile',
			type: 'boolean',
			description: 'True when the specified profile is the active one',
			defaultStyle: {
				bgcolor: combineRgb(204, 153, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'profile',
					type: 'textinput',
					label: 'Profile Name',
					default: '',
				},
			],
			callback: (feedback) => {
				return self.state.activeProfile === feedback.options.profile
			},
		},

		poe_active: {
			name: 'PoE Active',
			type: 'boolean',
			description: 'True when PoE is enabled and sourcing on the specified port',
			defaultStyle: {
				bgcolor: combineRgb(204, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					choices: portChoices,
					default: portChoices[0]?.id ?? 1,
				},
			],
			callback: (feedback) => {
				const poePort = self.state.poePorts?.find((p) => p.port_number === feedback.options.port)
				return poePort?.enabled === true
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

function buildProfileChoices(self) {
	if (!self.state?.profiles?.length) {
		return []
	}
	return self.state.profiles
		.filter((p) => p.name)
		.map((p) => ({
			id: p.slot,
			label: p.name || `Slot ${p.slot}`,
		}))
}
