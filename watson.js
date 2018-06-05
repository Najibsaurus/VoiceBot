var config      = require('./config');
var fs          = require('fs');
var watson      = require('watson-developer-cloud');
var blobStream  = require('blob-stream');
var AssistantV1 = require('watson-developer-cloud/assistant/v1');


var assistant = new watson.AssistantV1({
  username: config.conversation_username,
  password: config.conversation_password,
  url: 'https://gateway.watsonplatform.net/assistant/api/',
  version: '2018-02-16',
  use_unauthenticated: true
});


var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var speech_to_text = new SpeechToTextV1 ({
  username: config.STT_username,
  password: config.STT_password
});

var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
var text_to_speech = new TextToSpeechV1 ({
  username: config.TTS_username,
  password: config.TTS_password
});

var watson = {
  message: function(text, context, callback){
    assistant.message({
      workspace_id: config.workspace_id,
      input: {'text': text},
      context: context
    }, callback);
  },

  recognize: function(stream, err, data) {
    var params = {
      content_type: 'audio/l16; rate=44100; channels=2',
      model: 'en-US_BroadbandModel'  // Specify your language model here
    };
    var textStream = stream.pipe(
        speech_to_text.createRecognizeStream(params)
    );
    textStream.setEncoding('utf8');
    textStream.on('error', err);
    textStream.on('data', data);
  },

  synthesize: function(message){
    var params = {
      text: message,
      voice: 'en-US_AllisonVoice'
    };
    return text_to_speech.synthesize(params);
  }

}

module.exports = watson;
