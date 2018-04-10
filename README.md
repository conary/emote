# emote

1. Download the file, unzip it.
2. Install ngrok and node.js
3. brew install nvm
4. source $(brew --prefix nvm)/nvm.sh
5. nvm install 9
6. Download ngrok from [https://ngrok.com]
7. Navigate to the folder you unzipped ngrok into
8. ./ngrok http 3000
9. Copy the temporary forwarding address (ends with .io)
10. Create Slack workspace
11. Navigate to api.slack.com
11. Your apps, create a new app
12. Fill out appropriate information
13. Press create app
14. Open the app on api.slack.com
15. Go to install app to workspace
16. Under "Features", go to interactive components
17. Enable interactive components
18. Paste the ngrok-address you copied in step 9 and add a /slack/actions to the end of it
19. Press Save changes
20. Go to Slash commands
21. Create new command
22. Enter the command /emotion
23. Enter the URL as the Ngrok address plus /emotion
24. Go to Event Subscriptions
25. Paste Ngrok URL plus /events
26. Go to OAuth and Permissions
27. Slick Install App to Workspace
28. Take note of the bot access token

For watson get a tone analyzer API Key
For Plotly, get an API key
Enter all of those into the .env file
Go back to Terminal
Navigate into the emote folder
npm init

Installation Instructions

1. Install required modules using

pip install -r requirements.txt 

2. Rename example_config.py to config.py and enter personal ParallelDots API key.

*************************

Usage

A single or multiple text strings can be entered. When 'e' is entered, the system will output the emotions associated with each text string, followed by the most dominant emotion.
