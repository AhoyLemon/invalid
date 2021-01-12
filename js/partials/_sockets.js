
// Inform the player of their own socketID
socket.on("getSocketID", function(msg) {
  console.info("Player socketID is "+msg);
  app.my.socketID = msg;
});


// A client disconnected!
// Let's try to deal with it.
socket.on("clientDisconnect", function(msg) {
  console.warn("The socket "+msg+" disconnected.");


  // TODO: See if that socketID is in your game. Remove them if so.
  app.players.forEach(function(p,index) {
    if (p.socketID == msg) {
      app.players.splice(index, 1);
    }
  });

});

// Someone created a room.
socket.on("createRoom", function(msg) {
  // Don't do anything.
});

// Someone joined a room.
socket.on("joinRoom", function(msg) {
  // Don't do anything.
});


////////////////////////////////////////////////////////////////
// Everything below this line should ONLY be messages to the room.

socket.on("requestPlayers", function(msg) {
  console.log("The client wants players from me!");
  socket.emit("updatePlayers", {
    roomCode: app.roomCode,
    players: app.players
  });
  console.log("I gave the room all the players I know about!");
});


// Someone updated a player (this should )
socket.on("updatePlayers", function(msg) {
  console.log("THE PLAYERS HAVE BEEN UPDATED!!!!!!!!");  
  app.players = msg.players;

  // NOTE: This bit may be unnecessary, but confirms & updates your own playerIndex every time the players get updated.
  app.players.forEach(function(p, index) {
    if (p.employeeNumber == app.my.employeeNumber) {
      app.my.playerIndex = index;
    }
  });
});

// The host has started the game!
socket.on("startTheGame", function(msg) {
  app.players = msg.players;
  app.my.role = msg.players[app.my.playerIndex].role;
  app.round.phase = "choose rules";
  app.round.number = 1;
  app.maxRounds = msg.maxRounds;
  app.round.sysAdminIndex = msg.sysAdminIndex;
  app.allowNaughty = msg.allowNaughty;
  if (app.my.role == "SysAdmin") {
    app.definePossibleChallenges();
    document.title = app.my.role + " | " + gameTitle;
  } else {
    document.title = app.my.name + " | " + gameTitle;
  }
});

// The SysAdmin has picked a password challenge.
socket.on("updatePasswordChallenge", function(msg) {
  console.log("I (an employee) have been informed of the password challenge.");  
  app.round.challenge = msg.challenge;
  soundNewRule.play();
});

// The SysAdmin has set a new rule.
socket.on("updatePasswordRules", function(msg) {
  console.log("I (an employee) am being updated on the password rules.");  
  app.round.rules = msg.rules;
  app.round.shibboleth = msg.shibboleth;
  soundNewRule.play();
});

// The SysAdmin has a new bug!
socket.on("updateBugs", function(msg) {
  console.log("I (an employee) am being updated on the round bugs.");  
  app.round.bugs = msg.bugs;
  soundNewRule.play();
});

// The guessing has begun!
socket.on("startGuessing", function(msg) {
  console.log("The guessing has begun!");  
  app.round.phase = "create password";
  app.round.sysAdminIndex = msg.sysAdminIndex;
  app.roundStartTimer();
  soundStartGuessing.play();
});

// Some player (other than me) tried a password (and failed)
socket.on("triedPassword", function(msg) {
  console.log("Someone else had a bad password.");  
  app.round.attempts.push(msg);
  app.players[app.round.sysAdminIndex].score += settings.points.forFailedPassword;
  if (app.my.role == "SysAdmin") {
    app.my.score += settings.points.forFailedPassword;
  }
});

// Some player (possibly me, but maybe not) caused a server crash!
socket.on("crashedServer", function(msg) {
  console.log("The server crashed! It may or may not be because of me!");  
  
  let i = msg.playerIndex;
  app.round.phase = "crashed";
  app.round.crash.active = true;
  app.round.crash.player = app.players[i];
  app.round.crash.word = msg.pwAttempt;
  app.round.attempts.push(msg);
  soundSystemCrash.play();
  app.players[app.round.sysAdminIndex].score += settings.points.forServerCrash;
  if (app.my.role == "SysAdmin") {
    app.my.score += settings.points.forServerCrash;
  }
  app.endTheGuessingRound();
});

