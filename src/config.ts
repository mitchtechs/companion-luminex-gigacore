import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	gigacore_host: string
	host: string
	password: string
	generation: 'gen1' | 'gen2'
	pollInterval: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		// ── Compatibility Notice ──────────────────────────────────────────────
		{
			type: 'static-text',
			id: 'compat-notice',
			width: 12,
			label: 'Hardware Compatibility',
			value: `
				<strong>Gen2 devices</strong> (GigaCore 10i, 10t, 16i, 16t, 18t, 20t, 30i) — Full support.
				REST API + WebSocket for real-time updates. Requires firmware 1.2.0 or later.<br>
				<strong>Gen1 devices</strong> (GigaCore 10, 12, 14R, 16Xt, 16RFO, 26i) — Partial support.
				REST API with HTTP polling only. No WebSocket. Requires firmware 3.0.2 or later.<br>
				<strong>Auto-discovery</strong> — If your GigaCore appears in the dropdown below, select it.
				Otherwise enter the IP address manually. Auto-discovery requires the switch and this
				computer to be on the same network and mDNS/Bonjour to be enabled (Gen2 only).
			`.replace(/\t/g, '').trim(),
		},

		// ── Auto-discovery ────────────────────────────────────────────────────
		{
			type: 'bonjour-device',
			id: 'gigacore_host',
			label: 'Auto-Discover GigaCore (Gen2)',
			width: 6,
			tooltip:
				'If your GigaCore Gen2 switch is on the same network, it may appear here automatically. Gen1 devices do not support auto-discovery — use Manual IP below.',
		},

		// ── Manual IP (shown when no bonjour device selected) ─────────────────
		{
			type: 'textinput',
			id: 'host',
			label: 'Manual IP Address',
			width: 6,
			regex: Regex.IP,
			tooltip: 'Enter the IP address of your GigaCore switch. Required if auto-discovery is not available.',
			isVisible: (options) => !options['gigacore_host'],
		},
		{
			type: 'static-text',
			id: 'host-filler',
			width: 6,
			label: '',
			value: '',
			isVisible: (options) => !!options['gigacore_host'],
		},

		// ── Auth ──────────────────────────────────────────────────────────────
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			width: 6,
			default: '',
			tooltip: 'Leave blank if authentication is not enabled on the device (default from factory).',
		},

		// ── Device Generation ─────────────────────────────────────────────────
		{
			type: 'dropdown',
			id: 'generation',
			label: 'Device Generation',
			width: 6,
			default: 'gen2',
			choices: [
				{
					id: 'gen2',
					label: 'Gen2 — 10i, 10t, 16i, 16t, 18t, 20t, 30i (WebSocket + REST, fw 1.2.0+)',
				},
				{
					id: 'gen1',
					label: 'Gen1 — 10, 12, 14R, 16Xt, 16RFO, 26i (REST polling only, fw 3.0.2+)',
				},
			],
			tooltip:
				'Gen2 devices support WebSocket for real-time updates. Gen1 devices use HTTP polling only — increase the poll interval if performance is affected.',
		},

		// ── Poll Interval ─────────────────────────────────────────────────────
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Poll Interval (ms)',
			width: 6,
			default: 5000,
			min: 1000,
			max: 60000,
			tooltip:
				'How often to poll the device for state updates. Gen2 uses WebSocket for real-time updates so this is only a fallback. Gen1 relies entirely on polling — lower values increase responsiveness but add network load.',
		},
	]
}
