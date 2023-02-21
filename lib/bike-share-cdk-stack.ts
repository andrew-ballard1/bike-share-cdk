import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DynamoDBStack } from './dynamodb-stack'
import { ApiGatewayStack } from './api-gateway-stack'

export class BikeShareCdkStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		const DBStack = new DynamoDBStack(this, 'DBStack')
		const GatewayStack = new ApiGatewayStack(this, 'APIStack')

		const tables = DBStack.getTables()
		const { get, post } = GatewayStack.getLambdaHandlers()
		tables.forEach((table) => {
			table.grantReadWriteData(get)
			table.grantReadWriteData(post)
		})
	}
}
