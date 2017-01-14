'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
require('dotenv').config();

app.set('port', (process.env.PORT || 3000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

// index
app.get('/', function (req, res) {
	res.send('hello world i am a secret bot')
})
// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === '1q2w3e4r') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

let Wit = require('node-wit').Wit;
let log = require('node-wit').log;

const accessToken = (() => {
  var accessToken = 'QDEMGPI7E74DDCOUG7SG6CCHIBTVY5JI';
  return accessToken;
})();

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

// Our bot actions
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
    getForecast({context, entities}) {
      console.log((JSON.stringify(context)));
      context = {};
      var location = firstEntityValue(entities, 'location');
      if (location) {
        context.forecast = 'sunny in ' + location; // we should call a weather API here
        delete context.missingLocation;
        context.done = true;
      } else {
        context.missingLocation = true;
        delete context.forecast;
      }
      return context;
    },
    greet({context, entities}) {
      console.log((JSON.stringify(context)));
      var greet_val = firstEntityValue(entities, 'greeting');
      context = {};
      if(greet_val == "hello")
        context.greetingreply = "Hello hooman!";
      else if(greet_val == "thanks")
        context.greetingreply = "You are very welcome";
	  else if(greet_val == "bye")
	  	context.greetingreply = "Bye. See you soon <3";
      return context;
    },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
};

const wit = new Wit({
  accessToken: accessToken,
  actions,
  logger: new log.Logger(log.INFO)
});

// to post data
app.post('/webhook/', function (req, res) {
	console.log("Incoming...");
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id

		const sessionId = findOrCreateSession(sender);

		if (event.message && event.message.text) {
			let text = event.message.text
			if (text === 'Generic') {
				sendGenericMessage(sender)
				continue
			}

			wit.runActions(
			sessionId, // the user's current session
			text, // the user's message
			sessions[sessionId].context // the user's current session state
			).then((context) => {
				 // Our bot did everything it has to do.
			// Now it's waiting for further messages to proceed.
			console.log('Waiting for next user messages');

			// Based on the session state, you might want to reset the session.
			// This depends heavily on the business logic of your bot.
			// Example:
			if (context['done']) {
			  delete sessions[sessionId];
			}
			else
			// Updating the user's current session state
				sessions[sessionId].context = context;
			})
			.catch((err) => {
			console.error('Oops! Got an error from Wit: ', err.stack || err);
			})
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


// recommended to inject access tokens as environmental variables, e.g.
// const token = process.env.PAGE_ACCESS_TOKEN
const token = "EAAFNhaSRphcBALmjXImjXyIbZB7vTNJ6g9ZBSiZAefwDzqNzrCALGOhsPz82BFYK27BrDPMsKnZCkNmAl2is9oZBEbe9jpaVN9582ZCsZAc6Vy1pjiKKpRwgvw13YtTQhiB9mjV7fIidXZCBQqS4otqbnYoE0QRXSNBwNTpNZAQHPrAZDZD"

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