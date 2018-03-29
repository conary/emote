import sys
import json

user = str(sys.argv[1])
num_posts = int(sys.argv[2])

data = json.loads(open("events.json", "r").read())

posts = []

for i in reversed(data): 
	if num_posts == 0:
		break
	if user == i['user']:
		num_posts -= 1
		posts.append(i["text"])

pretty_posts = [i for i in posts]
pp = ""
for p in reversed(pretty_posts):
	pp += " " + p 

print(pp.encode('utf-8').strip())
# sys.stdout.flush()