// Some player (other than me) successfully guessed a password.
socket.on("passwordSuccess", function(msg) {
  console.log("Someone else had a successful password.");  
  
  // Award points and mark pw as claimed.
  let i = msg.playerIndex;
  app.players[i].score = msg.playerScore;
  app.round.claimedPasswords.push(msg.pwAttempt);
  app.allEmployeePasswords.push({
    pw: msg.pwAttempt,
    name: app.players[i].name,
    playerIndex: i,
    claimed: false
  });
  app.round.attempts.push(msg);

  // If the Hurry Up timer hasn't already started, start it now.
  if (app.round.hurryTimer == undefined) {
    app.startHurryTimer();
  }

  // Let's check to see if all employees have succeeded.
  if (app.round.claimedPasswords.length >= (app.players.length - 1) ) {
    // Yup! Let's end the round.
    app.endTheGuessingRound();
  }
});

// Some player (could be anyone) announced the round was over.
socket.on("roundOver", function() {
  console.log("The round is over.");
  app.ui.roundOver = true;
  app.ui.passwordSucceeded = false;
  app.ui.passwordAttemptErrors = [];
  app.resetHurryTimer();
  app.resetRoundTimer();
});


// The SysAdmin (which might be me) started a new round.
socket.on("startNewRound", function(msg) {
  console.log("new round started.");

  msg.players.forEach(function(p, index) {
    if (p.employeeNumber == app.players[index].employeeNumber) {
      app.players[index].score = p.score;
    }
  });

  app.players = msg.players;
  app.roundSummary.push(msg.summary);
  
  // Hey, what round is it? Is it time for the final round?
  if (app.round.number >= app.maxRounds) {
    // Yep, Time for the final round.

    // First, reset the UI and the round variables.
    resetUI();
    resetRoundVariables();

    // Then do FINAL ROUND stuff.
    app.round.phase = "FINAL ROUND";
    app.startCountdownToFinalRound();
    document.title = "FINAL ROUND | " +gameTitle;
    
  } else {

    // Nope, let's do another round.
    app.round.phase = "choose rules";
    app.round.number += 1;

    // Who's the SysAdmin?
    // Let's make the next player the SysAdmin.
    // Unless there is no next player, in which case let's start over at 0.
    let i = app.round.sysAdminIndex + 1;
    if (i >= app.players.length) {
      app.round.sysAdminIndex = 0;
    } else {
      app.round.sysAdminIndex = i;
    }

    // Okay, now define roles for everyone.
    app.players.forEach(function(p,index) {
      p.role = "employee";
    });
    app.players[app.round.sysAdminIndex].role = "SysAdmin";
    app.my.role = app.players[app.my.playerIndex].role;

    // Reset the UI and the round variables.
    resetUI();
    resetRoundVariables();

    // If you're the SysAdmin, set up some challenges for you to choose from.
    if (app.my.role == "SysAdmin") {
      app.my.rulebux = settings.default.rulebux;
      app.definePossibleChallenges();
      document.title = app.my.role + " | " + gameTitle;
    } else {
      document.title = app.my.name + " | " + gameTitle;
    }

  }

});

// A player (other than me) cracked a password (in the final round.)
socket.on("passwordCracked", function(msg) {
  app.players = msg.players;
  app.allEmployeePasswords = msg.allEmployeePasswords;
  app.crackSummary.push(msg.crackSummary);
});

// Some player (could be anyone) said the game is over.
socket.on("gameOver", function(msg) {

  // TODO: Try to get this to only fire once per game. Similar to the nextRound bug.
  console.log("GAME OVER ⚰️");
  //app.setGameOver();
  app.players[msg.playerIndex].passwordAttempts = msg.passwordAttempts;

});