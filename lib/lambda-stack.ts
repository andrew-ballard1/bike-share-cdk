import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Function, Runtime, Code, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import * as path from 'path';

type FunctionMap = {
	get: Function,
	post: Function
}

export class LambdaStack extends Stack {
	methodFunctions:FunctionMap
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		const layer = new LayerVersion(this, 'SDKLayer', {
			code: Code.fromAsset(path.join(__dirname, 'sdk-layer')),
			compatibleRuntimes: [Runtime.NODEJS_16_X],
			description: 'External aws-sdk v3',
			layerVersionName: 'aws-sdk'
		})

		const getFunction = new Function(this, 'getMethodFunction', {
			runtime: Runtime.NODEJS_16_X,
			code: Code.fromAsset(path.join(__dirname, 'bike-api'), { exclude: ['**', '!get.js'] }),
			handler: 'get.handler',
			layers: [layer],
		})

		const postFunction = new Function(this, 'postMethodFunction', {
			runtime: Runtime.NODEJS_16_X,
			code: Code.fromAsset(path.join(__dirname, 'bike-api'), { exclude: ['**', '!post.js'] }),
			handler: 'post.handler',
			layers: [layer],
		})

		this.methodFunctions = {
			get: getFunction,
			post: postFunction
		}
	}

	getMethodFunctions() {
		return this.methodFunctions
	}
}
