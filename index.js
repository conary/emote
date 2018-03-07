//Requires nodeJS and ngrok (or AWS)
//Interacts with Slack by listening for "/events", like messages
//Can listen for custom / commands

const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

//listening on local host 8888
const server = app.listen(8888, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});


/* Auth - using a temp token */

let oauthToken = "xoxp-297580583521-299275373062-313011296166-4472ff5eac4dbde95100bfd47b10c8ac"


/* Bot */

app.post('/events', (req, res) => {
  let q = req.body;
  console.log('Event triggered');
  console.log(q);

  // To see if the request is coming from Slack
  if (q.token !== "fwqosoBMWBmGeCQ3jsETUSJg") {
    res.sendStatus(400);
    return;
  }

  // App setting validation
  if (q.type === 'url_verification') {
    res.send(q.challenge);
  }

  // Events
  else if (q.type === 'event_callback') {
    if(!q.event.text) return;

    // Exclude the message from a bot, also slash command
    let regex = /(^\/)/;
    if(q.event.subtype === 'bot_message' || regex.test(q.event.text)) return;


    // dumps user id, message text, and time to json file
    gatherData(q.event)
     

    // sends message text to parallelDots and posts emotion on channel
    // analyzeTone(q.event);

    res.sendStatus(200);
  }
});


function gatherData(ev) {
  let text = ev.text;
  let regex = /(^:.*:$)/; // ignore Slack emoji
  if(regex.test(text)) {
    text = text.replace(/_/g , ' ');
    text = text.replace(/:/g , '');
  }
  let user = ev.user
  let time = ev.ts

  //calls python file "collection_script"
  var spawn = require("child_process").spawn;
  var pythonProcess = spawn('python',["collection_script.py", text, user, time]);

}


function analyzeTone(ev) {
  let text = ev.text;

  let regex = /(^:.*:$)/; // Slack emoji, starts and ends with :
  if(regex.test(text)) {
    text = text.replace(/_/g , ' ');
    text = text.replace(/:/g , '');
  }

  //calls python file parallelDots
  var spawn = require("child_process").spawn;
  var pythonProcess = spawn('python',["parallelDots.py", text]);

  //sends python printed data to postEmotion
  pythonProcess.stdout.on('data', function (data){
    postEmotion(data,ev)
  });
}

//sending a message to the channel
function postEmotion(emotion, ev) {
  console.log('Current Emotion is', emotion);

  let username = '';
  request.post('https://slack.com/api/users.info', {form: {token: oauthToken, user: ev.user}}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      username = JSON.parse(body).user.name;
      let message = username + ' is FEELING ' + emotion;

      let options = {
        method: 'POST',
        uri: 'https://slack.com/api/chat.postMessage',
        form: {
          token: "xoxb-313011298214-3APz1y5ZGRiaxjfrw8PSsyC0",
          channel: ev.channel,
          text: message,
          as_user: false,
          username: 'emote'
        }
      };

      request(options, (error, response, body) => {
        if (error) {
          console.log(error)
        }
      });
    }
  });
}




// IBM Watson Tone Analysis

// const watson = require('watson-developer-cloud');

// let tone_analyzer = watson.tone_analyzer({
//   username: "22df59b3-1c33-45cc-94d3-351488287977",
//   password: "RMVg3sXGg5PE",
//   version: "v3",
//   version_date: '2016-05-19'
// });

// const confidencethreshold = 0.55;

//   tone_analyzer.tone({text: text}, (err, tone) => {
//     if (err) {
//       console.log(err);
//     } else {
//       tone.document_tone.tone_categories.forEach((tonecategory) => {
//         if(tonecategory.category_id === 'emotion_tone'){
//           console.log(tonecategory.tones);
//           tonecategory.tones.forEach((emotion) => {
//             if(emotion.score >= confidencethreshold) { // pulse only if the likelihood of an emotion is above the given confidencethreshold
//               postEmotion(emotion, ev)
//             }
//           })
//         }
//       })
//     }
//   });
// }