//
// To run :
//  > npm install
// 	> node atlbot

var slackClient = require('slack-client'),	// import from node_modules folder
	log = require('log'),					// import from node_modules folder
	http = require('http'),					// import node's http module
	querystring = require('querystring');	// import node's querystring module

var logger = new log();


var token = '--ENTER YOUR TOKEN--',
    autoReconnect = true,
    autoMark = true;

var slack = new slackClient(token, autoReconnect, autoMark);
slack.on('open', onOpen);
slack.on('message', onMessage);
slack.on('error', onError);
slack.login();


function onOpen() {

    var channels = [],
        groups = [],
        unreads = slack.getUnreadCount(),
        key;

    for (key in slack.channels) {
        if (slack.channels[key].is_member) {
            channels.push('#' + slack.channels[key].name);
        }
    }

    for (key in slack.groups) {
        if (slack.groups[key].is_open && !slack.groups[key].is_archived) {
            groups.push(slack.groups[key].name);
        }
    }

    logger.info('Welcome to Slack. You are @%s of %s', slack.self.name, slack.team.name);
    logger.info('You are in: %s', channels.join(', '));
    logger.info('As well as: %s', groups.join(', '));
    logger.info('You have %s unread ' + (unreads === 1 ? 'message' : 'messages'), unreads);
}

function onMessage(message) {

    var msg = parseMessage(message);

    logTheMessage(msg);

    if (shouldHandleMessage(msg))
        sendToMessageHandler(msg);
}

function onError(error) {
    logger.error('Error: %s', error);
}

function parseMessage(message) {

    var channel = slack.getChannelGroupOrDMByID(message.channel),
        user = slack.getUserByID(message.user);

    return {
        'type': message.type,
        'subtype': message.subtype,
        'isDirectMessage': channel.is_im ? channel.is_im : false,
        'isDirectMention': is_directMention(message),
        'isChannel': channel.is_channel ? channel.is_channel : false,
        'channelId': channel.id ? channel.id : null,
        'channelName': channel.name ? channel.name : null,
        'userId': user ? user.id : null,
        'username': user ? user.name : null,
        'time': message.ts,
        'text': message.text,
        'commandText': getCommandText(message)
    };
}

// check if the the message begins by mentioning me, the bot
function is_directMention(message) {
    var re = new RegExp('^\<\@' + slack.self.id + '\>');
    return re.test(message.text);
}

function getCommandText(message) {
    if (is_directMention(message)) {
        var userIdPattern = '<\@' + slack.self.id + '\>';
        var optionalColon = '\:?';
        var spaces = '\\s+';
        var command = '(.*)';

        var matches = new RegExp('^' + userIdPattern + optionalColon + spaces + command, 'i').exec(message.text);

        return (matches == null || matches.length < 2) ? '' : matches[1];
    }

    return message.text;
}

function logTheMessage(message) {
    
    var logMsg = '\nReceived Message\n';

    logMsg += 'type: ' + message.type + '\n';
    logMsg += 'subtype: ' + message.subtype + '\n';
    logMsg += 'is direct message: ' + message.isDirectMessage + '\n';
    logMsg += 'is direct mention: ' + message.isDirectMention + '\n';
    logMsg += 'is channel: ' + message.isChannel + '\n';
    logMsg += 'channel id: ' + message.channelId + '\n';
    logMsg += 'channel name: ' + message.channelName + '\n';
    logMsg += 'user id: ' + message.userId + '\n';
    logMsg += 'username: ' + message.username + '\n';
    logMsg += 'time: ' + message.time + '\n';
    logMsg += 'text: ' + message.text + '\n';
    logMsg += 'command text: ' + message.commandText + '\n';

    logger.debug(logMsg);
}

function shouldHandleMessage(message) {
    return ((message.isDirectMessage || message.isDirectMention) && message.subtype != 'bot_message');
}

function sendToMessageHandler(message) {
    var params = {
        'teamId': '',
        'teamDomain': '',
        'channelId': message.channelId,
        'channelName': message.channelName,
        'userId': message.userId,
        'userName': message.username,
        'text': message.commandText
    };

    var postData = querystring.stringify(params);

    var options = {
        port: 80,
        path: '/api/AtlBot',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    var req = http.request(options, function(res) {
        logger.info('STATUS: ' + res.statusCode);
        logger.info('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            console.log('BODY: ' + chunk);
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    // write data to request body
    req.write(postData);
    req.end();
}
