import json
import sys

text = sys.argv[1] 
user = sys.argv[2]
time = sys.argv[3]

data = json.loads(open("events.json", "r").read())
data.append({user: {"text":text, "time":time}})

with open('events.json', 'w') as f:
    json.dump(data, f)