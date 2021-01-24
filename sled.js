var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

/////////////////////////////////////////////////////////////////////////////
// Routing


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/html/sled.html');
});

io.on('connection', (socket) => {
  const socketID = socket.id;
  console.log('a user connected with the ID of'+socketID);
  io.to(socketID).emit("getSocketID", socketID);

  socket.on('disconnect', () => {
    console.log("The socket "+socketID+ " disconnected.");

    //io.emit('clientDisconnect', socketID);
  });
  
});








http.listen((process.env.PORT || 3000), () => {
  console.log('listening on *:'+ (process.env.PORT || 3000));
});