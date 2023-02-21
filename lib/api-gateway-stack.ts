import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { LambdaIntegration, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway'
import { LambdaStack } from './lambda-stack'
import { Function } from 'aws-cdk-lib/aws-lambda'

export class ApiGatewayStack extends Stack {
	lambdaHandlers: {
		get: Function,
		post: Function
	}
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		const lambdaStack = new LambdaStack(this, 'ChildLambdaStack')

		const methodFunctions = lambdaStack.getMethodFunctions()

		this.lambdaHandlers = methodFunctions

		const api = new LambdaRestApi(this, 'BikeShareApi', {
			handler: methodFunctions.get,
			proxy: false,
			restApiName: 'Bike Share API',
			description: 'A more complicated and less reasonable approach to the Coderpad exercise.'
		})

		const getIntegration = new LambdaIntegration(methodFunctions.get)
		const postIntegration = new LambdaIntegration(methodFunctions.post)

		const getRoutes = [
			'bikes',
			'sponsors',
			'locations',
		]

		const postRoutes = [
			'check-in',
			'check-out',
		]

		const proxyRoutes = [
			'bike',
			'sponsor',
			'location',
			'available',
			'unavailable'
		]


		getRoutes.forEach((route) => {
			const resource = api.root.addResource(route)
			resource.addMethod('GET', getIntegration)
		})

		postRoutes.forEach((route) => {
			const resource = api.root.addResource(route)
			resource.addMethod('POST', postIntegration)
		})


		const proxy = api.root.addResource(`{id+}`)
		proxyRoutes.forEach((route) => {
			const resource = api.root.addResource(route)

			resource.addMethod('GET', getIntegration)
			resource.addMethod('POST', postIntegration)
			resource.addProxy(proxy)
		})
	}

	getLambdaHandlers(){
		return this.lambdaHandlers
	}
}
