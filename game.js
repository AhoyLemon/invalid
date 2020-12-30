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
    io.emit('joinRoom', msg);

    // Request players from the host.
    socket.to(msg).emit("requestPlayers");

    // TODO: I need to figure out how to get a list of all clients in a room.
  });

  // Game Host -> ALL
  socket.on('updatePlayers', msg => {
    console.log(msg.roomCode+' - players updated');
    console.table(msg.players);

    const d = {
      players: msg.players
    };
    // TODO: Probably change this to go from game host to anybody else in the room?
    io.in(msg.roomCode).emit('updatePlayers', d);
  });

  // SysAdmin -> ALL
  socket.on('startTheGame', msg => {

    console.log(msg.roomCode+' - game started');

    io.in(msg.roomCode).emit('startTheGame', {
      players: msg.players,
      maxRounds: msg.maxRounds,
      sysAdminIndex: msg.sysAdminIndex
    });
    console.table(msg.players);
  });

  // SysAdmin -> Employees
  socket.on("updatePasswordChallenge", msg => {
    console.log(msg.roomCode+' - challenge is '+msg.challenge.name);
    io.to(msg.roomCode).emit("updatePasswordChallenge", {
      challenge: msg.challenge
    });
  });

  // SysAdmin -> Employees
  socket.on("updatePasswordRules", msg => {
    console.log(msg.roomCode+' - new rule');
    console.table(msg.rules);
    io.to(msg.roomCode).emit("updatePasswordRules", {
      rules: msg.rules,
      shibboleth: msg.shibboleth
    });
  });

  // SysAdmin -> Employees
  socket.on("updateBugs", msg => {
    console.log(msg.roomCode+' - new bug');
    console.table(msg.bugs);
    io.to(msg.roomCode).emit("updateBugs", {
      bugs: msg.bugs
    });
  });

  // SysAdmin -> ALL
  socket.on("startGuessing", msg => {
    console.log(msg.roomCode+' - start guessing');
    io.in(msg.roomCode).emit("startGuessing", {
      sysAdminIndex: msg.sysAdminIndex
    });
  });

  // An Employee -> Rest of Game
  socket.on("triedPassword", msg => {
    console.log(msg.roomCode+' - bad guess');
    io.to(msg.roomCode).emit("triedPassword", {
      playerIndex: msg.playerIndex,
      pwAttempt: msg.pwAttempt,
      attemptCount: msg.attemptCount,
      result: msg.result
    });
  });

  // An Employee -> ALL
  socket.on("crashedServer", msg => {
    console.log(msg.roomCode+' - server crash!');
    io.in(msg.roomCode).emit("crashedServer", {
      playerIndex: msg.playerIndex,
      pwAttempt: msg.pwAttempt,
      attemptCount: msg.attemptCount,
      result: msg.result
    });
  });

  // An Employee -> ALL
  socket.on("passwordSuccess", msg => {
    console.log(msg.roomCode+' - password success');
    io.in(msg.roomCode).emit("passwordSuccess", {
      playerIndex: msg.playerIndex,
      pwAttempt: msg.pwAttempt,
      attemptCount: msg.attemptCount,
      playerScore: msg.playerScore,
      result: msg.result
    });
  });

  // Any Player -> ALL
  socket.on("roundOver", msg => {
    console.log(msg.roomCode+' - round over');
    io.in(msg.roomCode).emit("roundOver");
  });

  // SysAdmin -> ALL
  socket.on("startNewRound", msg => {
    console.log(msg.roomCode+' - new round started');
    io.in(msg.roomCode).emit("startNewRound", {
      playerIndex: msg.playerIndex,
      players: msg.players
    });
  });

  // Any Player -> Rest of Game
  socket.on("passwordCracked", msg => {
    console.log(msg.roomCode+' - password cracked');
    io.to(msg.roomCode).emit("passwordCracked", {
      players: msg.players,
      allEmployeePasswords: msg.allEmployeePasswords
    });
  });

  // Any Player -> ALL
  socket.on("gameOver", msg => {
    console.log(msg.roomCode+' - GAME OVER ⚰️');
    io.in(msg.roomCode).emit("gameOver");
  });













































  

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });



  
});

http.listen((process.env.PORT || 3000), () => {
  console.log('listening on *:'+ (process.env.PORT || 3000));
});