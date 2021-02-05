var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('public'));


/////////////////////////////////////////////////////////////////////////////
// Database
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const generalAdapter = new FileSync('./data/general.json');
const generalDB = low(generalAdapter);

const invalidAdapter = new FileSync('./data/invalid.json');
const invalidDB = low(invalidAdapter);

const wrongestAdapter = new FileSync('./data/wrongest.json');
const wrongestDB = low(wrongestAdapter);

/////////////////////////////////////////////////////////////////////////////
// Routing

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/html/start.html');
});

app.get('/invalid', (req, res) => {
  res.sendFile(__dirname + '/html/invalid.html');
});

app.get('/wrongest', (req, res) => {
  res.sendFile(__dirname + '/html/wrongest.html');
});


app.get('/sitemap.xml', (req, res) => {
  res.contentType('application/xml');
  res.sendFile(__dirname + '/xml/sitemap.xml');
});

app.get('/stats', (req, res) => {
  res.sendFile(__dirname + '/html/stats.html');
});

app.get('/general/stats/json', (req, res) => {
  let dbPath = require('./data/general.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(dbPath));
});

app.get('/invalid/stats/json', (req, res) => {
  let dbPath = require('./data/invalid.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(dbPath));
});

app.get('/wrongest/stats/json', (req, res) => {
  let dbPath = require('./data/wrongest.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(dbPath));
});


io.on('connection', (socket) => {

  generalDB.update('ConnectedUsers', n => n + 1)
    .write();

  const socketID = socket.id;
  console.log('a user connected with the ID of'+socketID);
  io.to(socketID).emit("getSocketID", socketID);


  //////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  // GENERIC SIGNALS
  // Shared by different games.

  // Any Client -> The Entire Planet
  socket.on('createRoom', msg => {

    //io.emit('createRoom', msg);
    console.log(msg.roomCode+' - created a room for '+msg.gameName);
    socket.join(msg.roomCode);
    console.log(msg.roomCode+' - join by creator');

    // TODO: I need to figure out how to get a list of all clients in a room.

    if (msg.gameName == "invalid") {
      invalidDB.update('RoomsCreated', n => n + 1)
        .write();
    } else if (msg.gameName == "wrongest") {
      invalidDB.update('RoomsCreated', n => n + 1)
        .write();
    }
  });


  // Any Client -> The Entire Planet
  socket.on('joinRoom', msg => {
    console.log(msg.roomCode+' - guest joined');
    socket.join(msg.roomCode);

    // Broadcast a join message gloablly.
    io.emit('joinRoom', msg);

    // Request players from the host.
    socket.to(msg.roomCode).emit("requestPlayers");
  });

  // Any Client -> The Rest of the Room
  socket.on('updatePlayers', msg => {
    console.log(msg.roomCode+' - players updated');
    console.table(msg.players);

    // TODO: Probably change this to go from game host to anybody else in the room?
    io.in(msg.roomCode).emit('updatePlayers', {
      players: msg.players,
      gameStarted: msg.gameStarted
    });
  });

  socket.on('startTheGame', msg => {

    console.log(msg.roomCode+' - started game of '+msg.gameName);
    const playerCount = msg.players.length;
    const d = new Date();
    const fullStamp = d.getFullYear() + '-' + ((d.getMonth()+1)<10?'0':'') + (d.getMonth()+1) + '-' + (d.getDate()<10?'0':'') + d.getDate() + '@' + (d.getHours()<10?'0':'') + d.getHours() + ':' + (d.getMinutes()<10?'0':'') + d.getMinutes() + ':' + (d.getSeconds()<10?'0':'') + d.getSeconds();
    const dateStamp = d.getFullYear() + '-' + ((d.getMonth()+1)<10?'0':'') + (d.getMonth()+1) + '-' + (d.getDate()<10?'0':'') + d.getDate();
    const timeStamp = (d.getHours()<10?'0':'') + d.getHours() + ':' + (d.getMinutes()<10?'0':'') + d.getMinutes() + ':' + (d.getSeconds()<10?'0':'') + d.getSeconds();

    if (msg.gameName == "invalid") {
      io.in(msg.roomCode).emit('startTheGame', {
        gameName: msg.gameName,
        players: msg.players,
        maxRounds: msg.maxRounds,
        sysAdminIndex: msg.sysAdminIndex,
        allowNaughty: msg.allowNaughty
      });


      // Save to Invalid Database...
      if (invalidDB.get("Games.PlayerCounts").find({ players: playerCount }).value()) {
        invalidDB.get("Games.PlayerCounts").find({ players: playerCount }).update('count', n => n + 1).write();
      } else {
        invalidDB.get("Games.PlayerCounts").push({ players: playerCount, count: 1} ).write();
      }
      if (msg.allowNaughty) {
        invalidDB.get("Games.NaughtyMode").update('on', n => n + 1).write();
      } else {
        invalidDB.get("Games.NaughtyMode").update('off', n => n + 1).write();
      }
      invalidDB.get("Games").update('Started', n => n + 1).write();
      invalidDB.get("Games.MostRecent").update('dateAndTime', n => fullStamp).update('date', n => dateStamp).update('time', n => timeStamp).write();
      generalDB.get("Games.Invalid.MostRecent").update('dateAndTime', n => fullStamp).update('date', n => dateStamp).update('time', n => timeStamp).write();

    } else if (msg.gameName == "wrongest") {
      io.in(msg.roomCode).emit('startTheGame', {
        gameName: msg.gameName,
        players: msg.players,
        gameDeck: msg.gameDeck,
        chosenDeckName: msg.chosenDeckName,
        maxRounds: msg.maxRounds
      });


      // Save to Wrongest Database...
      if (wrongestDB.get("Games.PlayerCounts").find({ players: playerCount }).value()) {
        wrongestDB.get("Games.PlayerCounts").find({ players: playerCount }).update('count', n => n + 1).write();
      } else {
        wrongestDB.get("Games.PlayerCounts").push({ players: playerCount, count: 1} ).write();
      }
      if (wrongestDB.get("Decks").find({ name: msg.chosenDeckName }).value()) {
        wrongestDB.get("Decks").find({ name: msg.chosenDeckName }).update('count', n => n + 1).write();
      } else {
        wrongestDB.get("Decks").push({ name: msg.chosenDeckName, count: 1} ).write();
      }
      wrongestDB.get("Games").update('Started', n => n + 1).write();
      wrongestDB.get("Games.MostRecent").update('dateAndTime', n => fullStamp).update('date', n => dateStamp).update('time', n => timeStamp).write();
      generalDB.get("Games.TheWrongestWords.MostRecent").update('dateAndTime', n => fullStamp).update('date', n => dateStamp).update('time', n => timeStamp).write();
    }
    
    console.table(msg.players);
    msg.players.forEach((player) => {
      if (generalDB.get("PlayerNames").find({ name: player.name }).value()) {
        generalDB.get("PlayerNames").find({ name: player.name }).update('count', n => n + 1).write();
      } else {
        generalDB.get("PlayerNames").push({ name: player.name, count: 1} ).write();
      }
    });

  });

  socket.on("gameOver", msg => {
    console.log(msg.roomCode+' - GAME OVER ⚰️ '+msg.gameName);
    if (msg.gameName == "invalid") {
      io.in(msg.roomCode).emit("gameOver", {
        playerIndex: msg.playerIndex,
        passwordAttempts: msg.passwordAttempts
      });
    } else if (msg.gameName == "wrongest") {
      io.in(msg.roomCode).emit("gameOver", {
        players: msg.players,
        gameDeck: msg.gameDeck,
        statementHistory: msg.statementHistory,
        roundNumber: msg.roundNumber
      });
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  // INVALID sockets

  // SysAdmin -> Employees
  socket.on("updatePasswordChallenge", msg => {
    console.log(msg.roomCode+' - challenge is '+msg.challenge.name);
    io.to(msg.roomCode).emit("updatePasswordChallenge", {
      challenge: msg.challenge
    });


    if (invalidDB.get("Challenges").find({ name: msg.challenge.name }).value()) {
      invalidDB.get("Challenges").find({ name: msg.challenge.name }).update('count', n => n + 1).write();
    } else {
      invalidDB.get("Challenges").push({ name: msg.challenge.name, count: 1} ).write();
    }

  });

  // SysAdmin -> Employees
  socket.on("updatePasswordRules", msg => {
    console.log(msg.roomCode+' - new rule');
    console.table(msg.rules);
    io.to(msg.roomCode).emit("updatePasswordRules", {
      rules: msg.rules,
      shibboleth: msg.shibboleth
    });

    if (msg.newRule && msg.newRule.type) {
      if (invalidDB.get("Rules").find({ name: msg.newRule.type }).value()) {
        invalidDB.get("Rules").find({ name: msg.newRule.type }).update('count', n => n + 1).write();
      } else {
        invalidDB.get("Rules").push({ name: msg.newRule.type, count: 1} ).write();
      }

      if (msg.newRule.type == "Demand A Letter" || msg.newRule.type == "Ban A Letter") {
        if (invalidDB.get("Rules").find({ name: msg.newRule.type }).get("letters").find({letter: msg.newRule.inputValue}).value()) {
          invalidDB.get("Rules").find({ name: msg.newRule.type }).get("letters").find({letter: msg.newRule.inputValue}).update('count', n => n + 1).write();
        } else {
          invalidDB.get("Rules").find({ name: msg.newRule.type }).get('letters').push({ letter: msg.newRule.inputValue, count: 1} ).write(); 
        }
      } else if (msg.newRule.type == "Shibboleth") {
        if (invalidDB.get("Rules").find({ name: msg.newRule.type }).get("phrases").find({letter: msg.newRule.inputValue}).value()) {
          invalidDB.get("Rules").find({ name: msg.newRule.type }).get("phrases").find({letter: msg.newRule.inputValue}).update('count', n => n + 1).write();
        } else {
          invalidDB.get("Rules").find({ name: msg.newRule.type }).get('phrases').push({ letter: msg.newRule.inputValue, count: 1} ).write(); 
        }
      }
    }
    

  });

  // SysAdmin -> Employees
  socket.on("summonThePig", msg => {
    console.log(msg.roomCode+' - The Flying Pig has been summoned!');
    io.to(msg.roomCode).emit("summonThePig");
  });

  // SysAdmin -> Employees
  socket.on("updateBugs", msg => {
    console.log(msg.roomCode+' - new bug');
    console.table(msg.bugs);
    io.to(msg.roomCode).emit("updateBugs", {
      bugs: msg.bugs
    });

    if (msg.newBug) {
      if (invalidDB.get("Bugs").find({ pw: msg.newBug }).value()) {
        invalidDB.get("Bugs").find({ pw: msg.newBug }).update('count', n => n + 1).write();
      } else {
        invalidDB.get("Bugs").push({ pw: msg.newBug, count: 1 } ).write(); 
      }
    }

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

    if (msg.pwAttempt) {
      if (invalidDB.get("Crashes").find({ pw: msg.pwAttempt }).value()) {
        invalidDB.get("Crashes").find({ pw: msg.pwAttempt }).update('count', n => n + 1).write();
      } else {
        invalidDB.get("Crashes").push({ pw: msg.pwAttempt, count: 1 } ).write(); 
      }
    }

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



    if (msg.pwAttempt) {
      if (invalidDB.get("SuccessfulPasswords").find({ pw: msg.pwAttempt }).value()) {
        invalidDB.get("SuccessfulPasswords").find({ pw: msg.pwAttempt }).update('count', n => n + 1).write();
      } else {
        invalidDB.get("SuccessfulPasswords").push({ pw: msg.pwAttempt, count: 1 } ).write(); 
      }
    }
    
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
      players: msg.players,
      summary: msg.summary
    });
  });

  // Any Player -> Rest of Game
  socket.on("passwordCracked", msg => {
    console.log(msg.roomCode+' - password cracked');
    io.to(msg.roomCode).emit("passwordCracked", {
      players: msg.players,
      allEmployeePasswords: msg.allEmployeePasswords,
      crackSummary: msg.crackSummary
    });



    if (msg.crackSummary && msg.crackSummary.pw) {
      if (invalidDB.get("Cracks").find({ pw: msg.crackSummary.pw }).value()) {
        invalidDB.get("Cracks").find({ pw: msg.crackSummary.pw }).update('count', n => n + 1).write();
      } else {
        invalidDB.get("Cracks").push({ pw: msg.crackSummary.pw, count: 1 } ).write(); 
      }
    }

    if (invalidDB.has("Cracks."+msg.crackSummary.pw).value()) {
      invalidDB.update("Cracks."+msg.crackSummary.pw, n => n + 1).write();
    } else {
      invalidDB.set("Cracks."+msg.crackSummary.pw, 1).write();
    }

  });

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  // THE WRONGEST WORDS sockets

  socket.on('startPresenting', msg => {

    console.log(msg.roomCode+" - "+msg.activePlayerName+"'s turn begins");

    io.in(msg.roomCode).emit('startPresenting', {
      activePlayerIndex: msg.activePlayerIndex,
      activePlayerName: msg.activePlayerName
    });
  });

  socket.on('donePresenting', msg => {

    console.log(msg.roomCode+ " - "+msg.activePlayerName+" is done presenting");

    io.in(msg.roomCode).emit('donePresenting', {
      activePlayerIndex: msg.activePlayerIndex,
      activePlayerName: msg.activePlayerName,
      activePlayerCard: msg.activePlayerCard
    });
  });

  socket.on('startVoting', msg => {

    console.log(msg.roomCode+" - voting started");
    console.table(msg.cardsPresented);

    io.in(msg.roomCode).emit('startVoting', {
      cardsPresented: msg.cardsPresented
    });
  });

  socket.on('submitVotes', msg => {

    console.log(msg.roomCode+" - votes sent by "+msg.votingPlayerName);

    io.in(msg.roomCode).emit('submitVotes', {
      votingPlayerIndex: msg.votingPlayerIndex,
      votingPlayerName: msg.votingPlayerName,
      downVoteIndex: msg.downVoteIndex,
      upVoteIndex: msg.upVoteIndex,
    });

    if (wrongestDB.get("Statements").find({ words: msg.downVoteCard }).value()) {
      wrongestDB.get("Statements").find({ words: msg.downVoteCard }).update('votes', n => n + 1).update('score', n => n - 1).write();
    } else {
      wrongestDB.get("Statements").push({ words: msg.downVoteCard, score: -1, votes: 1 } ).write();
    }
    if (wrongestDB.get("Statements").find({ words: msg.upVoteCard }).value()) {
      wrongestDB.get("Statements").find({ words: msg.upVoteCard }).update('votes', n => n + 1).update('score', n => n + 1).write();
    } else {
      wrongestDB.get("Statements").push({ words: msg.upVoteCard, score: 1, votes: 1 } ).write();
    }

  });


  socket.on('startNextRound', msg => {
    console.log(msg.roomCode+' - round '+msg.roundNumber+" started.");

    io.in(msg.roomCode).emit('startNextRound', {
      players: msg.players,
      gameDeck: msg.gameDeck,
      statementHistory: msg.statementHistory,
      roundNumber: msg.roundNumber
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