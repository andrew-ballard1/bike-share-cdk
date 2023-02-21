
export type Trip = {
	id: string,
	startTime: number | undefined,
	startLocation: string,
	endTime: number | undefined,
	endLocation: string
}

export type ServiceRecord = {
	id: string,
	note: string,
	case_id: string | undefined
}
export type PartialCheckOut = {
	id: string,
	startTime: number,
	startLocation: string,
}

export interface CheckOut extends PartialCheckOut {
	endTime: number,
	endLocation: string
}

export type PartialBike = {
	name: string,
	location: false | string,
	trips: Array<Trip>
	serviceRecords: Array<ServiceRecord>
	isCheckedOut: false | CheckOut
	isDamaged: false | string
}

export interface Bike extends PartialBike {
	id: string
}

export type Location = {
	id: string,
	name: string
}

export type Sponsor = {
	id: string,
	name: string,
	location: string
}
