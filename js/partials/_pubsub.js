const theChannel = 'the_guide';

const pubnub = new PubNub({
  // replace the key placeholders with your own PubNub publish and subscribe keys
  publishKey: 'pub-c-c25666ba-28d6-41ef-8c12-670fc0f40021',
  subscribeKey: 'sub-c-ba437e90-31bb-11eb-9713-12bae088af96',
  uuid: playerID
});

pubnub.addListener({

  // Any message is received.
  message: function(event) {
    displayMessage(
      '[MESSAGE: received]',
      event.message,
      event.timetoken,
      event
    );

    if (event.message.type == "updatePlayers") {
      app.players = event.message.data.players;
      if (app.my && app.my.playerIndex && app.my.playerIndex > 0) {
        app.my.role = event.message.data.players[app.my.playerIndex].role;
      }
    }

    if (event.message.type == "startTheGame") {
      app.players = event.message.data.players;
      app.my.role = event.message.data.players[app.my.playerIndex].role;
      app.round.phase = "choose rules";
      app.round.number = 1;

      if (app.my.role == "SysAdmin") {
        app.definePossibleChallenges();
      }
    }

    if (event.message.type == "updatePasswordChallenge") {
      app.round.challenge = event.message.data.challenge;
    }

    if (event.message.type == "updatePasswordRules") {
      app.round.rules = event.message.data.rules;
    }

    if (event.message.type == "updateBugs") {
      app.round.bugs = event.message.data.bugs;
    }

    if (event.message.type == "startGuessing") {
      app.round.phase = "create password";
      app.round.sysAdminIndex = event.message.data.sysAdminIndex;
      app.startTimer();
    }

    if (event.message.type == "triedPassword") {
      app.round.attempts.push(event.message.data);
    }

    if (event.message.type == "passwordSuccess") {
      let i = event.message.data.playerIndex;
      app.players[i].score = event.message.data.playerScore;
      app.round.claimedPasswords.push(event.message.data.pwAttempt);
      app.round.attempts.push(event.message.data);
    }

  },

  status: function(event) {
    displayMessage(
      event.category,
      'connected to channels: ' + event.affectedChannels,
      event.currentTimetoken,
      event
    );
  },

  // Count people in room.
  presence: function(event) {
    if (event.channel != theChannel) {
      app.playerCount = event.occupancy;
    }

    if (app.isRoomHost) {
      app.sendPlayerUpdate();
    }
  }

});

pubnub.subscribe({
  channels: ['the_guide'],
  withPresence: true
});

const displayMessage = function(messageType, aMessage, timeStamp, obj) {

  if (obj) {
    app.messages.push({ type: messageType, msg: aMessage, timeStamp:timeStamp, obj: obj });
  } else if (timeStamp) {
    app.messages.push({ type: messageType, msg: aMessage, timeStamp:timeStamp });
  } else if (aMessage) {
    app.messages.push({ type: messageType, msg: aMessage, });
  } else if (messageType) {
    app.messages.push({ type: messageType });
  }

};