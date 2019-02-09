var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var nforceapp = require('nforce');
//var sfdc = require('./salesforce'),
        
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
                text = "Okay.. creating";
                //callSalesforce();
                text = "Done. Please check";    
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

function callSalesforce() {
        // Set the headers
        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 00D0o00000182NE!AQQAQBK2G0LHkaKo9rMIqB6bi6aJBR2OAyQw2LSdisFP_XGM4TWLBPiD1.GgTW6LCa39MPnlGz5PREEyNnGRt0yiT2ky7GQl'    
        }

        // Configure the request
        var options = {
            url: 'https://demoorg2019-dev-ed.my.salesforce.com/services/data/v43.0/sobjects/Case/',
            method: 'POST',
            headers: headers,
            form: {"Subject" : "Facebook bot", "Origin" : "Web","Status" : "New"}
        }

        // Start the request
        request(options, function (error, response, body) {
            console.log('response SF ' + JSON.stringify(response));    
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(body)
            }
        })
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
