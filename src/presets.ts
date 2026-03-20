import type { CompanionPresetDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { ActionId } from './actions.js'
import { FeedbackId } from './feedbacks.js'
import { White, Black, DarkGrey, Grey, DarkGreen, ForestGreen, DarkRed, Blue, DarkBlue, Amber, Red } from './colors.js'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}

	// ──────────────── Device ────────────────

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

	presets['device_info'] = {
		type: 'button',
		category: 'Device',
		name: 'Device Info',
		style: {
			text: `$(${self.label}:device_name)\\n$(${self.label}:device_model)`,
			size: 'auto',
			color: White,
			bgcolor: Black,
		},
		steps: [
			{
				down: [{ actionId: ActionId.Identify, options: { duration: 5 } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['active_profile_display'] = {
		type: 'button',
		category: 'Device',
		name: 'Active Profile',
		style: {
			text: `Profile\\n$(${self.label}:active_profile)`,
			size: 'auto',
			color: Amber,
			bgcolor: Black,
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	}

	// ──────────────── Profiles (Dynamic) ────────────────

	// Dynamic profile presets from device state
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

	// Static profile presets (slots 1-8) as fallback when no profiles are loaded
	if (self.state.profiles.filter((p) => p.name).length === 0) {
		for (let i = 1; i <= 8; i++) {
			presets[`recall_profile_static_${i}`] = {
				type: 'button',
				category: 'Profiles',
				name: `Recall Profile Slot ${i}`,
				style: {
					text: `Profile\\n${i}`,
					size: 'auto',
					color: White,
					bgcolor: DarkGrey,
				},
				steps: [
					{
						down: [{ actionId: ActionId.RecallProfile, options: { slot: i } }],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}

	// Save profile presets (always static — user picks the slot)
	for (let i = 1; i <= 8; i++) {
		presets[`save_profile_${i}`] = {
			type: 'button',
			category: 'Profiles',
			name: `Save to Slot ${i}`,
			style: {
				text: `Save\\nSlot ${i}`,
				size: 'auto',
				color: Amber,
				bgcolor: DarkGrey,
			},
			steps: [
				{
					down: [{ actionId: ActionId.SaveProfile, options: { slot: i, name: '' } }],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	// ──────────────── Ports (Dynamic) ────────────────

	// Dynamic port presets from device state
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
	}

	// Static port presets (1-16) as fallback when no ports loaded
	if (self.state.ports.length === 0) {
		for (let i = 1; i <= 16; i++) {
			presets[`toggle_port_static_${i}`] = {
				type: 'button',
				category: 'Ports',
				name: `Toggle Port ${i}`,
				style: {
					text: `Port ${i}\\nOFF`,
					size: 'auto',
					color: White,
					bgcolor: DarkRed,
				},
				steps: [
					{
						down: [{ actionId: ActionId.TogglePort, options: { port: i, state: 'toggle' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: FeedbackId.PortEnabled,
						options: { port: i },
						style: { text: `Port ${i}\\nON`, bgcolor: DarkGreen, color: White },
					},
				],
			}
		}
	}

	// Enable / Disable individual port presets (static, ports 1-16)
	for (let i = 1; i <= 16; i++) {
		const portLabel = self.state.ports.find((p) => p.port_number === i)?.legend || `Port ${i}`

		presets[`enable_port_${i}`] = {
			type: 'button',
			category: 'Port Enable/Disable',
			name: `Enable ${portLabel}`,
			style: {
				text: `${portLabel}\\nENABLE`,
				size: 'auto',
				color: White,
				bgcolor: DarkGreen,
			},
			steps: [
				{
					down: [{ actionId: ActionId.TogglePort, options: { port: i, state: 'on' } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: FeedbackId.PortEnabled,
					options: { port: i },
					style: { bgcolor: ForestGreen },
				},
			],
		}

		presets[`disable_port_${i}`] = {
			type: 'button',
			category: 'Port Enable/Disable',
			name: `Disable ${portLabel}`,
			style: {
				text: `${portLabel}\\nDISABLE`,
				size: 'auto',
				color: White,
				bgcolor: DarkRed,
			},
			steps: [
				{
					down: [{ actionId: ActionId.TogglePort, options: { port: i, state: 'off' } }],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	// ──────────────── Port Status ────────────────

	// Dynamic link status from device state
	for (const port of self.state.ports) {
		const n = port.port_number
		const label = port.legend || `Port ${n}`

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

	// Static link status presets (1-16) as fallback
	if (self.state.ports.length === 0) {
		for (let i = 1; i <= 16; i++) {
			presets[`port_link_static_${i}`] = {
				type: 'button',
				category: 'Port Status',
				name: `Link: Port ${i}`,
				style: {
					text: `Port ${i}\\nNo Link`,
					size: 'auto',
					color: Grey,
					bgcolor: Black,
				},
				steps: [{ down: [], up: [] }],
				feedbacks: [
					{
						feedbackId: FeedbackId.PortLinkUp,
						options: { port: i },
						style: { text: `Port ${i}\\nLinked`, bgcolor: ForestGreen, color: White },
					},
				],
			}
		}
	}

	// ──────────────── Group Assignment ────────────────

	// Dynamic group assignments from device state
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

	// Static group assignment presets (fallback: groups 1-4, ports 1-8)
	if (self.state.groups.length === 0) {
		for (let g = 1; g <= 4; g++) {
			for (let p = 1; p <= 8; p++) {
				presets[`port_${p}_to_group_static_${g}`] = {
					type: 'button',
					category: `Assign to Group ${g}`,
					name: `Port ${p} → Group ${g}`,
					style: {
						text: `Port ${p}\\n→ Grp ${g}`,
						size: 'auto',
						color: White,
						bgcolor: DarkGrey,
					},
					steps: [
						{
							down: [{ actionId: ActionId.SetPortGroup, options: { port: p, group: g } }],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: FeedbackId.PortInGroup,
							options: { port: p, group: g },
							style: { bgcolor: Blue, color: White },
						},
					],
				}
			}
		}
	}

	// ──────────────── PoE ────────────────

	// Dynamic PoE presets from device state
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

	// Static PoE presets (fallback: ports 1-8)
	if (!self.state.poeCapable || self.state.poePorts.length === 0) {
		for (let i = 1; i <= 8; i++) {
			presets[`toggle_poe_static_${i}`] = {
				type: 'button',
				category: 'PoE',
				name: `PoE: Port ${i}`,
				style: {
					text: `PoE\\nPort ${i}\\nOFF`,
					size: 'auto',
					color: White,
					bgcolor: DarkGrey,
				},
				steps: [
					{
						down: [{ actionId: ActionId.TogglePoe, options: { port: i, state: 'toggle' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: FeedbackId.PoeActive,
						options: { port: i },
						style: { text: `PoE\\nPort ${i}\\nON`, bgcolor: Red, color: White },
					},
				],
			}

			presets[`enable_poe_${i}`] = {
				type: 'button',
				category: 'PoE',
				name: `Enable PoE: Port ${i}`,
				style: {
					text: `PoE ON\\nPort ${i}`,
					size: 'auto',
					color: White,
					bgcolor: DarkGreen,
				},
				steps: [
					{
						down: [{ actionId: ActionId.TogglePoe, options: { port: i, state: 'on' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: FeedbackId.PoeActive,
						options: { port: i },
						style: { bgcolor: ForestGreen },
					},
				],
			}

			presets[`disable_poe_${i}`] = {
				type: 'button',
				category: 'PoE',
				name: `Disable PoE: Port ${i}`,
				style: {
					text: `PoE OFF\\nPort ${i}`,
					size: 'auto',
					color: White,
					bgcolor: DarkRed,
				},
				steps: [
					{
						down: [{ actionId: ActionId.TogglePoe, options: { port: i, state: 'off' } }],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}

	// ──────────────── Trunk Assignment ────────────────

	// Dynamic trunk assignments from device state
	for (const trunk of self.state.trunks) {
		const trunkLabel = trunk.name || `Trunk ${trunk.trunk_id}`
		for (const port of self.state.ports) {
			const n = port.port_number
			const portLabel = port.legend || `Port ${n}`

			presets[`port_${n}_to_trunk_${trunk.trunk_id}`] = {
				type: 'button',
				category: `Assign to ${trunkLabel}`,
				name: `${portLabel} → ${trunkLabel}`,
				style: {
					text: `${portLabel}\\n→ ${trunkLabel}`,
					size: 'auto',
					color: White,
					bgcolor: DarkGrey,
				},
				steps: [
					{
						down: [{ actionId: ActionId.SetPortTrunk, options: { port: n, trunk: trunk.trunk_id } }],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}

	self.setPresetDefinitions(presets)
}
