import plotly.plotly as py
import plotly.graph_objs as go
import plotly.offline as offline
import json
import sys
import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
USERNAME = os.getenv("PLOTLY_USERNAME")
PASSWORD = os.getenv("PLOTLY_PASSWORD")
py.sign_in(username=USERNAME, api_key=PASSWORD)


channel_id = sys.argv[2] #"74"
channel_name = sys.argv[3]#General
user_names =sys.argv[4] #{"U8TTLHE3Y":"Evan"}
data1 = sys.argv[1]
print(data1.replace("'","\""))
data1 = json.loads(data1)
#user_names = user_names.replace("'","\"")
user_names = json.loads(user_names)
print(user_names)
def pull_data(user):
	sum = 0
	score = []
	for x in user: 
		sum = sum + user[x]
	for y in user:
		user[y] = float(user[y]) / sum
	for emo in all_emotion:
		score.append(user[emo])
	return score

CACHE_DICTION = {}

for user in data1:
	if user == 'undefined':
		pass
	else:
		usern = user_names[user]
		CACHE_DICTION[usern] = data1[user]['total'] 

title = channel_name + ' Individual Breakdown of Emotions'
all_emotion = ['analytical', 'anger', 'confident', 'fear', 'joy', 'sadness', 'tentative']

anal = []
ang = []
conf = []
fear = []
joy = []
sad = []
tent = []

users = list(CACHE_DICTION.keys())

for user in users:
	user_data = CACHE_DICTION[user]
	li1 = list(user_data.keys())
	li2 = list(set(all_emotion) - set(li1))
	for i in li2:
		user_data[i] = 0
	score = pull_data(user_data)
	anal.append(score[0])
	ang.append(score[1])
	conf.append(score[2])
	fear.append(score[3])
	joy.append(score[4])
	sad.append(score[5])
	tent.append(score[6])

trace1 = go.Bar(
	x= users,
	y= anal,
	name = 'Analytical'
	)

trace2 = go.Bar(
	x= users,
	y= ang,
	name = 'Anger'
	)

trace3 = go.Bar(
	x= users,
	y= conf,
	name = 'Confident'
	)

trace4 = go.Bar(
	x= users,
	y= fear,
	name = 'Fear'
	)

trace5 = go.Bar(
	x= users,
	y= joy,
	name = 'Joy'
	)

trace6 = go.Bar(
	x= users,
	y= sad,
	name = 'Sadness'
	)

trace7 = go.Bar(
	x= users,
	y= tent,
	name = 'Tentative'
	)

data = [trace1, trace2, trace3, trace4, trace5, trace6, trace7]
layout = go.Layout(title = title,
	barmode = 'stack'
	)

fig = go.Figure(data = data, layout = layout)
fname = channel_id + ".png"
py.image.save_as(fig, filename=fname)

print(fname)



