// Inform the player of their own socketID
socket.on("getSocketID", function(msg) {
  console.info("Player socketID is "+msg);
  app.my.socketID = msg;
});

// Someone joined a room.
socket.on("joinRoom", function(msg) {
  // Don't do anything.
});

socket.on("requestPlayers", function(msg) {
  console.log("The client wants players from me!");
  if (app.isRoomHost) {
    socket.emit("updatePlayers", {
      roomCode: app.roomCode,
      players: app.players,
      gameStarted: app.gameStarted
    });
    console.log("I'm the host! I gave the room all the players I know about!");
  }
});

// Someone updated a player (this should have been the game host)
socket.on("updatePlayers", function(msg) {
  console.log("THE PLAYERS HAVE BEEN UPDATED!!!!!!!!");  
  app.players = msg.players;
  app.gameStarted = msg.gameStarted;
  app.round.number = msg.roundNumber;

});

// The host has started the game!
socket.on("startTheGame", function(msg) {
  app.players = msg.players;
  app.gameDeck = msg.gameDeck;
  app.chosenDeck.name = msg.chosenDeckName;
  app.maxRounds = msg.maxRounds;
  app.gameStarted = true;
  app.round.number = 1;
  app.round.dealerIndex = 0;
  app.round.phase = "presenting";

  // Assign my player index...
  app.players.forEach(function(player, index) {
    if (player.socketID == app.my.socketID) {
      app.my.playerIndex = index;
    }
  });

  //Grab my card.
  if (app.my.playerIndex > -1) {
    app.my.card = app.players[app.my.playerIndex].card;
  }

  changeFavicon("wrongest/favicons/favicon.ico");
});


// A player must present now!
socket.on("startPresenting", function(msg) {
  app.round.activePlayerIndex = msg.activePlayerIndex;
  app.round.playerPresenting = true;
  // UNUSED : activePlayerName
  app.startPresentationTimer();
});

// A player has finished presenting.
socket.on("donePresenting", function(msg) {
  app.round.cardsPresented.push({
    card: msg.activePlayerCard,
    playerIndex: msg.activePlayerIndex,
    playerName: msg.activePlayerName,
    score: 0
  });
  app.round.playerPresenting = false;
  app.resetPresentationTimer();
});

// Voting begins
socket.on("startVoting", function(msg) {
  app.round.cardsPresented = msg.cardsPresented;
  app.round.phase = "voting";
});


socket.on("submitVotes", function(msg) {
  const dI = 
  app.voteHistory.push({
    downVoteIndex: msg.downVoteIndex,
    voterName: msg.votingPlayerName,
    voted: 'down',
    presenter: app.round.cardsPresented[msg.downVoteIndex].playerName,
    card: app.round.cardsPresented[msg.downVoteIndex].card
  });
  
  app.voteHistory.push({
    upVoteIndex: msg.upVoteIndex,
    voterName: msg.votingPlayerName,
    voted: 'up',
    presenter: app.round.cardsPresented[msg.upVoteIndex].playerName,
    card: app.round.cardsPresented[msg.upVoteIndex].card
  });
  app.players[msg.downVoteIndex].score -= 1;
  app.round.cardsPresented[msg.downVoteIndex].score -= 1;

  app.players[msg.upVoteIndex].score += 1;
  app.round.cardsPresented[msg.upVoteIndex].score += 1;

  app.round.votesSubmitted += 1;

  if (app.round.votesSubmitted >= app.computedPlayerCount) {
    // This should be handled in the UI.
  } 
});


// The host has started the game!
socket.on("startNextRound", function(msg) {
  app.players = msg.players;
  app.gameDeck = msg.gameDeck;
  app.round.number = msg.roundNumber;
  app.statementHistory = msg.statementHistory;
  resetRoundVariables();
  resetUIVariables();

  // Assign my player index...
  app.players.forEach(function(player, index) {
    if (player.socketID == app.my.socketID) {
      app.my.playerIndex = index;
    }
  });

  //Grab my card.
  if (app.my.playerIndex > -1) {
    app.my.card = app.players[app.my.playerIndex].card;
  }

});

socket.on("gameOver", function(msg) {
  app.players = msg.players;
  app.statementHistory = msg.statementHistory;
  resetRoundVariables();
  resetUIVariables();
  app.round.phase = "GAME OVER";
  app.gameOver = true;

});
