import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import * as crypto from 'crypto'

import { Bike, Location, Sponsor } from "./type-helper"

const client = new DynamoDBClient({})
const dbClient = DynamoDBDocumentClient.from(client)

const getLocation = async (locationId: string): Promise<Location | undefined> => {
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

const getSponsor = async (sponsorId: string): Promise<Sponsor | undefined> => {
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

const getBike = async (bikeId: string): Promise<Bike | undefined> => {
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

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	try {
		const method = event.httpMethod
		const path = event.path

		if (method === 'POST') {
			if (!event.body) {
				return {
					statusCode: 200,
					body: "No post body"
				}
			}

			if (path === '/bike') {
				const { location = false, trips = [], serviceRecords = [], name, isCheckedOut = false, isDamaged = false } = JSON.parse(event.body)
				if(!name){
					return {
						statusCode: 200,
						body: 'Bike requires { name: string }'
					}
				}
				const locationResponse = await getLocation(location)
				if(location && !locationResponse){
					return {
						statusCode: 200,
						body: 'No matching location found'
					}
				}
				const bike = {
					id: crypto.randomBytes(6).toString('hex'),
					location,
					trips,
					serviceRecords,
					name,
					isCheckedOut,
					isDamaged
				}

				await dbClient.send(
					new PutCommand({
						TableName: 'bikes',
						Item: bike
					})
				)

				return {
					statusCode: 200,
					body: JSON.stringify(bike)
				}
			}

			if (path.match(/^\/bike\/\w+$/)) {
				const id = path.split('/')[2]
				const bike = await getBike(id)
				if(bike){
					const { 
						name = bike.name,
						location = bike.location,
						isDamaged = bike.isDamaged
					} = JSON.parse(event.body)
					
					const locationResponse = await getLocation(location)
					if(!locationResponse){
						return {
							statusCode: 200,
							body: 'No matching location found'
						}
					}

					const updatedBike = {...bike, location, name, isDamaged}
					
					return {
						statusCode: 200,
						body: JSON.stringify(updatedBike)
					}
				}

				return {
					statusCode: 200,
					body: JSON.stringify(bike)
				}
			}

			if(path === '/sponsor'){
				const { location, name } = JSON.parse(event.body)
				if(!location || !name){
					return {
						statusCode: 200,
						body: 'Sponsor requires {location: string, name: string}'
					}
				}

				const locationResponse = await getLocation(location)
				if(!locationResponse){
					return {
						statusCode: 200,
						body: 'No matching location found'
					}
				}

				const sponsor = {
					id: crypto.randomBytes(6).toString('hex'),
					location,
					name,
				}
				await dbClient.send(
					new PutCommand({
						TableName: 'sponsors',
						Item: sponsor
					})
				)

				return {
					statusCode: 200,
					body: JSON.stringify(sponsor)
				}
			}

			if(path === '/location'){
				const { name } = JSON.parse(event.body)
				if(!name){
					return {
						statusCode: 200,
						body: 'Location requires { name: string }'
					}
				}
				const location = {
					id: crypto.randomBytes(6).toString('hex'),
					name
				}

				await dbClient.send(
					new PutCommand({
						TableName: 'locations',
						Item: location
					})
				)

				return {
					statusCode: 200,
					body: JSON.stringify(location)
				}
			}

			if (path === '/check-in') {
				const { id, location = false, isDamaged = false } = JSON.parse(event.body)

				const input = {
					TableName: 'bikes',
					Key: { id }
				}

				const response = await dbClient.send(new GetCommand(input))
				const bike = await getBike(id)

				if(!bike){
					return {
						statusCode: 200,
						body: 'No matching bike found'
					}
				}

				if(bike?.isCheckedOut === false){
					return {
						statusCode: 200,
						body: JSON.stringify({message: 'Bike is already checked in'})
					}
				}

				const locationResponse = location ? await getLocation(location) : false
				
				const checkOut = {
					...bike?.isCheckedOut,
					endTime: Date.now(),
					endLocation: locationResponse ? locationResponse.id : bike?.isCheckedOut.startLocation
				}

				const updatedTrips = [...bike?.trips, checkOut]
				const updatedBike = {
					...bike,
					isCheckedOut: false,
					trips: updatedTrips,
					isDamaged: isDamaged ? checkOut.id : bike.isDamaged
				}

				await dbClient.send(
					new UpdateCommand({
						TableName: 'bikes',
						Key: { id },
						UpdateExpression: `SET isCheckedOut = :checkOut, trips = :updatedTrips, isDamaged = :isDamaged`,
						ExpressionAttributeValues: {
							":checkOut": false,
							":updatedTrips": updatedTrips,
							":isDamaged": updatedBike.isDamaged
						}
					})
				)

				return {
					statusCode: 200,
					body: JSON.stringify(updatedBike)
				}
			}

			if (path === '/check-out') {
				const { id } = JSON.parse(event.body)

				const input = {
					TableName: 'bikes',
					Key: { id }
				}

				const bike = await getBike(id)

				if(bike?.isCheckedOut){
					return {
						statusCode: 200,
						body: JSON.stringify({message: 'Bike is already checked out'})
					}
				}

				// const locationResponse = bike?.location ? await getLocation(bike?.location) : false
				// if(!locationResponse){
				// 	return {
				// 		statusCode: 200,
				// 		body: 'No matching location found'
				// 	}
				// } else {
				// 	if
				// }

				const checkOut = {
					id: crypto.randomBytes(6).toString('hex'),
					startTime: Date.now(),
					startLocation: bike?.location
				}

				const updatedBike = {
					...bike,
					isCheckedOut: checkOut
				}

				await dbClient.send(
					new UpdateCommand({
						TableName: 'bikes',
						Key: { id }, // could also consider using bike.id, in case no bike comes back we don't want to create a new row. Need to look up UpdateCommand spec
						UpdateExpression: `SET isCheckedOut = :checkOut`,
						ExpressionAttributeValues: { ":checkOut": checkOut }
					})
				)

				return {
					statusCode: 200,
					body: JSON.stringify(updatedBike)
				}
			}
		}

		return {
			statusCode: 500,
			body: "An unknown error occured"
		}
	} catch (err) {
		console.log(err)
		return {
			statusCode: 500,
			body: JSON.stringify({ message: err })
		}
	}
}