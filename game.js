var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');


  socket.on('createRoom', (msg) => {
    io.emit('createRoom', msg);
    console.log('created room with code '+msg);
    socket.join(msg);
    console.log('told the player to join room '+msg);

    // TODO: I need to figure out how to get a list of all clients in a room.
  });

  socket.on('joinRoom', (msg) => {
    socket.join(msg);

    // Broadcast a join message gloablly.
    io.emit('joinRoom', msg);

    // Request players from the host.
    socket.to(msg).emit("requestPlayers");


    // TODO: I need to figure out how to get a list of all clients in a room.
  });

  socket.on('updatePlayers', msg => {
    console.log('players updated');
    console.log('ROOM CODE: '+msg.roomCode);
    console.table(msg.players);

    const d = {
      players: msg.players
    };
    io.in(msg.roomCode).emit('updatePlayers', d);
  });

  socket.on('startTheGame', msg => {

    console.log("The game in "+msg.roomCode+" has started.");

    const d = {
      players: msg.players,
      maxRounds: msg.maxRounds,
      sysAdminIndex: msg.sysAdminIndex
    };
    io.in(msg.roomCode).emit('startTheGame', d);
    console.table(msg.players);
  });


  socket.on("updatePasswordChallenge", msg => {

    console.log("The challenge has been updated in "+msg.roomCode);

    io.to(msg.roomCode).emit("updatePasswordChallenge", {
      challenge: msg.challenge
    });
  });












































  

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });



  
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});