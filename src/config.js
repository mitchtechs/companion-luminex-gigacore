import { Regex } from '@companion-module/base'

export function getConfigFields() {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Device IP Address',
			width: 6,
			regex: Regex.IP,
			required: true,
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			width: 6,
			default: '',
			tooltip: 'Leave blank if authentication is not enabled on the device',
		},
		{
			type: 'dropdown',
			id: 'generation',
			label: 'Device Generation',
			width: 4,
			default: 'gen2',
			choices: [
				{ id: 'gen2', label: 'Gen2 (10i, 10t, 16i, 16t, 18t, 20t, 30i)' },
				{ id: 'gen1', label: 'Gen1 (10, 12, 14R, 16Xt, 16RFO, 26i)' },
			],
			tooltip: 'Gen2 devices support WebSocket for real-time updates. Gen1 devices use HTTP polling only.',
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Poll Interval (ms)',
			width: 4,
			default: 5000,
			min: 1000,
			max: 60000,
			tooltip: 'Gen2 devices use WebSocket for real-time updates and only poll as a fallback. Gen1 devices rely on polling.',
		},
	]
}
