# atlbot
This is a simple bot integration for Slack.

It is based on the sample provided in [node-slack-client](https://github.com/slackhq/node-slack-client/blob/master/examples/simple_reverse.coffee) and was inspired by [hubot](https://hubot.github.com/).

It parses slack messages to determine if a message is a bot command.  It routes the command to an external api that contains custom command handlers. 

To run, open a command line and go to the `src` folder.

Download the dependencies:

`\src> npm install`

Then run the application:

`\src> node atlbot`
