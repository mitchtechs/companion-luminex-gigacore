import type { CompanionPresetDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import type { PortInfo } from './types.js'
import { ActionId } from './actions.js'
import { FeedbackId } from './feedbacks.js'
import {
	White,
	Black,
	DarkGrey,
	Grey,
	DarkGreen,
	DarkRed,
	Blue,
	DarkBlue,
	Amber,
	Red,
	hexToCompanionColor,
	darkenColor,
} from './colors.js'

/**
 * Resolve the enabled/disabled background colour for a port.
 * If the port belongs to a group with a colour, use that (darkened when disabled).
 * Otherwise fall back to green (enabled) / dark red (disabled).
 */
function portBgColor(self: ModuleInstance, port: PortInfo): { enabled: number; disabled: number } {
	if (port.member_of?.type === 'group') {
		const group = self.state.groups.find((g) => g.group_id === port.member_of!.id)
		if (group?.color) {
			const full = hexToCompanionColor(group.color)
			return { enabled: full, disabled: darkenColor(full, 0.4) }
		}
	}
	return { enabled: DarkGreen, disabled: DarkRed }
}

/** Link state emoji */
function linkEmoji(port: PortInfo): string {
	switch (port.link_state) {
		case 'up':
			return '🔗'
		case 'down':
			return '⛔'
		default:
			return '❓'
	}
}

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}
	const label = self.label

	// ──────────────── Device ────────────────

	presets['device_info'] = {
		type: 'button',
		category: 'Device',
		name: 'Device Info',
		style: {
			text: `$(${label}:device_name)\\n$(${label}:device_model)\\nDevice Info`,
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

	presets['identify'] = {
		type: 'button',
		category: 'Device',
		name: 'Identify',
		style: {
			text: '💡 Identify',
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
			text: '⚠️ REBOOT',
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

	presets['active_profile_display'] = {
		type: 'button',
		category: 'Device',
		name: 'Active Profile',
		style: {
			text: `📋 $(${label}:active_profile)\\nActive Profile`,
			size: 'auto',
			color: Amber,
			bgcolor: Black,
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	}

	// ──────────────── Profiles ────────────────

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

	if (self.state.profiles.filter((p) => p.name).length === 0) {
		for (let i = 1; i <= 8; i++) {
			presets[`recall_profile_static_${i}`] = {
				type: 'button',
				category: 'Profiles',
				name: `Recall Profile Slot ${i}`,
				style: {
					text: `Profile ${i}`,
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

	for (let i = 1; i <= 8; i++) {
		presets[`save_profile_${i}`] = {
			type: 'button',
			category: 'Profiles',
			name: `Save to Slot ${i}`,
			style: {
				text: `💾 Slot ${i}`,
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

	// ──────────────── Ports ────────────────
	// Single toggle button per port with:
	//   - Hardware port legend via variable (user can override in Companion)
	//   - Link state emoji indicator
	//   - Group colour background (falls back to green/red)
	//   - Darkened background when disabled

	if (self.state.ports.length > 0) {
		for (const port of self.state.ports) {
			const n = port.port_number
			const colors = portBgColor(self, port)
			const emoji = linkEmoji(port)

			presets[`port_${n}`] = {
				type: 'button',
				category: 'Ports',
				name: `Port ${n}: ${port.legend || `Port ${n}`}`,
				style: {
					text: `$(${label}:port_${n}_legend)\\n${emoji} Port ${n}`,
					size: 'auto',
					color: White,
					bgcolor: colors.disabled,
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
						style: { bgcolor: colors.enabled, color: White },
					},
				],
			}
		}
	} else {
		// Static fallback when no ports loaded yet
		for (let i = 1; i <= 16; i++) {
			presets[`port_${i}`] = {
				type: 'button',
				category: 'Ports',
				name: `Port ${i}`,
				style: {
					text: `Port ${i}\\n❓`,
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
						style: { bgcolor: DarkGreen, color: White },
					},
				],
			}
		}
	}

	// ──────────────── Group Assignment ────────────────

	for (const group of self.state.groups) {
		const groupLabel = group.name || `Group ${group.group_id}`
		const groupBg = group.color ? hexToCompanionColor(group.color) : Blue

		for (const port of self.state.ports) {
			const n = port.port_number

			presets[`port_${n}_to_group_${group.group_id}`] = {
				type: 'button',
				category: `Assign → ${groupLabel}`,
				name: `Port ${n} → ${groupLabel}`,
				style: {
					text: `$(${label}:port_${n}_legend)\\nPort ${n} → ${groupLabel}`,
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
						style: { bgcolor: groupBg, color: White },
					},
				],
			}
		}
	}

	if (self.state.groups.length === 0) {
		for (let g = 1; g <= 4; g++) {
			for (let p = 1; p <= 8; p++) {
				presets[`port_${p}_to_group_static_${g}`] = {
					type: 'button',
					category: `Assign → Group ${g}`,
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

	if (self.state.poeCapable && self.state.poePorts.length > 0) {
		for (const poePort of self.state.poePorts) {
			const n = poePort.port_number

			presets[`poe_${n}`] = {
				type: 'button',
				category: 'PoE',
				name: `PoE: Port ${n}`,
				style: {
					text: `⚡ $(${label}:port_${n}_legend)\\nPort ${n} PoE Off`,
					size: 'auto',
					color: Grey,
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
						style: { text: `⚡ $(${label}:port_${n}_legend)\\nPort ${n} PoE On`, bgcolor: Red, color: White },
					},
				],
			}
		}
	} else {
		for (let i = 1; i <= 8; i++) {
			presets[`poe_${i}`] = {
				type: 'button',
				category: 'PoE',
				name: `PoE: Port ${i}`,
				style: {
					text: `⚡ Port ${i}\\nPoE Off`,
					size: 'auto',
					color: Grey,
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
						style: { text: `⚡ Port ${i}\\nPoE On`, bgcolor: Red, color: White },
					},
				],
			}
		}
	}

	// ──────────────── Trunk Assignment ────────────────

	for (const trunk of self.state.trunks) {
		const trunkLabel = trunk.name || `Trunk ${trunk.trunk_id}`

		for (const port of self.state.ports) {
			const n = port.port_number

			presets[`port_${n}_to_trunk_${trunk.trunk_id}`] = {
				type: 'button',
				category: `Assign → ${trunkLabel}`,
				name: `Port ${n} → ${trunkLabel}`,
				style: {
					text: `$(${label}:port_${n}_legend)\\nPort ${n} → ${trunkLabel}`,
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
