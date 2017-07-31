// JavaScript source code
'use strict';

var Client = require('node-rest-client').Client;

const cardTitle = "WhatGeeks";

function GoogleProxy()
{
    var me = this;
    
    var timeMin = new Date();
    var timeMax = new Date(timeMin.getTime() + 86400000);
    
    me.OnReturn = undefined;
    
    timeMax.setHours(0);
    timeMax.setMinutes(0);
    timeMax.setSeconds(0);
    
    console.log(timeMax);
    console.log(timeMin);
    
    var getEventsQuery = "https://clients6.google.com/calendar/v3/calendars/a73q3trj8bssqjifgolb1q8fr4@group.calendar.google.com/events?calendarId=a73q3trj8bssqjifgolb1q8fr4%40group.calendar.google.com&singleEvents=true&timeZone=Europe%2FLondon&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=" + timeMin.toISOString() + "&timeMax=" + timeMax.toISOString() + "&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs";
    
    var googleCallback = function(data, response) {
        console.log(getEventsQuery);
        console.log("data received");

        var eventText = "<Empty>";
        var totalEventsTotal = 0;

        if (data.items.length === 0)
            eventText = "There are no events today";
        else {
            eventText = "Today you can Geek Out at ";
            for (var i = 0; i < data.items.length; i++) {
                var event = data.items[i];
                var date = new Date();
                console.log("event=" + i);
                console.log("We have=" + event.summary);

                totalEventsTotal++;

                eventText += (event.summary + " at " + event.location);
            }
            if (totalEventsTotal === 0)
                eventText = "There are no events today";
        }

        console.log(eventText);

        me.OnReturn({}, buildSpeechletResponse(cardTitle, eventText, "Either use today or your location", true));
    };

    me.getEvents = function(location, callback)
    {
        // Call the service
        var client = new Client();

        me.OnReturn = callback;

        client.get(getEventsQuery, googleCallback);
    };
}

function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    var intent = intentRequest.intent;
    var intentTypeName = intentRequest.type.toUpperCase();

    if (intentTypeName === "INTENTREQUEST") {
        var intentName = intentRequest.intent.name;
        // Dispatch to your skill's intent handlers
        console.log("Intent " + intentTypeName);
        if ((intentName.toUpperCase() === 'WHATGEEKS') || (intentName.toUpperCase() === 'WHAT GEEKS')) {
            console.log("Calling out to Google Calendar");
            
            var googleProxy = new GoogleProxy();
            googleProxy.getEvents("Manchester", callback);
        }
        else if (intentName.toUpperCase() === "AMAZON.HELPINTENT") {
            callback({}, buildSpeechletResponse(cardTitle, "Call out today or your location", "Either use today or your location", false));
        }
        else if ((intentName.toUpperCase() === "AMAZON.STOPINTENT") || (intentName.toUpperCase() === "AMAZON.CANCELINTENT")) {
            callback({}, buildSpeechletResponse(cardTitle, "", "", true));
        }

    } else if (intentTypeName === "LAUNCHREQUEST") {
        callback({}, buildSpeechletResponse(cardTitle, "What would you like to know?", "Either use today or your location", false));
    }
    else {
        throw new Error('Invalid intent type ' + intentTypeName);
    }
}


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `${title}`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}


function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes: sessionAttributes,
        response: speechletResponse,
    };
}

exports.handler = (event, context, callback) => {
    try {
        console.log("Sensed a message");
        if (event.request.type === 'IntentRequest') {
            onIntent(event.request, event.session, (sessionAttributes, speechletResponse) => {
                console.log("Got to the handler");
                context.succeed(buildResponse(sessionAttributes, speechletResponse));
            });
        }
        else if (event.request.type === 'LaunchRequest') {
            onIntent(event.request, event.session, (sessionAttributes, speechletResponse) => {
                console.log("Got to the handler");
                context.succeed(buildResponse(sessionAttributes, speechletResponse));
            });
        }
    }
    catch (err) {
        callback(err);
    }
};