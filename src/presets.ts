import type { CompanionPresetDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { ActionId } from './actions.js'
import { FeedbackId } from './feedbacks.js'
import { White, Black, DarkGrey, Grey, DarkGreen, ForestGreen, DarkRed, Blue, DarkBlue, Amber, Red } from './colors.js'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}

	// --- Profile recall presets ---
	for (const profile of self.state.profiles) {
		if (!profile.name) continue
		presets[`recall_profile_${profile.slot}`] = {
			type: 'button',
			category: 'Profiles',
			name: `Recall: ${profile.name}`,
			style: {
				text: profile.name,
				size: 'auto',
				color: White,
				bgcolor: DarkGrey,
			},
			steps: [
				{
					down: [{ actionId: ActionId.RecallProfile, options: { slot: profile.slot } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: FeedbackId.ActiveProfile,
					options: { profile: profile.name },
					style: { bgcolor: Amber, color: Black },
				},
			],
		}
	}

	// --- Port toggle presets ---
	for (const port of self.state.ports) {
		const n = port.port_number
		const label = port.legend || `Port ${n}`

		presets[`toggle_port_${n}`] = {
			type: 'button',
			category: 'Ports',
			name: `Toggle: ${label}`,
			style: {
				text: `${label}\\nOFF`,
				size: 'auto',
				color: White,
				bgcolor: DarkRed,
			},
			steps: [
				{
					down: [{ actionId: ActionId.TogglePort, options: { port: n, state: 'toggle' } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: FeedbackId.PortEnabled,
					options: { port: n },
					style: { text: `${label}\\nON`, bgcolor: DarkGreen, color: White },
				},
			],
		}

		presets[`port_link_${n}`] = {
			type: 'button',
			category: 'Port Status',
			name: `Link: ${label}`,
			style: {
				text: `${label}\\nNo Link`,
				size: 'auto',
				color: Grey,
				bgcolor: Black,
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: FeedbackId.PortLinkUp,
					options: { port: n },
					style: { text: `${label}\\nLinked`, bgcolor: ForestGreen, color: White },
				},
			],
		}
	}

	// --- Port-to-group assignment presets ---
	for (const group of self.state.groups) {
		const groupLabel = group.name || `Group ${group.group_id}`
		for (const port of self.state.ports) {
			const n = port.port_number
			const portLabel = port.legend || `Port ${n}`

			presets[`port_${n}_to_group_${group.group_id}`] = {
				type: 'button',
				category: `Assign to ${groupLabel}`,
				name: `${portLabel} → ${groupLabel}`,
				style: {
					text: `${portLabel}\\n→ ${groupLabel}`,
					size: 'auto',
					color: White,
					bgcolor: DarkGrey,
				},
				steps: [
					{
						down: [{ actionId: ActionId.SetPortGroup, options: { port: n, group: group.group_id } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: FeedbackId.PortInGroup,
						options: { port: n, group: group.group_id },
						style: { bgcolor: Blue, color: White },
					},
				],
			}
		}
	}

	// --- Identify preset ---
	presets['identify'] = {
		type: 'button',
		category: 'Device',
		name: 'Identify',
		style: {
			text: 'Identify',
			size: 'auto',
			color: White,
			bgcolor: DarkBlue,
		},
		steps: [
			{
				down: [{ actionId: ActionId.Identify, options: { duration: 10 } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	// --- Reboot preset ---
	presets['reboot'] = {
		type: 'button',
		category: 'Device',
		name: 'Reboot',
		style: {
			text: 'REBOOT',
			size: 'auto',
			color: White,
			bgcolor: Red,
		},
		steps: [
			{
				down: [{ actionId: ActionId.Reboot, options: {} }],
				up: [],
			},
		],
		feedbacks: [],
	}

	// --- PoE toggle presets ---
	if (self.state.poeCapable) {
		for (const poePort of self.state.poePorts) {
			const n = poePort.port_number
			const portData = self.state.ports.find((p) => p.port_number === n)
			const label = portData?.legend || `Port ${n}`

			presets[`toggle_poe_${n}`] = {
				type: 'button',
				category: 'PoE',
				name: `PoE: ${label}`,
				style: {
					text: `PoE\\n${label}\\nOFF`,
					size: 'auto',
					color: White,
					bgcolor: DarkGrey,
				},
				steps: [
					{
						down: [{ actionId: ActionId.TogglePoe, options: { port: n, state: 'toggle' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: FeedbackId.PoeActive,
						options: { port: n },
						style: { text: `PoE\\n${label}\\nON`, bgcolor: Red, color: White },
					},
				],
			}
		}
	}

	self.setPresetDefinitions(presets)
}
