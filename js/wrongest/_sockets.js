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
});

// The host has started the game!
socket.on("startTheGame", function(msg) {
  app.players = msg.players;
  app.gameDeck = msg.gameDeck;
  app.gameStarted = true;
  app.round.number = 1;
  app.round.dealerIndex = 0;
});