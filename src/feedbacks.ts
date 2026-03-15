import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import type { PortInfo } from './types.js'
import { Green, White, Blue, Amber, Red, Black } from './colors.js'

export enum FeedbackId {
	PortEnabled = 'port_enabled',
	PortLinkUp = 'port_link_up',
	PortInGroup = 'port_in_group',
	ActiveProfile = 'active_profile',
	PoeActive = 'poe_active',
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const portChoices = buildPortChoices(self.state.ports)

	const feedbacks: CompanionFeedbackDefinitions = {
		[FeedbackId.PortEnabled]: {
			name: 'Port Enabled',
			type: 'boolean',
			description: 'True when the specified port is enabled',
			defaultStyle: {
				bgcolor: Green,
				color: White,
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
				const port = self.state.ports.find((p) => p.port_number === feedback.options.port)
				return port?.enabled === true
			},
		},

		[FeedbackId.PortLinkUp]: {
			name: 'Port Link Up',
			type: 'boolean',
			description: 'True when the specified port has an active link',
			defaultStyle: {
				bgcolor: Green,
				color: White,
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
				const port = self.state.ports.find((p) => p.port_number === feedback.options.port)
				return port?.link_state === 'up'
			},
		},

		[FeedbackId.PortInGroup]: {
			name: 'Port in Group',
			type: 'boolean',
			description: 'True when the specified port is assigned to the specified group',
			defaultStyle: {
				bgcolor: Blue,
				color: White,
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
				const port = self.state.ports.find((p) => p.port_number === feedback.options.port)
				return port?.member_of?.type === 'group' && port?.member_of?.id === feedback.options.group
			},
		},

		[FeedbackId.ActiveProfile]: {
			name: 'Active Profile',
			type: 'boolean',
			description: 'True when the specified profile is the active one',
			defaultStyle: {
				bgcolor: Amber,
				color: Black,
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

		[FeedbackId.PoeActive]: {
			name: 'PoE Active',
			type: 'boolean',
			description: 'True when PoE is enabled on the specified port',
			defaultStyle: {
				bgcolor: Red,
				color: White,
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
				const poePort = self.state.poePorts.find((p) => p.port_number === feedback.options.port)
				return poePort?.enabled === true
			},
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}

function buildPortChoices(ports: PortInfo[]) {
	if (!ports.length) return [{ id: 1, label: 'Port 1' }]
	return ports.map((p) => ({ id: p.port_number, label: p.legend || `Port ${p.port_number}` }))
}
