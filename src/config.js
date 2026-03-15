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
			type: 'number',
			id: 'pollInterval',
			label: 'Poll Interval (ms)',
			width: 4,
			default: 5000,
			min: 1000,
			max: 60000,
		},
	]
}
