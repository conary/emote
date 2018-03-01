from paralleldots import similarity, ner, taxonomy, sentiment, keywords, intent, emotion, multilang, abuse, sentiment_social, custom_classifier, set_api_key, get_api_key
from config import *
set_api_key(API_KEY)
input_statements=[]
emotions=[]
text = ""

while (text != "e"):
    text = input("What's the message? (Type e for end) ")
    if (text == "e"):
        break
    input_statements.append(text)

    
#print(input_statements)
    
for statement in input_statements:
    #print(statement)
    emotion_dict = emotion(statement)
    dominant=(emotion_dict['emotion'])
    emotions.append(dominant)

print(emotions)

def most_common(emotions):
   return max(set(emotions), key=emotions.count)

print (most_common(emotions))