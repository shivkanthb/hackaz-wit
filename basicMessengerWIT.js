'use strict'
require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

let Wit = require('node-wit').Wit;
let log = require('node-wit').log;

app.set('port', (process.env.PORT || 3000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const accessToken = process.env.WIT_TOKEN;
const token = process.env.PAGE_ACCESS_TOKEN

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

// bot actions
const actions = {
  send({sessionId}, {text}) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid;
    if (recipientId) {
      sendTextMessage(recipientId, text);
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      return;
    }
  },
  	getForecast({context,entities}) {
  		console.log("context is :"+ JSON.stringify(context));
  		var location = firstEntityValue(entities,"location");

  		if(location)
  		{
  			console.log("Location yay");
  			context.forecast = "Sunny in "+ location;
  			delete context.missingLocation;
  		}
  		else
  		{
  			context.missingLocation = true;
  			delete context.forecast;
  		}
  		return context;
  	},
  	greet({context,entities}) {
  		console.log("context is :"+ JSON.stringify(context));
  		var greet_value = firstEntityValue(entities,"greeting");

  		if(greet_value=="hello")
  		{
  			context.greetingreply = "Hello Human";
  			delete context.missingLocation;
  		}
  		else
  		{
  			context.greetingreply = "I dont like humans";
  		}
  		return context;
  	},

}

const wit = new Wit({
  accessToken: accessToken,
  actions,
  logger: new log.Logger(log.INFO)
});

// index
app.get('/', function (req, res) {
	res.send('hello world I am a secret bot')
})

app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === '1q2w3e4r') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

// to post data
app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id

		const sessionId = findOrCreateSession(sender);
		if (event.message && event.message.text) {
			let text = event.message.text;

			wit.runActions(
				sessionId,
				text,
				sessions[sessionId].context)
			.then((context) => {
			  
			})
			.catch((e) => {
			  console.log('Oops! Got an error: ' + e);
			});
			// sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
		}
		if (event.postback) {
			let text = JSON.stringify(event.postback)
			sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
			continue
		}
	}
	res.sendStatus(200)
})

function sendTextMessage(sender, text) {
	let messageData = { text:text }
	
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})