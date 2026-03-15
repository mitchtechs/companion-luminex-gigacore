export function updateVariableDefinitions(self) {
	const variables = [
		{ variableId: 'device_name', name: 'Device Name' },
		{ variableId: 'device_model', name: 'Device Model' },
		{ variableId: 'device_serial', name: 'Serial Number' },
		{ variableId: 'device_mac', name: 'MAC Address' },
		{ variableId: 'active_profile', name: 'Active Profile Name' },
		{ variableId: 'poe_capable', name: 'PoE Capable' },
	]

	// Dynamic port variables based on discovered port count
	const portCount = self.state?.ports?.length ?? 0
	for (let i = 1; i <= portCount; i++) {
		variables.push(
			{ variableId: `port_${i}_legend`, name: `Port ${i} Legend` },
			{ variableId: `port_${i}_enabled`, name: `Port ${i} Enabled` },
			{ variableId: `port_${i}_link`, name: `Port ${i} Link State` },
			{ variableId: `port_${i}_group`, name: `Port ${i} Group` },
		)
	}

	self.setVariableDefinitions(variables)
}

export function updateVariableValues(self) {
	const values = {}
	const s = self.state

	if (s.device) {
		values['device_name'] = s.device.name ?? ''
		values['device_model'] = s.device.model ?? ''
		values['device_serial'] = s.device.serial ?? ''
		values['device_mac'] = s.device.mac_address ?? ''
	}

	values['active_profile'] = s.activeProfile ?? ''
	values['poe_capable'] = s.poeCapable ? 'Yes' : 'No'

	if (s.ports) {
		for (const port of s.ports) {
			const n = port.port_number
			values[`port_${n}_legend`] = port.legend ?? `Port ${n}`
			values[`port_${n}_enabled`] = port.enabled ? 'On' : 'Off'
			values[`port_${n}_link`] = port.link_state ?? 'unknown'
			values[`port_${n}_group`] = resolveGroupName(self, port.member_of)
		}
	}

	self.setVariableValues(values)
}

function resolveGroupName(self, memberOf) {
	if (!memberOf) return 'None'
	const { id, type } = memberOf
	const list = type === 'trunk' ? self.state.trunks : self.state.groups
	const match = list?.find((g) => (g.group_id ?? g.trunk_id) === id)
	return match?.name ?? `${type} ${id}`
}
