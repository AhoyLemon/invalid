var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var secrets = require('./secrets');

app.use(express.static('public'));


//////////////////////////////////////////////
// SQL DATABASE

const jawsDBurl = (process.env.JAWSDB_CRIMSON_URL || secrets.devSQLurl);
console.log('SERVER: '+jawsDBurl);
var mysql = require('mysql');
var connection = mysql.createConnection(jawsDBurl);

function addOneInDatabase(table,value) {
  const sql = 'UPDATE '+table+' SET icount = icount + 1 WHERE iname = ' + connection.escape(value) + ';';
  connection.query(sql, function(err, rows, fields) {
    if (err) throw err;
  });
}

function incrementDatabase(table,value) {
  const sql = 'INSERT INTO '+table+' (iname) VALUES ('+connection.escape(value)+') ON DUPLICATE KEY UPDATE icount = icount+1;';
  connection.query(sql, function(err, rows, fields) {
    if (err) throw err;
  });
}

function decrementDatabase(table,value) {
  const sql = 'INSERT INTO '+table+' (iname) VALUES ('+connection.escape(value)+') ON DUPLICATE KEY UPDATE icount = icount-1;';
  connection.query(sql, function(err, rows, fields) {
    if (err) throw err;
  });
}

function incrementDatabaseWithChallenge(table,challenge,value) {
  const sql = 'INSERT INTO '+table+' (iname, challenge) VALUES ('+connection.escape(value)+', '+connection.escape(challenge)+') ON DUPLICATE KEY UPDATE icount = icount+1;';
  connection.query(sql, function(err, rows, fields) {
    if (err) throw err;
  });
}

function addPlayerName(table,gameName,playerName) {
  const sql = 'INSERT INTO '+table+' (iname, lastPlayed) VALUES ('+connection.escape(playerName)+', '+connection.escape(gameName)+') ON DUPLICATE KEY UPDATE icount = icount+1;';
  connection.query(sql, function(err, rows, fields) {
    if (err) throw err;
  });
}

function DateStampInDatabase(table,gameName) {
  const sql = 'UPDATE '+table+' SET lastGameTime = NOW() WHERE gameName = '+connection.escape(gameName)+';';
  connection.query(sql, function(err, rows, fields) {
    if (err) throw err;
  });
}

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

app.get('/cameo', (req, res) => {
  res.sendFile(__dirname + '/html/cameo.html');
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

  const socketID = socket.id;
  console.log('a user connected with the ID of'+socketID);
  io.to(socketID).emit("getSocketID", socketID);
  addOneInDatabase("allGames","ConnectedUsers");

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
      addOneInDatabase("invalidGames","RoomsCreated");
    } else if (msg.gameName == "wrongest") {
      addOneInDatabase("wrongestGames","RoomsCreated");
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
    const fullTimeStamp = new Date();

    if (msg.gameName == "invalid") {
      io.in(msg.roomCode).emit('startTheGame', {
        gameName: msg.gameName,
        players: msg.players,
        maxRounds: msg.maxRounds,
        sysAdminIndex: msg.sysAdminIndex,
        allowNaughty: msg.allowNaughty
      });


      // Save to Invalid Database...
      
      incrementDatabase("invalidPlayerCounts",playerCount+ " Players");

      if (msg.allowNaughty) {
        addOneInDatabase("invalidGames","NaughtyModeOn");
      } else {
        addOneInDatabase("invalidGames","NaughtyModeOff");
      }
    
      addOneInDatabase("invalidGames","GamesStarted");

    } else if (msg.gameName == "wrongest") {
      io.in(msg.roomCode).emit('startTheGame', {
        gameName: msg.gameName,
        players: msg.players,
        gameDeck: msg.gameDeck,
        chosenDeckName: msg.chosenDeckName,
        maxRounds: msg.maxRounds
      });


      // Save to Wrongest Database...
      addOneInDatabase("invalidGames","GamesStarted");
      incrementDatabase("wrongestPlayerCounts", playerCount+ " Players");
      if (msg.chosenDeckName) {
        incrementDatabase("wrongestDecks", msg.chosenDeckName);
      }
    }
    
    DateStampInDatabase("allGamesLastPlayed",msg.gameName);
    console.table(msg.players);
    
    msg.players.forEach((player) => {
      addPlayerName("allPlayerNames",msg.gameName,player.name);
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

    incrementDatabase('invalidChallenges', msg.challenge.name);

  });

  // SysAdmin -> Employees
  socket.on("updatePasswordRules", msg => {
    console.log(msg.roomCode+' - new rule');
    console.table(msg.rules);
    io.to(msg.roomCode).emit("updatePasswordRules", {
      rules: msg.rules,
      shibboleth: msg.shibboleth
    });

    if (msg.newRule.type) {
      incrementDatabase('invalidRules', msg.newRule.type);

      if (msg.newRule.type == "Ban A Letter" && msg.newRule.inputValue) {
        incrementDatabase('invalidBannedLetters', msg.newRule.inputValue);
      } else if (msg.newRule.type == "Demand A Letter" && msg.newRule.inputValue) {
        incrementDatabase('invalidDemandedLetters', msg.newRule.inputValue);
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
      incrementDatabaseWithChallenge("invalidBugs", msg.challengeName, msg.newBug);
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
      incrementDatabaseWithChallenge("invalidCrashes", msg.challengeName, msg.pwAttempt);
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
      incrementDatabaseWithChallenge("invalidSuccessfulPasswords",msg.challengeName,msg.pwAttempt);
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
      incrementDatabase('invalidCracks', msg.crackSummary.pw);
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

    incrementDatabase('wrongestStatements', msg.upVoteCard);
    decrementDatabase('wrongestStatements', msg.downVoteCard);
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