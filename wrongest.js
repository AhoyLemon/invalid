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

  // Any Client -> The Entire Planet
  socket.on('createRoom', (msg) => {
    io.emit('createRoom', msg);
    console.log(msg+' - created room');
    socket.join(msg);
    console.log(msg+' - join by creator');

    // TODO: I need to figure out how to get a list of all clients in a room.
  });


  // Any Client -> The Rest of the Room
  socket.on('joinRoom', (msg) => {
    console.log(msg+' - guest joined');
    socket.join(msg);

    // Broadcast a join message gloablly.
    //-io.emit('joinRoom', msg);

    // Request players from the host.
    socket.to(msg).emit("requestPlayers");
  });

  socket.on('requestPlayers', (msg) => {
    io.in(msg).emit('requestPlayers');
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

  socket.on('startTheGame', msg => {

    console.log(msg.roomCode+' - game started');

    io.in(msg.roomCode).emit('startTheGame', {
      players: msg.players,
      gameDeck: msg.gameDeck
    });
    console.table(msg.players);
  });







  socket.on('disconnect', () => {
    console.log("The socket "+socketID+ " disconnected.");

    //io.emit('clientDisconnect', socketID);
  });
  
});








http.listen((process.env.PORT || 3000), () => {
  console.log('listening on *:'+ (process.env.PORT || 3000));
});