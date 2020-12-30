let currentPlayerNum = 0;

var app = new Vue({
  el: '#app',
  data: {
    currentlyInGame: false,
    roomCode: null,
    isRoomHost: false,
    rules: rules,
    playerCount: 0,
    maxRounds: 0,
    my: {
      employeeNumber: randomNumber(10000,99999),
      name: '',
      playerIndex: -1, // This is assigned in updatePlayer()
      role: null,
      rulebux: defaults.rulebux,
      passwordAttempts: 0,
      score: 0
    },

    players: [],

    round: {
      phase: 'create or join',
      number: 0,
      sysAdminIndex: -1,
      possibleChallenges: [],
      challenge: {},
      rules: [],
      bugs: [],
      attempts: [],
      claimedPasswords: [],
      possibleAnswerCount: 0,
      averageSize: 0,
      averageVowels: 0,
      letterCounts: [],
      demandableLetters: [],
      maxOffset: defaults.maxOffset,
      minOffset: defaults.minOffset,
      vowelOffset: defaults.vowelOffset,
      elapsedTime: 0,
      adminTimer: undefined,
      roundTimer: undefined,
      hurryTimer: undefined,
      hurryTime: defaults.hurryTime,
      adminTimeLeft: defaults.adminTimeLeft,
      finalTimeLeft: defaults.finalTimeLeft,
      crash: {
        active: false,
        word: "",
        player: {}
      }
    },
    allEmployeePasswords: [],
    ui: {
      appliedForJob: false,
      enterCode: {
        focus: false
      },
      challengeID: null,
      addBug: '',
      addBugErrors: [],
      passwordAttempt: '',
      passwordAttemptErrors: [],
      passwordInputError: false,
      passwordSucceeded: false,
      roundOver: false,
      currentRule: {
        editing: false,
        name: '',
        cost: 0,
        inputValue: '',
        inputValueTwo: ''
      },
      enterFinalPasswords: false,
      passwordSuccessMessage: null
    },
    messages: []
  },

  methods: {



    ////////////////////////////////////////////////////////////////
    // Lobby Create / Join Methods

    createRoom() {
      const self = this;

      function makeID(digits) {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      
        for (let i = 0; i < digits; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
      
        return text;
      }

      self.roomCode = makeID(4);

      // Create a room with the randomly generated code.
      socket.emit('createRoom', self.roomCode);

      // Set your local variables.
      self.isRoomHost = true;
      self.currentlyInGame = true;
      self.round.phase = "pregame";
      const url = new URL(window.location);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);

    },

    joinRoom() {
      const self = this;

      // Try to join a room with the entered code.
      socket.emit('joinRoom', self.roomCode);

      
      self.currentlyInGame = true;
      self.round.phase = "pregame";
      const url = new URL(window.location);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);



    },


    /////////////////////////////////////////////////////////////////////
    // BEFORE GAME (game hasn't started yet)


    // TODO: Remove entire PubNub requestPlayers apparatus.
    /*
    requestPlayers() {
      const self = this;
      if (self.roomCode) {
        pubnub.publish({
          channel : self.roomCode,
          message : {
            type: 'requestPlayers',
            data: {}
          }
        });
      }
    },
    */

    updatePlayer() {
      const self = this;
      
      self.ui.appliedForJob = true;
      //Is this a new player or a player update
      let newPlayer = true;
      const p = {
        name: self.my.name,
        employeeNumber: self.my.employeeNumber,
        isRoomHost: self.isRoomHost,
        role: null,
        score: 0
      };

      self.players.forEach(function(player, index) {
        if (player.employeeNumber == self.my.employeeNumber) {
          self.players[index] = p;
          newPlayer = false;
        }
      });
      
      // It's a new player, add that to the array.
      if (newPlayer) {
        self.players.push(p);
      }


      self.players.forEach(function(player, index) {
        if (player.employeeNumber == self.my.employeeNumber) {
          self.my.playerIndex = index;
        }
      });
      if (self.my.playerIndex < 0) {
        alert('could not get a player index. this is a bug. this should not happen.');
      }

      self.sendPlayerUpdate();

    },
    
    sendPlayerUpdate() {
      const self = this;

      const d = {
        roomCode: self.roomCode,
        players: self.players
      };

      socket.emit('updatePlayers', d);
    },

    startTheGame() {
      const self = this;

      // Assign the host as SysAdmin, all other players are employees
      self.players.forEach(function(player, index) {
        if (player.isRoomHost) {
          self.players[index].role = "SysAdmin";
        } else {
          self.players[index].role = "employee";
        }
      });

      if (self.players.length == 2) {
        self.maxRounds = 6;
      } else if (self.players.length == 3) {
        self.maxRounds = 6;
      } else if (self.players.length == 4) {
        self.maxRounds = 4;
      } else {
        self.maxRounds = self.players.length;
      }


      // TODO: Remove PubNub startTheGame
      /*
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'startTheGame',
          data: {
            players: self.players,
            maxRounds: self.maxRounds,
            sysAdminIndex: self.my.playerIndex
          }
        }
      });
      */

      socket.emit('startTheGame', {
        roomCode: self.roomCode,
        players: self.players,
        maxRounds: self.maxRounds,
        sysAdminIndex: self.my.playerIndex
      });

    },

    ////////////////////////////////////////////////////////////////
    // SysAdmin Methods
    // This is gonna shuffle & filter the possible categories...
    definePossibleChallenges() {
      const self = this;
      let c = shuffle(challenges);
      c.length = 3;
      self.round.possibleChallenges = c;
    },

    chooseAChallenge() {
      const self = this;
      challenges.forEach(function(c) {
        if (c.id == self.ui.challengeID) {
          self.round.challenge = c;
        }
      });
      self.findPossibleRightAnswers();
      self.findAverageSize();
      self.findAverageVowelCount();
      self.countLettersInEachWord();
      self.startAdminTimer();

      // TODO: Remove PubNub password challenge.
      /*
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'updatePasswordChallenge',
          data: {
            challenge: self.round.challenge
          }
        },
      });
      */

      socket.emit("updatePasswordChallenge", {
        roomCode: self.roomCode,
        challenge: self.round.challenge
      });


    },

    chooseRule(rule) {
      const self = this;
      self.ui.currentRule.name = rule.name;
      self.ui.currentRule.cost = rule.cost;
      self.ui.currentRule.editing = true;
    },

    saveRule(rule) {
      const self = this;
      let r = {
        type: "",
        message: "",
        inputValue: "",
        inputValueTwo: null,
      };
      if (rule.name == "Ban A Letter") {
        r.type = rule.name;
        r.inputValue = self.ui.currentRule.inputValue.toUpperCase();
        r.message = 'You may not use the letter ' +  r.inputValue;
      }
      if (rule.name == "Demand A Letter") {
        r.type = rule.name;
        r.inputValue = self.ui.currentRule.inputValue.toUpperCase();
        r.message = 'You must use the letter ' +  r.inputValue;
      }

      if (rule.name == "Set A Maximum") {
        r.type = rule.name;
        r.inputValue = self.round.averageSize + self.round.maxOffset;
        r.message = self.ui.currentRule.inputValue;
      }

      if (rule.name == "Set A Minimum") {
        r.type = rule.name;
        r.inputValue = self.round.averageSize - self.round.minOffset;
        r.message = self.ui.currentRule.inputValue;
      }

      if (rule.name == "Limit Vowels") {
        r.type = rule.name;
        r.inputValue = self.round.averageVowels + self.round.vowelOffset;
        r.message = self.ui.currentRule.inputValue;
      }

      if (rule.name == "Ban A Combo") {
        r.type = rule.name;
        r.inputValue = self.ui.currentRule.inputValue.toUpperCase();
        r.inputValueTwo = self.ui.currentRule.inputValueTwo.toUpperCase();

        if (r.inputValue == r.inputValueTwo) {
          r.message = "You may only use the letter " + r.inputValue + ' once';
        } else {
          r.message = 'You may not use the letters ' +  r.inputValue + ' and ' + r.inputValueTwo + " together";
        }
        
      }

      // Add it to the rule list.
      self.round.rules.push(r);
      // Recalculate Possible Right Answers.
      self.findPossibleRightAnswers();

      // if possibleRightAnswers is high enough, save the rule.
      if (self.round.possibleAnswerCount >= self.players.length) {
        // Pay for it.
        self.my.rulebux = (self.my.rulebux - rule.cost);
        
        
        // TODO: Remove pubnub updatePasswordRules
        /*
        pubnub.publish({
          channel : self.roomCode,
          message : {
            type: 'updatePasswordRules',
            data: {
              rules: self.round.rules
            }
          },
        });
        */

        // Inform the other players.
        socket.emit("updatePasswordRules", {
          roomCode: self.roomCode,
          rules: self.round.rules
        });

      } else {
        alert('ERROR: \n Sorry, this rule would make the game impossible \n This interface will look better eventually.');
        self.round.rules.pop();
        self.findPossibleRightAnswers();
      }

      // Clear out current rule.
      self.clearCurrentRule();

    },

    clearCurrentRule() {
      const self = this;
      
      self.ui.currentRule.name = "";
      self.ui.currentRule.inputValue = "";
      self.ui.currentRule.inputValueTwo = "";
      self.ui.currentRule.cost = 0;
      self.ui.currentRule.editing = false;
    },

    addBug() {
      const self = this;

      self.ui.addBugErrors = [];

      const bug = self.ui.addBug.toUpperCase();
      let foundMatch = false;
      self.round.challenge.possible.forEach(function(p,index) {
        if (bug == p.toUpperCase()) {
          foundMatch = true;
        }
      });

      if (!foundMatch) {
        self.ui.addBugErrors.push("Just so you know, "+bug+" wasn't a valid password");
      }

      if (findInArray(self.round.bugs,bug)) {
        self.ui.addBugErrors.push("You already added "+bug+".");
      }


      // Charge for adding the bug.
      if (self.round.bugs && self.round.bugs.length > 0) {
        self.my.rulebux -= 1;
      }

      self.ui.addBug = '';
      self.round.bugs.push(bug);


      // TODO: Remove PubNub updateBugs
      /*
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'updateBugs',
          data: {
            bugs: self.round.bugs
          }
        },
      });
      */

      socket.emit("updateBugs", {
        roomCode: self.roomCode,
        bugs: self.round.bugs
      });
    },

    onboardEmployees() {
      const self = this;
      self.resetAdminTimer();

      // TODO: Remove PubNub startGuessing
      /*
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'startGuessing',
          data: {
            sysAdminIndex: self.my.playerIndex
          }
        },
      });
      */

      socket.emit("startGuessing", {
        roomCode: self.roomCode,
        sysAdminIndex: self.my.playerIndex
      });
    },

    // TIMERS:
    // The guessing has begun.
    startAdminTimer() {
      const self = this;
      self.round.adminTimeLeft = defaults.adminTimeLeft;
      self.round.adminTimer = setInterval(() => {
        self.round.adminTimeLeft -= 0.05;
        if (self.round.adminTimeLeft <= 0) {
          self.onboardEmployees();
        }
      }, 50);
    },

    resetAdminTimer() {
      const self = this;
      clearInterval(self.round.adminTimer);
      self.round.adminTimer = undefined;
      self.round.adminTimeLeft = defaults.adminTimeLeft;
    },

    roundStartTimer() {
      const self = this;
      self.round.roundTimer = setInterval(() => {
        self.round.elapsedTime += 1;
        self.players[self.round.sysAdminIndex].score += 1;
        if ((self.round.elapsedTime >= (defaults.employeeMaxTime - defaults.hurryTime)) && (self.round.hurryTimer == undefined)) {
          self.startHurryTimer();
        }
      }, 1000);
    },
    
    resetRoundTimer() {
      const self = this;
      clearInterval(self.round.roundTimer);
      self.round.roundTimer = undefined;
      self.round.elapsedTime = 0;
    },

    // Hurry up!
    startHurryTimer() {
      const self = this;
      self.round.hurryTimer = setInterval(() => {
        self.round.hurryTime -= 0.1;
        if (self.round.hurryTime <= 0) {
          self.endTheGuessingRound();
        }
      }, 100);
    },

    resetHurryTimer() {
      const self = this;
      clearInterval(self.round.hurryTimer);
      self.round.hurryTimer = undefined;
      self.round.hurryTime = defaults.hurryTime;
    },

    // Countdown to final round.
    startCountdownToFinalRound() {
      const self = this;
      self.round.hurryTime = (defaults.hurryTime * 2);
      self.round.hurryTimer = setInterval(() => {
        self.round.hurryTime -= 1;
        if (self.round.hurryTime <= 0) {
          self.ui.enterFinalPasswords = true;
          clearInterval(self.round.hurryTimer);
          self.round.hurryTimer = undefined;
          self.startFinalRoundCounter();
        }
      }, 1000);
    },

    startFinalRoundCounter() {
      const self = this;
      self.round.finalTimeLeft = defaults.finalTimeLeft;
      self.round.roundTimer = setInterval(() => {
        self.round.finalTimeLeft -= 1;
        if (self.round.finalTimeLeft <= 0) {

          // TODO: Remove PubNub gameover
          /*
          pubnub.publish({
            channel : self.roomCode,
            message : {
              type: 'gameOver'
            }
          });
          */

          socket.emit("gameOver", {
            roomCode: self.roomCode
          });
        }
      }, 1001);
    },

    /////////////////////////////
    // EMPLOYEE FUNCTIONS
    endTheGuessingRound() {
      const self = this;
      
      // TODO: Remove pubnub roundover
      /*
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'roundOver'
        },
      });
      */

      // TODO: Figure out why this fires for each player, and try to make it only fire once.
      socket.emit("roundOver", {
        roomCode: self.roomCode
      });

    },

    tryToFailThis(attempt) {
      let self = this;

      attempt = attempt.toUpperCase();
      let attemptFailed = false;
      let attemptFailedReasons = [];

      self.round.rules.forEach(function(r) {
        if (r.type == "Ban A Letter") {
          if (attempt.includes(r.inputValue)) {
            attemptFailed = true;
            attemptFailedReasons.push('Password cannot contain '+r.inputValue);
          }
        } 
        if (r.type == "Demand A Letter") {
          if (!attempt.includes(r.inputValue)) {
            attemptFailed = true;
            attemptFailedReasons.push('Password must contain '+r.inputValue);
          }
        } 
        if (r.type == "Set A Maximum") {
          if (attempt.length > r.inputValue) {
            attemptFailed = true;
            attemptFailedReasons.push('Password is too long');
          }
        } 
        if (r.type == "Set A Minimum") {
          if (attempt.length < r.inputValue) {
            attemptFailed = true;
            attemptFailedReasons.push('Password is too short');
          }
        } 
        if (r.type == "Limit Vowels") {
          // BUG - this line doesn't work.
          if (countVowels(attempt) > r.inputValue) {
            attemptFailed = true;
            attemptFailedReasons.push('Password has too many vowels');
          }
        } 
        if (r.type == "Ban A Combo") {

          if (r.inputValue == r.inputValueTwo) {
            if (attempt.replace(/[^a]/g, "").length > 1) {
              attemptFailed = true;
              attemptFailedReasons.push('Password can only contain one '+r.inputValue);
            }
          } else if (r.inputValue != r.inputValueTwo) {
            if (attempt.includes(r.inputValue) && attempt.includes(r.inputValueTwo)) {
              attemptFailed = true;
              attemptFailedReasons.push('Password cannot contain both the letters '+r.inputValue+ ' and '+r.inputValueTwo);
            }
          }
        }
      });

      if (!attemptFailed) {
        return false;
      } else {
        return {
          failed: true,
          reasons: attemptFailedReasons
        };
      }
      

    },

    tryToCrashWith(attempt) {
      const self = this;
      let systemCrashed = false;

      self.round.bugs.forEach(function(bug) {
        if (bug == attempt) {
          systemCrashed = true;
        }
      });
      return systemCrashed;
    },

    tryToFindDuplicatePassword(attempt) {
      const self = this;
      if (self.round.claimedPasswords.includes(attempt)) {
        return true;
      } else {
        return false;
      }
    },

    tryToFind(attempt) {
      const self = this;
      attempt = attempt.toUpperCase();

      let foundOne = false;
      self.round.challenge.possible.forEach(function(possibility) {
        if (attempt.toUpperCase() == possibility.toUpperCase()) {
          foundOne = true;
        }
      });
      return foundOne;
    },

    tryThisPassword(attempt) {
      const self = this;
      attempt = attempt.toUpperCase();
      self.ui.passwordAttemptErrors = [];

      const crashCheck = self.tryToCrashWith(attempt);
      const failCheck = self.tryToFailThis(attempt);
      const duplicateCheck = self.tryToFindDuplicatePassword(attempt);
      const matchCheck = self.tryToFind(attempt);

      let correctAnswer = false;

      if (failCheck) {
        self.ui.passwordAttemptErrors = failCheck.reasons;
        self.ui.passwordInputError = true;
      }
      if (duplicateCheck) {
        self.ui.passwordAttemptErrors.push("Someone else has already used "+attempt+" as a password.");
        self.ui.passwordInputError = true;
      }
      
      if (!matchCheck) {
        let errorMessage = self.round.challenge.failedMessage.replace("[PASS]", attempt);
        self.ui.passwordInputError = true;
        self.ui.passwordAttemptErrors.push(errorMessage);
      }

      if (matchCheck && !failCheck && !crashCheck && !duplicateCheck) {
        correctAnswer = true;
      }

      // Deal with the results of the attempt.
      self.my.passwordAttempts++;
      self.ui.passwordAttempt = '';
      

      if (crashCheck) {

        // TODO: Remove pubnub crashedServer
        /*
        pubnub.publish({
          channel : self.roomCode,
          message : {
            type: 'crashedServer',
            data: {
              playerIndex: self.my.playerIndex,
              pwAttempt: attempt,
              attemptCount: self.my.passwordAttempts,
              result: "crash"
            }
          },
        });
        */

        socket.emit("crashedServer", {
          roomCode: self.roomCode,
          playerIndex: self.my.playerIndex,
          pwAttempt: attempt,
          attemptCount: self.my.passwordAttempts,
          result: "crash"
        });

      } else if (correctAnswer) {
        soundCorrectGuess.play();
        self.passwordSuccess(attempt);
      } else {
        soundBadGuess.play();

        // TODO: Remove PubNub triedPassword
        /*
        pubnub.publish({
          channel : self.roomCode,
          message : {
            type: 'triedPassword',
            data: {
              playerIndex: self.my.playerIndex,
              pwAttempt: attempt,
              attemptCount: self.my.passwordAttempts,
              result: "failed"
            }
          },
        });
        */

        socket.emit("triedPassword", {
          roomCode: self.roomCode,
          playerIndex: self.my.playerIndex,
          pwAttempt: attempt,
          attemptCount: self.my.passwordAttempts,
          result: "failed"
        });

      }
    },

    findPossibleRightAnswers() {
      const self = this;

      let possibleAnswerCount = 0;
      self.round.challenge.possible.forEach(function(possibility) {

        if (self.tryToFailThis(possibility) == false) {
          possibleAnswerCount++;
        }
        
      });

      self.round.possibleAnswerCount = possibleAnswerCount;

    },

    findAverageSize() {

      const self = this;
      const possibilities = self.round.challenge.possible;

      var total = 0;
      for(var i = 0; i < possibilities.length; i++) {
        total += possibilities[i].length;
      }
      var avg = total / possibilities.length;

      self.round.averageSize = Math.round(avg);

    },

    findAverageVowelCount() {
      const self = this;
      const possibilities = self.round.challenge.possible;

      var total = 0;
      for(var i = 0; i < possibilities.length; i++) {
        // Search text with Regex and store all matching instances 
        let matchingInstances = possibilities[i].match(/[aeiou]/gi);
        if (matchingInstances) {
          total += matchingInstances.length;
        }
      }
      var avg = total / possibilities.length;

      self.round.averageVowels = Math.round(avg);
      //self.round.averageVowels = avg.toFixed(1);
    },

    countLettersInEachWord() {
      const self = this;

      const allLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
      const possibilities = self.round.challenge.possible;
      let letter = "";
      let count = 0;
      let letterReport = [];

      // For every letter in the alphabet...
      allLetters.forEach(function(l,lIndex) {
        letter = l;
        count = 0;

        // Add +1 if the possibility contains that letter.
        possibilities.forEach(function(p, pIndex) {
          if (p.toUpperCase().includes(l)) {
            count++;
          }
        });

        // And then add it to a report.
        let r = {
          letter: l,
          count: count
        };
        letterReport.push(r);

      });
      

      self.round.letterCounts = letterReport;
      self.round.demandableLetters = [];

      self.round.letterCounts.forEach(function(letter) {
        if (letter.count >= (self.players.length + 2)) {
          self.round.demandableLetters.push(letter.letter);
        }
      });
    },

    passwordSuccess(attempt) {
      const self = this;
      // YOU GOT IT!
      // Let's give you some points
      self.my.score += 100;

      if (self.round.claimedPasswords.length < 1) {
        self.my.score += 20;
      }

      // Let's change the UI to reflect you having won.
      self.ui.passwordSucceeded = true;

      // TODO: Remove pubnub passwordSuccess
      /*
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'passwordSuccess',
          data: {
            playerIndex: self.my.playerIndex,
            pwAttempt: attempt,
            attemptCount: self.my.passwordAttempts,
            playerScore: self.my.score,
            result: "success"
          }
        },
      });
      */

      socket.emit("passwordSuccess", {
        roomCode: self.roomCode,
        playerIndex: self.my.playerIndex,
        pwAttempt: attempt,
        attemptCount: self.my.passwordAttempts,
        playerScore: self.my.score,
        result: "success"
      });

    },

    startNextRoundClicked() {
      const self = this;

      // TODO: Remove pubnub StartnewRound
      /*
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'startNewRound',
          data: {
            playerIndex: self.my.playerIndex,
            players: self.players
          }
        },
      });
      */

      socket.emit("startNewRound", {
        roomCode: self.roomCode,
        playerIndex: self.my.playerIndex,
        players: self.players
      });

    },

    ////////////////////////////////////////////////////////////////
    // Final Round stuff.

    tryToCrackWith(attempt) {
      const self = this;
      attempt = attempt.toUpperCase();

      self.ui.passwordAttempt = "";
      self.ui.passwordSuccessMessage = "";
      self.ui.passwordAttemptErrors = [];
      let pwMatch = false;
      let pwMatchErrorMessage = null;
      let pwPlayerIndex = -1;
      let passwordClaimed = false;
      let matchIndex = -1;

      self.allEmployeePasswords.forEach(function(p, i) {
        if (p.pw == attempt) {
          pwMatch = true;
          if (p.name == self.my.name || p.playerIndex == self.my.playerIndex) {
            soundYouIdiot.play();
            pwMatchErrorMessage = "You just hacked into your own account. Did you mean to do that?";
          } else if (p.claimed) {
            soundTooSlow.play();
            passwordClaimed = true;
            pwMatchErrorMessage = "This password was already cracked by "+p.claimed;
          } else {
            pwPlayerIndex = p.playerIndex;
            matchIndex = i;
          }
        }
      });

      if (pwMatchErrorMessage) {
        
        self.ui.passwordAttemptErrors.push(pwMatchErrorMessage);
      } else if (!pwMatch) {
        soundNo.play();
        self.ui.passwordAttemptErrors.push("There is no employee with the password "+attempt);
      } else if (pwMatch && pwPlayerIndex != -1) {
        soundCracked.play();
        self.ui.passwordSuccessMessage = "The password "+attempt+ " belongs to "+self.players[pwPlayerIndex].name;
        self.players[self.my.playerIndex].score += defaults.hackAccountBonus;
        self.players[pwPlayerIndex].score -= defaults.hackAccountBonus;

        self.allEmployeePasswords[matchIndex].claimed = self.my.name;

        // TODO: Remove PubNub passwordCracked
        /*
        pubnub.publish({
          channel : self.roomCode,
          message : {
            type: 'passwordCracked',
            data: {
              players: self.players,
              allEmployeePasswords: self.allEmployeePasswords
            }
          },
        });
        */

        socket.emit("passwordCracked", {
          roomCode: self.roomCode,
          players: self.players,
          allEmployeePasswords: self.allEmployeePasswords
        });

        if (self.computedUnclaimedPasswords < 1) {

          // TODO Remove PubNub gameOver
          /*
          pubnub.publish({
            channel : self.roomCode,
            message : {
              type: 'gameOver'
            }
          });
          */

          socket.emit("gameOver", {
            roomCode: self.roomCode
          });

        }

      }
    },

    setGameOver() {
      const self = this;
      clearInterval(self.round.roundTimer);
      self.round.roundTimer = undefined;

      // TODO: Create a game over screen.
      alert('IMAGINE A GAME OVER SCREEN GOES HERE.');
    }

  },

  computed: {

    computedSysAdminName() {
      const self = this;
      if (self.players && self.players.length > 0 && self.round.sysAdminIndex > -1) {
        return self.players[self.round.sysAdminIndex].name;
      } else {
        return null;
      }
    },
    computedSysAdminIndex() {
      const self = this;
      return self.round.sysAdminIndex;
    },
    computedUnclaimedPasswords() {
      const self = this;
      if (self.allEmployeePasswords.length < 1) {
        return 0;
      } else {
        let n = 0;
        self.allEmployeePasswords.forEach(function(p) {
          if (!p.claimed) {
            n++;
          }
        });
        return n;
      }
    }

  },

  mounted: function() {
    const self = this;
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
      self.roomCode = urlParams.get('room');

      // TODO: Remove PubNub subscription
      /*
      setTimeout(function(){
        pubnub.subscribe({
          channels: [self.roomCode],
          withPresence: true
        });
      }, 1000);
      */
    }


    // FAKE EMPLOYEE.
    
    
    /*
    self.my.role = "employee";
    self.my.name = "Lemon";
    self.my.playerIndex = 1;
    self.currentlyInGame = true;
    self.players = [
      { name: "Carlos", role:"SysAdmin", employeeNumber:2, score:320  },
      { name: "Lemon", role:"employee", employeeNumber:1, score:118  },
      { name: "Pablo", role:"employee", employeeNumber:3, score:212  }
    ];
    self.round.phase = "FINAL ROUND";

    self.allEmployeePasswords = [
      { pw: "SCORPION", name: "Carlos", playerIndex:0, claimed: false },
      { pw: "RAIDEN", name: "Pablo", playerIndex:2, claimed: false },
      { pw: "GORO", name: "Carlos", playerIndex:0, claimed: false },
      { pw: "MILEENA", name: "Pablo", playerIndex:2, claimed: false },
      { pw: "KITANA", name: "Carlos", playerIndex:0, claimed: false },
      { pw: "KANO", name: "Pablo", playerIndex:2, claimed: false },
    ];
    self.startCountdownToFinalRound();
    */
    
    //self.ui.passwordSucceded = true;
    //self.ui.roundOver = true;
    //self.startHurryTimer();


  },

  directives: {

  }

});


Vue.directive( 'touppercase', {
  update (el) {
    el.value = el.value.toUpperCase();
  }
});

// Register a global custom directive called `v-focus`
Vue.directive('focus', {
  // When the bound element is inserted into the DOM...
  inserted: function (el) {
    // Focus the element
    el.focus();
  }
});