var slack = require('slack');
var watson = require('watson-developer-cloud');
var http = require("http");
var path = require('path');
const fs = require('fs');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();
temp_data = {};
current_channel = "";
current_user = "";
att = "https://media.giphy.com/media/krP2NRkLqnKEg/giphy.gif"
let rawdata = fs.readFileSync('emotions.json');  
let emotion_data = JSON.parse(rawdata)[0];  
var tone_analyzer = watson.tone_analyzer({
        username: process.env.TONE_ANALYZER_USERNAME,
        password: process.env.TONE_ANALYZER_PASSWORD,
        version_date: '2017-09-21',
        version:'v3'
  });

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
let token = process.env.SLACK_BOT_TOKEN

//listening on local host
const server = app.listen(3000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

//Bot Message Response

function sendMessageResponse(res, to_user, to_channel, message_text, attachements){
  let r = { 
    response_type: 'ephemeral', 
    user: to_user,
    channel: to_channel,
    text: message_text,
    attachments:attachments
  }; 
  res.json(r);
}



/*HELPER FUNCTIONS*/

function storeData(ev){
  let text = ev.text; 
  let regex = /(^:.*:$)/;
  if(regex.test(text)) {
    text = text.replace(/_/g , ' ');
    text = text.replace(/:/g , '');
  }
  if (text.slice(-1) != "."){
    text = text + "."
  }
  let user = ev.user
  let channel = ev.channel

  if (user in temp_data){
    if (channel in temp_data[user]){
      old_text = temp_data[user][channel]
      new_text = old_text.concat(text)
      temp_data[user][channel] = new_text
    } 
    else{
      temp_data[user][channel] = text
    }
  }
  else{
    temp_data[user] = {}
    temp_data[user][channel] = text
    
  }


}








/*INTERVAL CHECK*/

function getStress(tone){
  attachments1 = [{image_url:"https://media.giphy.com/media/krP2NRkLqnKEg/giphy.gif"}]
  var obj = JSON.parse(tone);
  emotions = obj["document_tone"]["tones"]
  for (i in emotions){
    if (emotions[i]['tone_name'] == "Tentative"){
      if (emotions[i]['score'] > 0.9){

        slack.chat.postEphemeral(
          {
            token:token, 
            user:current_user, 
            channel:current_channel,
            text:"Remember to take deep breathes.",
            attachments:attachments1
        }, function(err,data){});
       
        
      }
    }
  }
  
}


function getMaxEmotion(emotions){

  const max_emotion = emotions.reduce(function(prev, current) {
    return (prev.score > current.score) ? prev : current
  }) //returns object
  return max_emotion
}

function saveData(messages, max_emotion){
  var d = new Date();
  var n = d.getTime();
  tone_id = max_emotion['tone_id']

  if (current_channel in emotion_data){
    if (current_user in emotion_data[current_channel]){
      if (tone_id in emotion_data[current_channel][current_user]['total']){
        emotion_data[current_channel][current_user]["total"][tone_id] += 1
        emotion_data[current_channel][current_user]["messages"].push([emotions, n])
      }
      else{
        emotion_data[current_channel][current_user]["total"][tone_id] = 1
        emotion_data[current_channel][current_user]["messages"].push([emotions, n])
      }
    }
    else{
      emotion_data[current_channel][current_user] = {}
      emotion_data[current_channel][current_user]["total"] = {}
      emotion_data[current_channel][current_user]["total"][tone_id] = 1
      emotion_data[current_channel][current_user]["messages"] = [[emotions, n]]
    }
  }
  else{
    emotion_data[current_channel] = {}
    emotion_data[current_channel][current_user] = {}
    emotion_data[current_channel][current_user]["total"] = {}
    emotion_data[current_channel][current_user]["total"][tone_id] = 1
    emotion_data[current_channel][current_user]["messages"] = [[emotions, n]]

  }
}



function getTone(messages){
    tone_analyzer.tone({text:messages}, 
      function(err, tone) {
        t = JSON.stringify(tone, null, 2)
        var obj = JSON.parse(t);
        emotions = obj["document_tone"]["tones"]
        if (emotions[0] != undefined){
          max_emotion = getMaxEmotion(emotions)
          saveData(messages, max_emotion)
          getStress(t)   
        }
      }); 
}


function intervalFunc() 
  {
    for(u in temp_data){
      for (c in temp_data[u]){
        current_channel = c;
        current_user = u;
        messages = temp_data[u][c]
        tone = getTone(messages)

      }
    }
    

    let data = JSON.stringify([emotion_data]);  
    fs.writeFileSync('emotions.json', data);  
   
    temp_data = {}
  }

setInterval(intervalFunc,15*60*1000);











/*OVERVIEW HELPER*/
function getChannelUsers(data,c){

  data = data['channels']
  for (ch in data) {
    if (data[ch]['id'] == c){
      return data[ch]['members']
    }
  } 
}



function getScores(user_list, c, res){
  scores = {}
  for (u in user_list) {
    us = user_list[u]
    scores[us] = {}
    for (d in emotion_data) {
      da = emotion_data[d]
      if (us == da['user']){
        if (da['channel'] == c) {
          for (t in da['tone']) {
            to = da['tone'][t]
            tone_id = to['tone_id']
            if (tone_id in scores[us]) {
              scores[us][tone_id] = scores[us][tone_id] + to['score']
            }
            else {
              scores[us][tone_id] = to['score']
            }
          } 
        }
      }
    }
  }
  postOverview(scores, res)
}
function generateGraph(channel_id){

  data_to_send = emotion_data[channel_id]
  user_names = {}
  slack.channels.list(
    {
      token:token
    },
    function(err, data){
      data = data['channels']
      for (d in data){
        if (data[d]['id'] == channel_id){
          channel_name = "#" + data[d]['name']
          slack.users.list(
          {
              token: token,
              channel:channel_id, 
          },
          function(err, data) {
              
              data = data['members']
              for (da in data){
                u_id = data[da]['id']
                if (data[da]['id'] in data_to_send){
                  user_names[u_id] = data[da]['name']
                }
              }
		new_d = []
		new_d.push(data_to_send)
              var PythonShell = require('python-shell');
              var options = {
                mode: 'text',
                args: [JSON.stringify(data_to_send), channel_id, channel_name, JSON.stringify(user_names)]
              };
              PythonShell.run('generate_graph.py', options, function (err, results) {
                console.log(results)//, results[1])
		if (err){
		console.log(results)
		 throw err;
		
		}
              });
          }
          );
        }
      }
    }
  );
  
  
}  
function postGraph(fname, c){
  slack.files.upload({
      token: token,
      file: fs.createReadStream(path.join(fname)),
      channels: c
  }, function(err, data) {
      if (err) {
          console.error("this error", err);
      }
      else {
          console.log('Uploaded file details: ', data);
      }
  });
}























/*EMOTION HELPER*/

function getAverages(user_id, c){
  var d = new Date();
  var n = d.getTime();
  count = 0
  averages = {"tentative":[], "joy":[], "sadness":[], "analytical":[],"anger":[], "confident":[], "fear":[]}
  min_time = n - 60000*60*24
  user_data = emotion_data[c][user_id]["messages"]
  user_data = user_data.reverse()
  for (m in user_data){
    if (user_data[m][1] > min_time){
      count += 1
      for (k in user_data[m][0]){
        tone_id = user_data[m][0][k]["tone_id"]
        averages[tone_id].push(user_data[m][0][k]["score"])
      }
    }
  }
    for (emot in averages){
      total = 0
      for (k in averages[emot]){
        total += averages[emot][k]  
      }
      averages[emot] = total / count
    }
  return averages
}


function postList(res, response_id, c){
  slack.channels.list(
    {
       token: token 
    },
    function(err, data) {   
      channels = data['channels']
      user_ids = {}
      for (d in channels){
        if (channels[d]['id'] == c){
            for (m in channels[d]['members']){
              user_ids[channels[d]['members'][m]] = 0
            }
          }
        }
      
      slack.users.list(
        {token:token,channel:c},
        function(err, data){
          data = data['members']
          for (da in data){
            if (data[da]['id'] in user_ids){
               if (data[da]['is_bot'] == false) {
                if (data[da]['deleted'] == false){
                  if(data[da]['id'] != "USLACKBOT"){
                    names.push(data[da]['name'])
                  }
                }
              }
            }
          }

        name_response = ""
          for (n in names)
          {
            name_response = name_response + names[n] + "\n"
          }
          attachments = [{"title": "Channel Users",
                  "pretext": "Here are the available users to select from.",
                  "text": name_response}]

          sendMessageResponse(res, response_id, c, "", attachments)


        });
    });


}

function getSentence(data){
  sentences = {"stress":"! has a lot on their plate right now. Consider offering to help them out.",
"fstress":"Send ! an uplifting message, such as a reminder of what you appreciate about them.",
"fsad":"! is going through a rough patch right now. Maybe they'll appreciate it if you'd offer to meet in person.",
"fanger":"! is feeling a bit agitated. Send ! a comforting message. ",
"ffear":"Send ! a message of reassurance!",
"sad":"Offer ! to be there for them if they would like to talk.",
"anger":"It might be best to not write to ! at this moment, unless it's really important. ",
"fear":"Consider sending ! this quote by Eleanor Roosevelt: You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face. You must do the thing which you think you cannot do."
};
  if (data['tentative']>0.5)
  {
    if((data['sadness']>0.2 && data['sadness']<0.4) || (data['fear']>0.2 && data['fear']<0.4))
    {
        return sentences['stress']
    }
    else if(data['sadness']>0.2 && data['fear']>0.2)
    {
        return sentences['fstress']
    }
    else if(data['sadness']>0.2)
    {
        return sentences['fsad']
    }
    else if(data['anger']>0.4)
    {
        return sentences['fanger']
    }
    else if(data['fear']>0.4)
    {
        return sentences['ffear']
    }
  }
  else if(data['sadness']>0.4)
  {
      return sentences['sad']
  }
  else if(data['anger']>0.4)
  {
      return sentences['anger']
  }
  else if(data['fear']>0.4)
  {
      return sentences['fear']
  }
  else
  {
    return 'We were unable to determine the emotion of ! in the last 24 hours.'
  }
}
var selected_message = "Hey, how are you doing?"
function postUserEmotion(req, res, t){
  var reqBody = req.body
  this_user = reqBody.user_id
  var responseURL = reqBody.response_url
  check_user = ""
  slack.users.list(
    {
       token: token, 
    },
    function(err, data) {  
      members = data['members']
      for (d in members){
        d = members[d]
        
        if (t == d["name"]){
          check_user = d["id"]
        }
        if (this_user == d['id']){
          this_user = d['name']
        }
      }

      if (check_user == ""){
        text = "I was unable to find that user. Try: '/emotion list' to see the available users." 
        attachments = [{}]
        sendMessageResponse(res, this_user, req.body['channel'], text, attachments)
        return
      }
      
      averages = getAverages(check_user, req.body['channel_id'])
      sentence_response = getSentence(averages)
      new_sentence = ""
      for (ch in sentence_response){
        if(sentence_response[ch] == '!'){
          new_sentence += t
        }
        else{
            new_sentence += sentence_response[ch]
          } 
        
      }
      attachments=[
        {
            "text": "Would you like to send a message to " + t + "?",
            "fallback": "",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "callback_id": "message_selection",
            "actions": [
                {
                    "name": "message_list",
                    "text": "Choose a message",
                    "type": "select",
                    "selected_options": [
                       {
                            "text": "Hey, how are you doing?",
                            "value": "Hey, how are you doing?"
                        }
                    ],
                    "options": [
                        {
                            "text": "Hey, how are you doing?",
                            "value": "Hey, how are you doing?"
                        },
                        {
                            "text": "Is there anything I can do to help?",
                            "value": "Is there anything I can do to help?"
                        },
                        {
                            "text": "Everything will be ok!",
                            "value": "Everything will be ok!"
                        }
                        
                    ]
                },
                {
                  "name": check_user,
                  "text": "Yes, send message",
                  "type": "button",
                  "style": "primary",
                  "value": this_user
                },
                {
                  "name": "no",
                  "text": "No, dismiss",
                  "type": "button",
                  "style": "danger",
                  "value": "no"
                }
            ]
        }
      ]
       sendMessageResponse(res, this_user, check_user, new_sentence, attachments)
  });
}





/*LISTEN FOR SLASH COMMANDS*/

/* Bot */

app.post('/events', (req, res) => {
  let q = req.body;
  console.log('Event triggered');

  if (q.token !== process.env.SLACK_AUTH_TOKEN) {
    res.sendStatus(400);
    return;
  }


  if (q.type === 'url_verification') {
    res.send(q.challenge);
  }

  else if (q.type === 'event_callback') {
    if(!q.event.text) return;

    let regex = /(^\/)/;
    if(q.event.subtype === 'bot_message' || regex.test(q.event.text)) return;

    storeData(q.event)


    res.sendStatus(200);
  }
});

app.post('/overview', (req, res) => { 

  let c = req.body;
  let us = c.user_id
  c = c['channel_id'];
	attachments = [{}]
	sendMessageResponse(res, us, c, "Generating graph...",attachments)
//  slack.chat.postEphemeral(
  //    {
    //      token: token,
      //    user:us,
        //  channel:c,
         // text: "Generating Graph..."
          
     // },
     // function(err, data) {
          // Handle errors here
    //  }
   // );

  generateGraph(c)
  setTimeout(function(){
    fname = c.toString()+'.png'
    postGraph(fname, c)
  }, 10000);
  
 
});


app.post('/intervene', (req, res) => { 
  let q = req.body;
  let user = q.user_id
  let time = q.text
  attachments=[{image_url:"https://media.giphy.com/media/krP2NRkLqnKEg/giphy.gif"}]
  sendMessageResponse(res, user, q['channel'], "Remember to take deep breathes.", attachments)
});

app.post('/emotion', (req, res) => { 
  let q = req.body;
  let user = q.user_id
  let t = q.text
  c = q['channel_id'];
  names = []
  if (t == "list")
  {
    postList(res, user, c)
  }
  else 
  {
    postUserEmotion(req, res, t)
  }
});


app.post('/save', (req, res) => { 
  intervalFunc()
  attachments = [{}]
  sendMessageResponse(res, req.body.user_id, req.body['channel_id'], "Saved data.", attachments)

});


function sendMessageToSlackResponseURL(responseURL, JSONmessage){
    var postOptions = {
        uri: responseURL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        json: JSONmessage
    }
    request(postOptions, (error, response, body) => {
        if (error){}})
}

app.post('/slack/actions', (req, res) =>{
    res.status(200).end() 
    var actionJSONPayload = JSON.parse(req.body.payload)
    if (actionJSONPayload.actions[0].name != "no" && actionJSONPayload.actions[0].name != "message_list"){
      signature = " _"+actionJSONPayload.actions[0].value+"_"
      var message = {
        "text": "Message sent.",
        "replace_original": true
      }
     sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
      slack.im.open(
        {
            token: token,
            
            user: actionJSONPayload.actions[0].name,
            
          },
        function(err, data) {
            // Handle errors here
          slack.chat.postMessage(
            {
              token: token,

              channel: actionJSONPayload.actions[0].name,
              text: selected_message + signature
            },
          function(err, data) {});
        });
      
      sendMessageResponse(res, actionJSONPayload.actions[0].name, actionJSONPayload.actions[0].name, actionJSONPayload.actions[0].value, [{}])
    }
    else if (actionJSONPayload.actions[0].value == "no"){

      var message = {
        "text": "Dismissed.",
        "replace_original": true
      }
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
    }
    else if (actionJSONPayload.actions[0].name == "message_list"){
      selected_message =  actionJSONPayload.actions[0]['selected_options'][0].value

    }

    
})



