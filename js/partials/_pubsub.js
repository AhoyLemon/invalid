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

    if (event.message.type == "requestPlayers") {
      if (app.isRoomHost) {
        app.sendPlayerUpdate();
      }
    }

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
      app.maxRounds = event.message.data.maxRounds;
      app.round.sysAdminIndex = event.message.data.sysAdminIndex;
      if (app.my.role == "SysAdmin") {
        app.definePossibleChallenges();
      }
    }

    if (event.message.type == "updatePasswordChallenge") {
      app.round.challenge = event.message.data.challenge;
      app.ui.roundOver = false;
      soundNewRule.play();
    }

    if (event.message.type == "updatePasswordRules") {
      app.round.rules = event.message.data.rules;
      app.ui.roundOver = false;
      soundNewRule.play();
    }

    if (event.message.type == "updateBugs") {
      app.round.bugs = event.message.data.bugs;
      app.ui.roundOver = false;
      soundNewRule.play();
    }

    if (event.message.type == "startGuessing") {
      app.round.phase = "create password";
      app.round.sysAdminIndex = event.message.data.sysAdminIndex;
      app.ui.roundOver = false;
      app.roundStartTimer();
      soundStartGuessing.play();
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
        playerIndex: i,
        claimed: false
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
      app.ui.passwordSucceeded = false;
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

      soundSystemCrash.play();

      if (app.my.role == "SysAdmin") {
        app.my.score += 100;
        app.players[app.my.playerIndex].score += 100;
      }
      app.endTheGuessingRound();
    }

    if (event.message.type == "startNewRound") {
      app.players = event.message.data.players;
      
      if (app.round.number >= app.maxRounds) {
        // Time for the final round.
        self.round.phase = "FINAL ROUND";
        self.startCountdownToFinalRound();
      } else {
        // Let's do another round.
        let i = app.round.sysAdminIndex + 1;
        if (i >= app.players.length) {
          app.round.sysAdminIndex = 0;
        } else {
          app.round.sysAdminIndex = i;
        }
      }

      // Define roles.
      app.players.forEach(function(p,index) {
        p.role = "employee";
      });
      app.players[app.round.sysAdminIndex].role = "SysAdmin";
      app.my.role = app.players[app.my.playerIndex].role;

      app.ui = uiDefaults;
      // ^- figure out why that doesn't work.
      app.ui.challengeID = null;

      app.my.rulebux = defaults.rulebux;

      app.round.phase = "choose rules";
      app.round.number += 1;
      app.round.possibleChallenges = [];
      app.round.challenge = {};
      app.round.rules = [];
      app.round.bugs = [];
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

    if (event.message.type == "passwordCracked") {
      app.players = event.message.data.players;
      app.allEmployeePasswords = app.players = event.message.data.allEmployeePasswords;
    }

    if (event.message.type == "gameOver") {
      app.setGameOver();
    }

  },

  status: function(event) {

    app.requestPlayers();

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