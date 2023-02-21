import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const client = new DynamoDBClient({})
const dbClient = DynamoDBDocumentClient.from(client)

import { Bike, Location, Sponsor } from "./type-helper"

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

		if (method === 'GET') {
			if (path === '/bikes') {
				const bikes = await dbClient.send(
					new ScanCommand({ TableName: 'bikes' })
				)

				return {
					statusCode: 200,
					body: JSON.stringify(bikes.Items)
				}
			}

			if (path === '/locations') {
				const locations = await dbClient.send(
					new ScanCommand({ TableName: 'locations' })
				)

				return {
					statusCode: 200,
					body: JSON.stringify(locations.Items)
				}
			}

			if (path === '/sponsors') {
				const sponsors = await dbClient.send(
					new ScanCommand({ TableName: 'sponsors' })
				)

				return {
					statusCode: 200,
					body: JSON.stringify(sponsors.Items)
				}
			}

			if (path === '/available') {
				const bikes = await dbClient.send(
					new ScanCommand({ TableName: 'bikes' })
				)

				const availableBikes = bikes?.Items?.filter((bike) => {
					return !bike.isDamaged && !bike.isCheckedOut && bike.location
				})

				return {
					statusCode: 200,
					body: JSON.stringify(availableBikes)
				}
			}

			if (path === '/unavailable') {
				const bikes = await dbClient.send(
					new ScanCommand({ TableName: 'bikes' })
				)

				const unavailableBikes = bikes?.Items?.filter((bike) => {
					return bike.isDamaged || bike.isCheckedOut !== false || !bike.location
				})

				return {
					statusCode: 200,
					body: JSON.stringify(unavailableBikes)
				}
			}

			if (path.match(/^\/bike\/\w+$/)) {
				const id = path.split('/')[2]
				const bike = await getBike(id)

				if (bike) {
					return {
						statusCode: 200,
						body: JSON.stringify(bike)
					}
				} else {
					return {
						statusCode: 200,
						body: 'No matching bike found'
					}	
				}
			}

			if (path.match(/^\/location\/\w+$/)) {
				const id = path.split('/')[2]
				const location = await getLocation(id)

				if(location){
					return {
						statusCode: 200,
						body: JSON.stringify(location)
					}
				} else {
					return {
						statusCode: 200,
						body: 'No matching location found'
					}
				}
			}

			if (path.match(/^\/sponsor\/\w+$/)) {
				const id = path.split('/')[2]
				const sponsor = await getSponsor(id)

				if(sponsor){
					return {
						statusCode: 200,
						body: JSON.stringify(sponsor)
					}
				} else {
					return {
						statusCode: 200,
						body: 'No matching sponsor found'
					}	
				}
			}
			
			if (path.match(/^\/available\/\w+$/)) {
				const id = path.split('/')[2]
				const location = await getLocation(id)

				if(location){
					const bikes = await dbClient.send(
						new ScanCommand({ TableName: 'bikes' })
					)

					const bikesResponse = bikes?.Items?.filter((bike) => {
						return bike.location == id && !bike.isDamaged && !bike.isCheckedOut
					})

					return {
						statusCode: 200,
						body: JSON.stringify(bikesResponse)
					}
				} else {
					return {
						statusCode: 200,
						body: 'No matching location found'
					}	
				}
			}

			if (path.match(/^\/unavailable\/\w+$/)) {
				const id = path.split('/')[2]
				const location = await getLocation(id)

				if(location){
					const bikes = await dbClient.send(
						new ScanCommand({ TableName: 'bikes' })
					)

					const bikesResponse = bikes?.Items?.filter((bike) => {
						return bike.location == id && (bike.isDamaged || bike.isCheckedOut)
					})

					return {
						statusCode: 200,
						body: JSON.stringify(bikesResponse)
					}
				} else {
					return {
						statusCode: 200,
						body: 'No matching location found'
					}	
				}
			}

		}

		return {
			statusCode: 500,
			body: "No matching resource found"
		}
	} catch (err) {
		console.log(err)
		return {
			statusCode: 500,
			body: JSON.stringify({ message: err })
		}
	}
}