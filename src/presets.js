import { combineRgb } from '@companion-module/base'

export function updatePresetDefinitions(self) {
	const presets = {}

	// --- Profile recall presets ---
	if (self.state.profiles) {
		for (const profile of self.state.profiles) {
			if (!profile.name) continue
			presets[`recall_profile_${profile.slot}`] = {
				type: 'button',
				category: 'Profiles',
				name: `Recall: ${profile.name}`,
				style: {
					text: profile.name,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(51, 51, 51),
				},
				steps: [
					{
						down: [{ actionId: 'recall_profile', options: { slot: profile.slot } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'active_profile',
						options: { profile: profile.name },
						style: {
							bgcolor: combineRgb(204, 153, 0),
							color: combineRgb(0, 0, 0),
						},
					},
				],
			}
		}
	}

	// --- Port toggle presets ---
	if (self.state.ports) {
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
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(102, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'toggle_port', options: { port: n, state: 'toggle' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'port_enabled',
						options: { port: n },
						style: {
							text: `${label}\\nON`,
							bgcolor: combineRgb(0, 153, 0),
							color: combineRgb(255, 255, 255),
						},
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
					color: combineRgb(128, 128, 128),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [{ down: [], up: [] }],
				feedbacks: [
					{
						feedbackId: 'port_link_up',
						options: { port: n },
						style: {
							text: `${label}\\nLinked`,
							bgcolor: combineRgb(0, 102, 0),
							color: combineRgb(255, 255, 255),
						},
					},
				],
			}
		}
	}

	// --- Port-to-group assignment presets ---
	if (self.state.ports && self.state.groups) {
		for (const group of self.state.groups) {
			for (const port of self.state.ports) {
				const n = port.port_number
				const portLabel = port.legend || `Port ${n}`
				const groupLabel = group.name || `Group ${group.group_id}`

				presets[`port_${n}_to_group_${group.group_id}`] = {
					type: 'button',
					category: `Assign to ${groupLabel}`,
					name: `${portLabel} → ${groupLabel}`,
					style: {
						text: `${portLabel}\\n→ ${groupLabel}`,
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(51, 51, 51),
					},
					steps: [
						{
							down: [
								{
									actionId: 'set_port_group',
									options: { port: n, group: group.group_id },
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'port_in_group',
							options: { port: n, group: group.group_id },
							style: {
								bgcolor: combineRgb(0, 102, 204),
								color: combineRgb(255, 255, 255),
							},
						},
					],
				}
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
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 51, 153),
		},
		steps: [
			{
				down: [{ actionId: 'identify', options: { duration: 10 } }],
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
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(204, 0, 0),
		},
		steps: [
			{
				down: [{ actionId: 'reboot', options: {} }],
				up: [],
			},
		],
		feedbacks: [],
	}

	// --- PoE toggle presets ---
	if (self.state.poeCapable && self.state.poePorts) {
		for (const poePort of self.state.poePorts) {
			const n = poePort.port_number
			const portData = self.state.ports?.find((p) => p.port_number === n)
			const label = portData?.legend || `Port ${n}`

			presets[`toggle_poe_${n}`] = {
				type: 'button',
				category: 'PoE',
				name: `PoE: ${label}`,
				style: {
					text: `PoE\\n${label}\\nOFF`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(51, 51, 51),
				},
				steps: [
					{
						down: [{ actionId: 'toggle_poe', options: { port: n, state: 'toggle' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'poe_active',
						options: { port: n },
						style: {
							text: `PoE\\n${label}\\nON`,
							bgcolor: combineRgb(204, 0, 0),
							color: combineRgb(255, 255, 255),
						},
					},
				],
			}
		}
	}

	self.setPresetDefinitions(presets)
}
