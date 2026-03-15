import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import type { PortMembership } from './types.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const variables: CompanionVariableDefinition[] = [
		{ variableId: 'device_name', name: 'Device Name' },
		{ variableId: 'device_model', name: 'Device Model' },
		{ variableId: 'device_serial', name: 'Serial Number' },
		{ variableId: 'device_mac', name: 'MAC Address' },
		{ variableId: 'active_profile', name: 'Active Profile Name' },
		{ variableId: 'poe_capable', name: 'PoE Capable' },
	]

	for (const port of self.state.ports) {
		const n = port.port_number
		variables.push(
			{ variableId: `port_${n}_legend`, name: `Port ${n} Legend` },
			{ variableId: `port_${n}_enabled`, name: `Port ${n} Enabled` },
			{ variableId: `port_${n}_link`, name: `Port ${n} Link State` },
			{ variableId: `port_${n}_group`, name: `Port ${n} Group` },
		)
	}

	self.setVariableDefinitions(variables)
}

export function UpdateVariableValues(self: ModuleInstance): void {
	const values: CompanionVariableValues = {}
	const s = self.state

	if (s.device) {
		values['device_name'] = s.device.name ?? ''
		values['device_model'] = s.device.model ?? ''
		values['device_serial'] = s.device.serial ?? ''
		values['device_mac'] = s.device.mac_address ?? ''
	}

	values['active_profile'] = s.activeProfile ?? ''
	values['poe_capable'] = s.poeCapable ? 'Yes' : 'No'

	for (const port of s.ports) {
		const n = port.port_number
		values[`port_${n}_legend`] = port.legend ?? `Port ${n}`
		values[`port_${n}_enabled`] = port.enabled ? 'On' : 'Off'
		values[`port_${n}_link`] = port.link_state ?? 'unknown'
		values[`port_${n}_group`] = resolveGroupName(self, port.member_of)
	}

	self.setVariableValues(values)
}

function resolveGroupName(self: ModuleInstance, memberOf: PortMembership | null): string {
	if (!memberOf) return 'None'
	const { id, type } = memberOf
	if (type === 'trunk') {
		const match = self.state.trunks.find((t) => t.trunk_id === id)
		return match?.name ?? `Trunk ${id}`
	}
	const match = self.state.groups.find((g) => g.group_id === id)
	return match?.name ?? `Group ${id}`
}
