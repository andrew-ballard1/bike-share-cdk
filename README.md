# AWS-CDK Bike Share thing

Hey Poggio Peeps - wow I hate that.
It sounded better in my head.

<br />

If you found this repo it means I sent an email to a recruiter or somebody on the team - there's a link in there to the actual API I'm running.
You'll be able to POST or GET to a number of endpoints.

Go ahead and fiddle around with the link provided via email, but **please do not load test** unless you're running your own CDK toolkit.

<br />

Some quick info before diving in

 * The table structure could be extended. The initial ask was for a bikes table, I added a sponsor and location table as well. I've never had a project end up with the same first table, even only a few days in.
 * API Gateway could use some more polishing, currently the API Gateway service is what's blocking disallowed calls, there's no internal logic.
 * I'm not a huge fan of the structure of the Lambda backed API Gateway. Given the time I'd rather have put together another layer with a private package of helpers.
 * With time I'd want to put together some CLI tools to ease the deployment. It's not difficult to run `npm run build` and `cdk deploy --all` but the file structure does get messy with the .d.ts and .js additions.
 * I read the take home like 2 days ago. I tried to build for what I remembered, but I definitely added a feature or two and probably missed some as well.

I had also considered just standing up an express server and hammering out an interface to interact with the API, but I have a few projects currently up and running that do a much better job of showing my skills in those areas, so I picked CDK for this.

<br />

# Explanation

Coderpad is pretty nifty, but I don't think I could properly make the case for hiring me through it.

 * The shell environment said "Go ahead and install things with npm install" and then didn't work, so that was cool.
 * I couldn't install libraries (express, Jest)
 * I couldn't install type definitions for runtime checks
 * Crypto was apparently already available, but it wasn't the actual crypto library, and every method available returned method undefined errors
 * There wasn't a way to put together a proper folder structure to show that I know where things go - a test suite, for example.

I ended up mocking more of a blunt instrument than a server - literally just an object with a post and get property housing methods that manipulated or filtered a bikes key on the same server object.

I also sort of tried putting together a test scenario, but I couldn't use Jest so it was just console logging things. I felt like a teenager again.

<br />

Long story short I'm trying to salvage my image by using some tools I'm familiar with, rather than a shallow platform. And also by going ham on the project.

<br />


# Using the API

## Criteria

 * Locations can be created or searched
 * Sponsors can be created or searched, but must be associated with a location
 * Bikes can be created with a location, or without
 * Bikes not present at a location cannot be checked out
 * Bikes that are not checked out cannot be checked in
 * Bikes can be checked in at any location
 * Bikes can be damaged on trips
 * Damaged Bikes cannot be checked out
 * You can search for all available bikes availability or search by location
 * You can search for all unavailable bikes or search by location
 * Each trip a bike takes is recorded, and damage to the bike is noted on check in


## POST	
 * `/bike`
	```
	{
		name: "Bike Name",
		location?: locationId,
		isDamaged?: false
		isCheckedOut?: false,
		serviceRecords?: [],
		trips?: [],
	}
	```
 * `/sponsor`
 	```
	{
		name: "Sponsor Name,
		location?: locationId,
	}
	```
 * `/location`
 	```
	{
		name: "Location Name",
	}
	```
 * `/check-in`
	```
	{
		id: bikeId,
		location?: locationId
	}
	```
 * `/check-out`
	```
	{
		id: bikeId
	}
	```

> Why not just add an ID to the POST body when sending to `/bike`, `/sponsor`, and `/location` if you want to update an entry?
>
> I wanted to see if I could split the routes into two proxied lambdas, one for POST and one for GET. Initially there was just one default lambda handler, but it was getting huge. I'm not in the mood to refactor for a 3rd function, its getting late.

 * `/bike/:bikeId`
 	```
	{
		name?: "New Bike Name",
		isDamaged?: tripId,
		isCheckedOut?: false | <CheckOut>
	}
 	```
 * `/sponsor/:sponsorId`
	```
	{
		name?: "New Sponsor Name",
		location?: locationId
	}
	```
 * `/location/:locationId`
	```
	{
		name: "New Location Name"
	}
	```


## GET
 * `/bikes`
 * `/sponsors`
 * `/locations`
 * `/available`
 * `/unavailable`

 * `/bike/:bikeId`
 * `/sponsor/:sponsorId`
 * `/location/:locationId`
 * `/available/:locationId`
 * `/unavailable/:locationId`

<br />

<br />

## This repo houses a CDK project

If you want to try to run something, here:

First make sure you have `aws-cli` installed, and `aws-cdk` v2

Run `npm install`

Run `npm run build`

Run `cdk bootstrap aws://<account_number>/<region>`

> This will create a stack in CloudFormation just for deploying more stacks to CloudFormation. You might already have this stack, if you use CDK and `cdk deploy --all` fails, you should instead run
>
> `cdk bootstrap aws://<account_number>/<region> --toolkit-stack-name <custom_stack_name>`

Finally, run `cdk deploy --all`

This will transpile the stacks, constructs, and lambda functions, provision a bucket for the CDK project, provision some dynamodb tables, and attach the necessary policies to hook everything up, and to allow your CLI user to deploy things.

There will also be a URL spit out from the API Gateway stack, you can send POST and GET requests there.

<br />

You'll probably need to create a new policy and attach it to whatever your CLI user is:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:*",
                "ecr:*",
                "s3:*",
                "cloudformation:*",
                "sts:*"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:GetRole",
                "iam:DeleteRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:PutRolePolicy"
            ],
            "Resource": [
                "arn:aws:iam::<ACCOUNT_ID_HERE>:role/cdk-*"
            ]
        }
    ]
}
```

> You'll need your own account id, sorry. The rest of my AWS crap already costs an arm and a leg.
>
> Also, be sure to remove the policy from your user when you're done, it's fairly wide open.

------

One interesting tidbit I found out is now AWS CDK has a Lambda Backed API Gateway construct.

Super interesting, except for that htey suggest adding all path / route / query logic into one default handler. They let you break it up, so I tried it, but it added some overhead I wasn't prepared for.

<br />

### **The main purpose of this exercise is showing interaction with multiple facets of AWS and glossing over design principles, rather than building this "the right way" - like how there's no authentication. That's probably a bad idea.**