from paralleldots import similarity, ner, taxonomy, sentiment, keywords, intent, emotion, multilang, abuse, sentiment_social, custom_classifier, set_api_key, get_api_key
from config import *
import sys 

set_api_key('zxpZ3716iIEIkIH1vf1InkSVAiFwI2GGnSiTwjUeMe4')

statement = sys.argv[1]
emotion_dict = emotion(statement)
dominant=(emotion_dict['emotion'])


print(dominant)
sys.stdout.flush()
