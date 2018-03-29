
from watson_developer_cloud import ToneAnalyzerV3
import time
import json
import sys

tone_analyzer = ToneAnalyzerV3(
    username='a6872957-9e02-45d3-bb30-de8c9429be39',
    password='5vIgL4Yj2GSJ',
    version='2017-09-26')



def getTone(message):
	t = tone_analyzer.tone(tone_input=message, content_type="text/plain")
	return t
	# try:
	# 	name = t['document_tone']['tones'][0]['tone_name']
	# 	cl = t['document_tone']['tones'][0]['score']
	# 	if name == "Anger" or name == "Fear" or name == "Sadness" or name == "Tentative":
	# 		if cl > 0.9:
	# 			return True
	# 	else:
	# 		return False
	# except:
	# 	return "No tone detected"

def getMessages(data, rtime, user):
	current_time = time.time()

	min_time = current_time - rtime*60

	messages = []
	for i in reversed(data):
		if i['user'] == user:
			if i['time'] == "ignore":
				pass
			else:
		
				message_time = float(i['time'])
				
				if message_time >= min_time:
					messages.append(i['text'])
	
	#format messages
	p_messages = [i for i in messages]
	pp = ""
	for p in reversed(p_messages):
		pp += " " + p 

	return pp.encode('utf-8').strip()

def getTentative(tone):
	for t in tone['document_tone']['tones']:
		if t['tone_name'] == "Tentative" and t['score'] >= 0.9:
			return True
	return False

user = sys.argv[1] 
rtime = sys.argv[2]
data = json.loads(open("events.json", "r").read())
messages = getMessages(data, float(rtime), user)

if messages == '':
	print("SORRY! No messages available from that time")

else:
	tone = getTone(messages)
	tone_str = str(tone['document_tone']['tones'])
	is_tentative = getTentative(tone)

	

	data = "MESSAGE ANALYZED: " + messages + ",," "TONES DETECTED: " + tone_str + ",," + str(is_tentative)
	print(data)
