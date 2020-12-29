
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

  const d = {
    roomCode: app.roomCode,
    players: app.players
  };

  socket.emit("updatePlayers", d);
  console.log("I gave the room all the players I kow about!");

});


// Someone updated a player (this should )
socket.on("updatePlayers", function(msg) {

  console.log("THE PLAYERS HAVE BEEN UPDATED!!!!!!!!");  
  app.players = msg.players;

});

// The host has started the game!
socket.on("startTheGame", function(msg) {

  app.players = msg.players;
  app.my.role = msg.players[app.my.playerIndex].role;
  app.round.phase = "choose rules";
  app.round.number = 1;
  app.maxRounds = msg.maxRounds;
  app.round.sysAdminIndex = msg.sysAdminIndex;
  if (app.my.role == "SysAdmin") {
    app.definePossibleChallenges();
  }

});

// The SysAdmin has picked a password challenge.
socket.on("updatePasswordChallenge", function(msg) {
  console.log("I (an employee) have been informed of the password challenge.");  
  app.round.challenge = msg.challenge;
  soundNewRule.play();
});