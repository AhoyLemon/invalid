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
      if (app.my && app.my.playerIndex && app.my.playerIndex > -1) {
        app.my.role = app.players[app.my.playerIndex].role;
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
      app.roundStartTimer();
    }

    if (event.message.type == "triedPassword") {
      app.round.attempts.push(event.message.data);
    }

    if (event.message.type == "passwordSuccess") {
      let i = event.message.data.playerIndex;
      app.players[i].score = event.message.data.playerScore;
      app.round.claimedPasswords.push(event.message.data.pwAttempt);
    
      app.round.attempts.push(event.message.data);

      // If the Hurry Up timer hasn't already started, start it now.
      if (app.round.hurryTimer == undefined) {
        app.startHurryTimer();
      }

      // Add this to all Employee Passwords, for the final round.
      let p = {
        pw: event.message.data.pwAttempt,
        name: app.players[i].name,
        playerIndex: i
      };
      app.allEmployeePasswords.push(p);

      // Let's check to see if all employees have succeeded.

      if (app.round.claimedPasswords.length >= (app.players.length - 1) ) {
        // Yup! Let's end the round.
        app.endTheGuessingRound();
      }

    }

    if (event.message.type == "roundOver") {
      app.ui.roundOver = true;
      app.resetHurryTimer();
      app.resetRoundTimer();
    }

    if (event.message.type == "crashedServer") {
      let i = event.message.data.playerIndex;
      app.round.phase = "crashed";
      app.round.crash.active = true;
      app.round.crash.player = app.players[i];
      app.round.crash.word = event.message.data.pwAttempt;
      app.round.attempts.push(event.message.data);

      if (app.my.role == "SysAdmin") {
        app.my.score += 100;
      }
      app.endTheGuessingRound();
    }

    if (event.message.type == "startNewRound") {
      app.players = event.message.data.players;
      
      let i = app.round.sysAdminIndex + 1;

      if (i >= app.players.length) {
        alert('XXX you have cycled thru all players. Soooooo... Uhhh, do something about that.');
      } else {
        app.round.sysAdminIndex = i;
      }

      // Define roles.
      app.players.forEach(function(p,index) {
        p.role = "employee";
      });
      app.players[i].role = "SysAdmin";
      app.my.role = app.players[app.my.playerIndex].role;

      app.ui = uiDefaults;
      app.round.phase = "choose rules";
      app.round.number += 1;
      app.round.possibleChallenges = [];
      app.round.challenge = {};
      app.round.rules = [];
      app.round.attempts = [];
      app.round.claimedPasswords = [];
      app.round.elapsedTime = 0;
      app.round.crash = {
        active: false,
        word: "",
        player: {}
      };

      if (app.my.role == "SysAdmin") {
        app.definePossibleChallenges();
      }
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