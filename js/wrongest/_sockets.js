// Inform the player of their own socketID
socket.on("getSocketID", function(msg) {
  console.info("Player socketID is "+msg);
  app.my.socketID = msg;
});

socket.on("requestPlayers", function(msg) {
  alert("The client wants players from me!");
  if (app.isRoomHost) {
    app.sendPlayerUpdate();
    console.log("I'm the host! I gave the room all the players I know about!");
  }
});

// Someone updated a player (this should have been the game host)
socket.on("updatePlayers", function(msg) {
  console.log("THE PLAYERS HAVE BEEN UPDATED!!!!!!!!");  
  app.players = msg.players;
  app.gameStarted = msg.gameStarted;
});