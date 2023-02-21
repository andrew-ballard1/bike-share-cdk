import { Stack, RemovalPolicy, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb'
import { Function } from 'aws-cdk-lib/aws-lambda'

interface DBStackProps extends StackProps {
	function?: Function
}

export class DynamoDBStack extends Stack {
	tables: Array<Table>
	constructor(scope: Construct, id: string, props?: DBStackProps) {
		super(scope, id, props)

		const bikesTable = new Table(this, 'BikesTable', {
			tableName: 'bikes',
			partitionKey: { name: 'id', type: AttributeType.STRING },
			removalPolicy: RemovalPolicy.DESTROY // I wouldn't use this in production, unless we're feeling saucy
		})
		const locationsTable = new Table(this, 'LocationsTable', {
			tableName: 'locations',
			partitionKey: { name: 'id', type: AttributeType.STRING },
			removalPolicy: RemovalPolicy.DESTROY // I wouldn't use this in production, unless we're feeling saucy
		})
		const sponsorsTable = new Table(this, 'SponsorsTable', {
			tableName: 'sponsors',
			partitionKey: { name: 'id', type: AttributeType.STRING },
			removalPolicy: RemovalPolicy.DESTROY // I wouldn't use this in production, unless we're feeling saucy
		})

		this.tables = [
			bikesTable,
			locationsTable,
			sponsorsTable
		]
	}

	getTables(){
		return this.tables
	}
}