var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var nforce = require('nforce');
//var messenger = require('./modules/messenger'),

SF_CLIENT_ID = process.env.SF_CLIENT_ID,
SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET,
SF_USER_NAME = process.env.SF_USER_NAME,
SF_PASSWORD = process.env.SF_PASSWORD;

let org = nforce.createConnection({
    clientId: SF_CLIENT_ID,
    clientSecret: SF_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/oauth/_callback',
    mode: 'single',
    autoRefresh: true
});
let login = () => {
    org.authenticate({username: SF_USER_NAME, password: SF_PASSWORD}, err => {
        if (err) {
            console.error("Authentication error");
            console.error(err);
        } else {
            console.log("Authentication successful");
        }
    });
};
let createCase = () => {
    return new Promise((resolve, reject) => {
        let c = nforce.createSObject('Case');
        c.set('subject','Case from facebook bot');
        c.set('description', 'Description from facebook bot');
        c.set('origin', 'Web');
        c.set('status', 'New');
        org.insert({sobject: c}, err => {
            if (err) {
                console.error(err);
                reject("An error occurred while creating a case");
            } else {
                resolve(c);
            }
        });
    });

};

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.set('verify_token', (process.env.VERIFY_TOKEN || 'TEST'));
app.set('page_access_token', (process.env.PAGE_ACCESS_TOKEN || 'NULL'));

app.get('/', function (req, res) {
        res.send('It Works! Follow FB Instructions to activate.');
});

app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === app.get('verify_token')) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong validation token');
    }
});

app.post('/webhook/', function (req, res) {
    console.log (req.body);
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text;
            // Your Logic Replaces the following Line
            if(text === "Hi") {
                text = "Hello there, how can I help you?";
            } else if(text === "How are you?") {
                text = "I am good.";
            } else if(text === "Can you talk to Salesforce?") {
                text = "Yes I can. What can I do for you?";
            } else if(text === "Just create a dummy Case for me") {
                createCaseSF();
                text = "Done. Please login to Salesforce and verify.";    
            } else if(text === "Also create a dummy Account") {
                createAccountSF();
                text = "Account created. Please login to Salesforce and verify.";    
            } else if(text === "Thank you") {
                text = "You are welcome dear. Have a nice day !";
                sendTextMessage(sender, 'It was nice talking to you');
            }      
            sendTextMessage(sender, text);
        }
    }
    res.sendStatus(200);
});

function sendTextMessage(sender, text) {
    messageData = {
        text:text   
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:app.get('page_access_token')},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function createCaseSF() {
        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.SF_Session    
        }

        // Configure the request
        var options = {
            url: 'https://demoorg2019-dev-ed.my.salesforce.com/services/data/v43.0/sobjects/Case',
            method: 'POST',
            json: true,
            headers: headers,
            body: {"Subject" : "Facebook bot", "Origin" : "Web","Status" : "New"}
        }

        // Start the request
        request(options, function (error, response, body) {
            console.log('response SF ' + JSON.stringify(response));    
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(body)
            }
        });
}

function createAccountSF() {
        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.SF_Session    
        }

        // Configure the request
        var options = {
            url: 'https://demoorg2019-dev-ed.my.salesforce.com/services/data/v43.0/sobjects/Account',
            method: 'POST',
            json: true,
            headers: headers,
            body: {"Name" : "Facebook bot Account"}
        }

        // Start the request
        request(options, function (error, response, body) {
            console.log('response SF ' + JSON.stringify(response));    
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(body)
            }
        });
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
