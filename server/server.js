var express = require('express');
var http = require('http');
// MongoDB connection
var http = require('http');
var db = require('./db/db');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(8000);

var morgan = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');


// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/../client'));
app.use(session({
  secret: 'good eats is a secret',
  resave: false,
  saveUninitialized: true
}));

// Routing
require('./config/routes')(app, express);

var clients = {};

//Socket listeners
io.on('connection', function (socket) {
  clients[socket.id] = socket;

  console.log(socket.id + ' connected!')

  socket.on('songClicked', function (data) {
    console.log('socket connected!')
    io.emit('songClick', data);
  });

  socket.on('paused', function () {
    console.log('Song Paused!');
    io.emit('paused');
  })

  // socket.on('data', function(data) {
  //   socket.broadcast.emit('update', data);
  // });

  socket.on('onPlay', function(event){
    socket.broadcast.emit('onPlay', event);
  });

  socket.on('stopped', function (event) {
    console.log('server song stopped!')
    socket.broadcast.emit('stopped', event);
  })

  socket.on('data', function(data) {
    socket.broadcast.emit('update', data);
  });

  socket.on('playerData', function (data) {
    io.emit('playerNote', data);
  });
  socket.on('disconnect', function () {
    io.emit('user disconnected');
    delete clients[socket.id];
  });
});
// app.listen(app.get('port'), function() {
//   console.log('Server listening on port ', app.get('port'));
// });
