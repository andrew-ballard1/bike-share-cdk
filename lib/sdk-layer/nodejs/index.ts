
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

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
	location: string,
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

const client = new DynamoDBClient({})
const dbClient = DynamoDBDocumentClient.from(client)

export const getLocation = async (locationId: string): Promise<Location | undefined> => {
	try {
		const input = {
			TableName: 'locations',
			Key: { id: locationId }
		}
		const response = await dbClient.send(new GetCommand(input))

		return response.Item as Location
	} catch (err) {
		console.log(err)
		return undefined
	}
}

export const getSponsor = async (sponsorId: string): Promise<Sponsor | undefined> => {
	try {
		const input = {
			TableName: 'sponsors',
			Key: { id: sponsorId }
		}
		const response = await dbClient.send(new GetCommand(input))

		return response.Item as Sponsor
	} catch (err) {
		console.log(err)
		return undefined
	}
}

export const getBike = async (bikeId: string): Promise<Bike | undefined> => {
	try {
		const input = {
			TableName: 'bikes',
			Key: { id: bikeId }
		}
		const response = await dbClient.send(new GetCommand(input))

		return response.Item as Bike
	} catch (err) {
		console.log(err)
		return undefined
	}
}