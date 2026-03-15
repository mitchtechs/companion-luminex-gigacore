export interface DeviceInfo {
	name: string
	description?: string
	serial: string
	mac_address: string
	model: string
}

export interface PortInfo {
	port_number: number
	legend: string
	enabled: boolean
	link_state: string
	protected: boolean
	member_of: PortMembership | null
}

export interface PortMembership {
	id: number
	type: 'group' | 'trunk'
}

export interface GroupInfo {
	group_id: number
	name: string
	color: string | null
}

export interface TrunkInfo {
	trunk_id: number
	name: string
	color: string | null
}

export interface ProfileInfo {
	slot: number
	name: string
	protected: boolean
}

export interface PoePortInfo {
	port_number: number
	enabled: boolean
	indication: string
}

export interface GigaCoreState {
	device: DeviceInfo | null
	ports: PortInfo[]
	groups: GroupInfo[]
	trunks: TrunkInfo[]
	profiles: ProfileInfo[]
	activeProfile: string
	poeCapable: boolean
	poePorts: PoePortInfo[]
}

export interface GigaCoreApiInterface {
	readonly supportsWebSocket: boolean
	getDevice(): Promise<DeviceInfo>
	identify(duration?: number): Promise<void>
	reboot(wait?: number): Promise<void>
	reset(opts?: { keepIp?: boolean; keepProfiles?: boolean; wait?: number }): Promise<void>
	getPorts(): Promise<PortInfo[]>
	setPortEnabled(portNr: number, enabled: boolean): Promise<void>
	setPortMemberOf(portNr: number, id: number, type: 'group' | 'trunk'): Promise<void>
	getGroups(): Promise<GroupInfo[]>
	getTrunks(): Promise<TrunkInfo[]>
	getActiveProfileName(): Promise<{ name: string } | string>
	getProfiles(): Promise<ProfileInfo[]>
	recallProfile(slot: number): Promise<void>
	saveProfile(slot: number, name?: string): Promise<void>
	getPoeCapable(): Promise<boolean>
	getPoePorts(): Promise<PoePortInfo[]>
	setPoeEnabled(portNr: number, enabled: boolean): Promise<void>
	mergePortAssignments?(ports: PortInfo[]): PortInfo[]
}
