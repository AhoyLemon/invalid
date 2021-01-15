var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/html/wrongest.html');
});

io.on('connection', (socket) => {
  const socketID = socket.id;
  console.log('a user connected with the ID of'+socketID);
  io.to(socketID).emit("getSocketID", socketID);

  // Any Client -> The Rest of the Room
  socket.on('joinRoom', (msg) => {
    console.log("The socket "+socketID+" is joining "+msg+".");
    socket.join(msg);

    // Request players from the host.
    io.in(msg).emit("requestPlayers");
  });


  // Any Client -> The Rest of the Room
  socket.on('updatePlayers', msg => {
    console.log(msg.roomCode+' - players updated');
    console.table(msg.players);
    io.in(msg.roomCode).emit('updatePlayers', {
      players: msg.players,
      gameStarted: msg.gameStarted
    });
  });







  socket.on('disconnect', () => {
    console.log("The socket "+socketID+ " disconnected.");

    //io.emit('clientDisconnect', socketID);
  });
  
});








http.listen((process.env.PORT || 3000), () => {
  console.log('listening on *:'+ (process.env.PORT || 3000));
});