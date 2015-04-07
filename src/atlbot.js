
//
// To run :
//  > npm install
// 	> node atlbot

var SlackClient = require('slack-client'); // import from node_modules folder
var Log = require('log'); // import from node_modules folder

var logger = new Log();

    autoReconnect = true,
    autoMark = true;
	
var slack = new SlackClient(token, autoReconnect, autoMark);
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

function onMessage(message){

	var type = message.type,
	    channel = slack.getChannelGroupOrDMByID(message.channel),
	    user = slack.getUserByID(message.user),
	    time = message.ts,
	    text = message.text;
		
	var username = user == null ? '?' : user.name;
	var channelName = channel == null ? '?' : channel.name;

	logger.info('Received: %s %s @%s %s "%s"', type, (channel.is_channel ? '#' : '') + channelName, username, time, text);		
}

function onError(error){
	logger.error('Error: %s', error);
}


