# emote

https://api.slack.com/tutorials/watson-sentiment


1. Download the file, unzip it.
2. Install ngrok and node.js
3. brew install nvm
brew install node.js
4. source $(brew --prefix nvm)/nvm.sh
5. nvm install 9
6. Download ngrok from [https://ngrok.com] and unzip ngrok 
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

29. For watson get a tone analyzer API Key
30. For Plotly, get an API key
31. Enter all of those into the .env file
32. Go back to Terminal
33. Navigate into the emote folder
34. npm init
35. Enter until you get to the end
36. npm install slack
37. npm install request
38. npm install express
39. npm install watson-developer-cloud
40. node index.js


Usage
*****

/emotion
/overview
/intervene
/emotion list
