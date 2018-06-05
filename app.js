var watson  = require('./watson');
var express = require('express');
var app     = express();
var port    = process.env.PORT || 8080;

var server  = app.listen(port, function () {
  var host  = server.address().address;
  var port  = server.address().port;
  console.log("Application is running at http://%s:%s", host, port)
});

app.use('/', express.static('public'));
app.get('/synthesize', (req, res, next) => {
  const transcript = watson.synthesize(req.query.text);
  transcript.on('response', (response) => {
    if (req.query.download) {
      if (req.query.accept && req.query.accept === 'audio/wav') {
        response.headers['content-disposition'] = 'attachment; filename=transcript.wav';
      } else {
        response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
      }
    }
  });
  transcript.on('error', next);
  transcript.pipe(res);
});

var io = require('socket.io')(server);
var ss = require('socket.io-stream');
io.on('connection', function (socket) {
  console.log("Connected");

  var context = {};
  socket.on('sendmsg', function (data) {
    watson.message(data.message, context, function(err, res){
      if(!err){
        console.log(res);
        context = res.context;
        if (Array.isArray(res.output.text))
          conversation_response = res.output.text[0];//.join(' ').trim();
        else conversation_response = undefined;

        if(conversation_response){
          var payload = {
            user    : "System",
            message : conversation_response,
            ts      : (new Date()).getTime(),
            type    : data.type || 'text',
          };
          socket.emit('replymsg', payload);
        }
      }
    })
  });

  ss(socket).on('recognize', function(stream, data) {
    watson.recognize(stream, function(err){
      console.log('Error:', err);
    }, function(res){
      var transcript = res;
      socket.emit('transcript', {message: transcript, ts: data.ts});
      console.log(JSON.stringify(res, null, 2));
    })
  });

});
