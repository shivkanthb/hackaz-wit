import sys
from wit import Wit

if len(sys.argv) != 2:
    print('usage: python ' + sys.argv[0] + ' <wit-token>')
    exit(1)
access_token = sys.argv[1]

# Quickstart example
# See https://wit.ai/ar7hur/Quickstart

def first_entity_value(entities, entity):
    if entity not in entities:
        return None
    val = entities[entity][0]['value']
    if not val:
        return None
    return val['value'] if isinstance(val, dict) else val

def send(request, response):
    print(response['text'])

def get_forecast(request):
    context = request['context']
    entities = request['entities']

    loc = first_entity_value(entities, 'location')
    if loc:
        context['forecast'] = 'sunny'
        if context.get('missingLocation') is not None:
            del context['missingLocation']
    else:
        context['missingLocation'] = True
        if context.get('forecast') is not None:
            del context['forecast']

    return context

def greet(request):
    context = request['context']
    entities = request['entities']

    greet_val = first_entity_value(entities, 'greeting')
    if(greet_val=='hello'):
        context['greetingreply'] = 'Hello human'
    elif(greet_val=='bye'):
        context['greetingreply'] = 'Bye! Talk soon'
    elif(greet_val=='bye'):
        context['greetingreply'] = 'Bye! Talk soon'
    elif(greet_val=='thanks'):
        context['greetingreply'] = 'You are very welcome'

    return context

actions = {
    'send': send,
    'getForecast': get_forecast,
    'greet': greet
}

client = Wit(access_token=access_token, actions=actions)
client.interactive()
