//Requires nodeJS and ngrok (or AWS)
//Interacts with Slack by listening for "/events", like messages
//Can listen for custom / commands

const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//listening on local host 8888
const server = app.listen(8888, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});


/* Auth - using a temp token */

let oauthToken = "xoxp-297580583521-299275373062-325677618657-284974fe4354f23f26288ee36057296a"


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




app.post('/emotion', (req, res) => { 
  
  //Get relevant information, like user, text, and arguments
  let q = req.body;
  let user = q.user_id
  let time = q.text
  
  //Set up the arguments/options to pass to the Python file
  var PythonShell = require('python-shell');
  var options = {
    mode: 'text',
    args: [user, time]
  };

  //Run the Python scripts and pass options
  PythonShell.run('watson.py', options, function (err, results) {
    if (err) throw err;
    results = String(results)
    results = results.split(",,")

    //Have the bot send back the results of the Python file.
     if (results[2] == "True"){
      console.log("HEREEEEEEE")
      att = "https://media.giphy.com/media/krP2NRkLqnKEg/giphy.gif"
    }
    else{
      console.log("NOT HERE")
        att = ""
      }
    let d = { 
      response_type: 'in_channel',
      text: results[0] + "\n" + results[1],
      attachments:[{image_url:att}]
      }; 
    
    res.json(d);
  });
});

app.post('/intervene', (req, res) => { 
  
  //Get relevant information, like user, text, and arguments
  let q = req.body;
  let user = q.user_id
  let time = q.text
  
  //Set up the arguments/options to pass to the Python file
  urls = ['https://media.giphy.com/media/krP2NRkLqnKEg/giphy.gif'] //,'https://www.youtube.com/watch?v=PFZ6C2XhJAc','https://soundcloud.com/radioheadspace/packcast-roundtable-stress'
  
  let d = { 
      response_type: 'in_channel', // public to the channel 
      text: "Intervention",
      attachments:[{image_url:"https://media.giphy.com/media/krP2NRkLqnKEg/giphy.gif"}]
      }; 
    res.json(d);
  // postIntervention(urls[0])

});


//Listen for /get command
app.post('/get', (req, res) => { 
  
  //Get relevant information, like user, text, and arguments
  let q = req.body;
  let user = q.user_id
  let number_of_posts = q.text
  
  //Set up the arguments/options to pass to the Python file
  var PythonShell = require('python-shell');
  var options = {
    mode: 'text',
    args: [user, number_of_posts]
  };

  //Run the Python scripts and pass options
  PythonShell.run('get_script.py', options, function (err, results) {
    if (err) throw err;

    //Have the bot send back the results of the Python file.
    let d = { 
      response_type: 'in_channel',
      text: results[0] 
      }; 
    res.json(d);
  });
});

function postMessages(data, res){
    console.log(data)
    let d = { 
      response_type: 'in_channel', // public to the channel 
      text: data 
      }; 
    res.json(d);

}
function gatherData(ev) {

  let text = ev.text; // emoji - :thumbs_up:
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


function postIntervention(req, res){
  console.log("here")
  let d = { 
        response_type: 'in_channel', // public to the channel 
        text: "Intervention",
        attachments:[{image_url:"https://media.giphy.com/media/krP2NRkLqnKEg/giphy.gif"}]
        }; 
      res.json(d);
   
}
//sending a message to the channel
// function postIntervention(link, ev) {
//   // console.log('Current Emotion is', emotion);

//   let username = '';
//   request.post('https://slack.com/api/users.info', {form: {token: oauthToken, user: ev.user}}, function (error, response, body) {
//     if (!error && response.statusCode == 200) {
      

//       let options = {
//         method: 'POST',
//         uri: 'https://slack.com/api/chat.postMessage',
//         form: {
//           token: "xoxb-313011298214-Ki9W5iLHnG73JGgJfV21UwHI",
//           channel: ev.channel,
//           text: link,
//           image_url: "https://media.giphy.com/media/krP2NRkLqnKEg/giphy.gif",
//           as_user: false,
//           username: 'emote'
//         }
//       };

//       request(options, (error, response, body) => {
//         if (error) {
//           console.log(error)
//         }
//       });
//     }
//   });
// }


// function analyzeTone(ev) {
//   let text = ev.text;

//   let regex = /(^:.*:$)/; // Slack emoji, starts and ends with :
//   if(regex.test(text)) {
//     text = text.replace(/_/g , ' ');
//     text = text.replace(/:/g , '');
//   }

//   //calls python file parallelDots
//   var spawn = require("child_process").spawn;
//   var pythonProcess = spawn('python',["parallelDots.py", text]);

//   //sends python printed data to postEmotion
//   pythonProcess.stdout.on('data', function (data){
//     // postEmotion(data,ev)
//   });
// }

