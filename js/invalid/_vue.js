let currentPlayerNum = 0;

var app = new Vue({
  el: '#app',
  data: {
    currentlyInGame: false,
    gameStarted: false,
    roomCode: "",
    gameName: "invalid",
    isRoomHost: false,
    rules: rules,
    maxRounds: 0,
    allowNaughty: false,
    my: {
      employeeNumber: randomNumber(10000,99999),
      name: '',
      color: '#ff0000',
      playerIndex: -1, // This is assigned in updatePlayer()
      role: null,
      rulebux: settings.default.rulebux,
      passwordAttempts: 0,
      score: 0,
      socketID: ""
    },

    players: [],

    round: {
      phase: 'create or join',
      number: 0,
      sysAdminIndex: -1,
      possibleChallenges: [],
      challenge: {},
      rules: [],
      shibboleth: "",
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
      hurryTime: settings.timer.hurryTime,
      adminTimeLeft: settings.timer.adminTimeLeft,
      finalTimeLeft: settings.timer.finalTimeLeft,
      flyingPig: {
        active: false,
        message: "",
        timer: undefined
      },
      crash: {
        active: false,
        word: "",
        player: {}
      }
    },
    allEmployeePasswords: [],
    //allPlayedRounds: [],
    roundSummary: [],
    crackSummary: [],
    ui: {
      appliedForJob: false,
      enterCode: {
        focus: false
      },
      challengeID: null,
      shibboleth: "",
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
    // TODO: Deprecate this?
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
      socket.emit('createRoom', {
        roomCode: self.roomCode,
        gameName: self.gameName
      });

      // Set your local variables.
      self.isRoomHost = true;
      self.currentlyInGame = true;
      self.round.phase = "pregame";
      let url = new URL(location.protocol + '//' + location.host + location.pathname);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);
    },

    joinRoom() {
      const self = this;

      // Try to join a room with the entered code.
      socket.emit('joinRoom', {
        roomCode: self.roomCode,
        gameName: self.gameName
      });

      self.currentlyInGame = true;
      self.round.phase = "pregame";
      let url = new URL(location.protocol + '//' + location.host + location.pathname);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);

    },


    /////////////////////////////////////////////////////////////////////
    // BEFORE GAME (game hasn't started yet)

    updatePlayer() {
      const self = this;
      
      self.ui.appliedForJob = true;
      //Is this a new player or a player update
      let newPlayer = true;

      const p = {
        name: self.my.name,
        employeeNumber: self.my.employeeNumber,
        socketID: self.my.socketID,
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
      document.title =  self.my.name + " | " + gameTitle;

      if (self.my.playerIndex < 0) {
        alert('could not get a player index. this is a bug. this should not happen.');
      }

      self.sendPlayerUpdate();

    },
    
    sendPlayerUpdate() {
      const self = this;

      const d = {
        roomCode: self.roomCode,
        players: self.players,
        gameStarted: self.gameStarted
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
        self.maxRounds = 8;
      } else {
        self.maxRounds = self.players.length;
      }

      socket.emit('startTheGame', {
        roomCode: self.roomCode,
        gameName: self.gameName,
        players: self.players,
        maxRounds: self.maxRounds,
        sysAdminIndex: self.my.playerIndex,
        allowNaughty: self.allowNaughty
      });

    },

    ////////////////////////////////////////////////////////////////
    // SysAdmin Methods
    //
    definePossibleChallenges() {
      const self = this;
      self.round.possibleChallenges = [];

      let n = 0;

      // Create some possible challenges, based on some rulesets.
      while (n < settings.default.numberOfPossibleChallenges) {
        let randomChallenge = randomFrom(challenges);

        let appendThisChallenge = true;
        if (randomChallenge.naughty && !self.allowNaughty) {
          // This challenge is too naughty for this game, pick again.
          appendThisChallenge = false;
        } else if (self.round.possibleChallenges.length != []) {
          
          self.round.possibleChallenges.forEach(function(c) {
            if (c.id == randomChallenge.id) {
              // This challenge already exists in your list.
              appendThisChallenge = false;
            }
          });
        }

        if (appendThisChallenge) {
          self.round.possibleChallenges.push(randomChallenge);
          n++;
        }
      }
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

      socket.emit("updatePasswordChallenge", {
        roomCode: self.roomCode,
        challenge: self.round.challenge
      });

    },

    chooseRule(rule) {
      const self = this;
      if (rule.name == "Flying Pig") {
        // Special process for summoning a flying pig.
        self.my.rulebux -= rule.cost;
        self.round.flyingPig.active = true;
        self.round.rules.push({
          type:"Flying Pig", message: "Look at the flying pig."
        });
        // Inform the other players.
        socket.emit("updatePasswordRules", {
          roomCode: self.roomCode,
          rules: self.round.rules,
          shibboleth: self.round.shibboleth
        });
        socket.emit('summonThePig',{
          roomCode: self.roomCode,
        });

      } else if (rule.name == "Set A Maximum" || rule.name == "Set A Minimum" || rule.name == "Limit Vowels") {
        // For situations where you DON'T have a second rule input.
        let r = { type: rule.name, message: "",inputValue: "",inputValueTwo: "" };

        if (rule.name == "Set A Maximum") {
          r.inputValue = self.round.averageSize + self.round.maxOffset;
          r.message = randomFrom(rulePhrasings.max);
        } else if (rule.name == "Set A Minimum") {
          r.inputValue = self.round.averageSize - self.round.minOffset;
          r.message = randomFrom(rulePhrasings.min);
        } else if (rule.name == "Limit Vowels") {
          r.inputValue = self.round.averageVowels + self.round.vowelOffset;
          r.message = randomFrom(rulePhrasings.min);
        }

        r.message = r.message.replace("[SIZE]", r.inputValue);
        r.message = r.message.replace("[SIZE+1]", (r.inputValue + 1));
        r.message = r.message.replace("[SIZE-1]", (r.inputValue - 1));

        // Pay for it.
        self.my.rulebux = (self.my.rulebux - rule.cost);
        self.round.rules.push(r);
        // Recalculate Possible Right Answers.
        self.findPossibleRightAnswers();
        
        // Inform the other players.
        socket.emit("updatePasswordRules", {
          roomCode: self.roomCode,
          rules: self.round.rules,
          shibboleth: self.round.shibboleth
        });


      } else {
        self.ui.currentRule.name = rule.name;
        self.ui.currentRule.cost = rule.cost;
        self.ui.currentRule.editing = true;
      }
      
    },

    isRuleButtonDisabled(ruleName, ruleCost, ruleUnique) {
      let self = this;

      let buttonDisabled = false;
      
      if (self.my.rulebux < ruleCost) {
        // Too expensive!
        buttonDisabled = true;
      } else if (self.ui.currentRule.editing) {
        // You're in edit mode.
        buttonDisabled = true;
      } else if (ruleUnique && self.computedUsedRuleNames.includes(ruleName)) {
        buttonDisabled = true;
      }
      return buttonDisabled;
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
      } else if (rule.name == "Demand A Letter") {
        r.type = rule.name;
        r.inputValue = self.ui.currentRule.inputValue.toUpperCase();
        r.message = 'You must use the letter ' +  r.inputValue;
      } else if (rule.name == "Shibboleth") {
        r.type = rule.name;
        r.inputValue = self.ui.currentRule.inputValue;
        r.message = 'Before entering a password, you must type ' +  r.inputValue;
        self.round.shibboleth = r.inputValue;
      } else if (rule.name == "Set A Maximum") {
        r.type = rule.name;
        r.inputValue = self.round.averageSize + self.round.maxOffset;
        r.message = self.ui.currentRule.inputValue;
      } else if (rule.name == "Set A Minimum") {
        r.type = rule.name;
        r.inputValue = self.round.averageSize - self.round.minOffset;
        r.message = self.ui.currentRule.inputValue;
      } else if (rule.name == "Limit Vowels") {
        r.type = rule.name;
        r.inputValue = self.round.averageVowels + self.round.vowelOffset;
        r.message = self.ui.currentRule.inputValue;
      } else if (rule.name == "Ban A Combo") {
        r.type = rule.name;
        r.inputValue = self.ui.currentRule.inputValue.toUpperCase();
        r.inputValueTwo = self.ui.currentRule.inputValueTwo.toUpperCase();

        if (r.inputValue == r.inputValueTwo) {
          r.message = "You may only use the letter " + r.inputValue + ' once';
        } else {
          r.message = "Your password cannot contain both " +  r.inputValue + " and " + r.inputValueTwo + " (simultanously)";
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

        // Inform the other players.
        socket.emit("updatePasswordRules", {
          roomCode: self.roomCode,
          rules: self.round.rules,
          shibboleth: self.round.shibboleth
        });

      } else {
        let instance = Vue.$toast.open(
          {
            message: "<h3>ERROR:</h3><p>Sorry, this rule would make the game impossible. Rule undone.</p>",
            type: "error",
            duration: 50000
          }
        );
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

      socket.emit("updateBugs", {
        roomCode: self.roomCode,
        bugs: self.round.bugs
      });
    },

    onboardEmployees() {
      const self = this;
      self.resetAdminTimer();

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
        if ((self.round.elapsedTime >= (settings.timer.employeeMaxTime - settings.timer.hurryTime)) && (self.round.hurryTimer == undefined)) {
          self.startHurryTimer();
        }
      }, 1000);

      // Also, get the Flying Pig talking if he should be....

      if (self.round.flyingPig.active && self.my.role == "employee") {

        if (self.round.phase == "create password") {
          self.round.flyingPig.message = randomFrom(flyingPigLines.guessing);
        }
        self.round.flyingPig.timer = setInterval(() => {
          if (!self.round.flyingPig.active) {
            // if the pig isn't active, kill the pig.
            clearInterval(self.round.flyingPig.timer);
            self.round.flyingPig.timer = undefined;
          } else {
            // Otherwise, let's generate a new line for the pig.
            if (self.round.phase == "create password") {
              self.round.flyingPig.message = randomFrom(flyingPigLines.guessing);
              soundOink.play();
            }
          }
        }, 6501);
      }

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
      self.round.hurryTime = settings.timer.countdownToFinal;
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
      self.round.finalTimeLeft = settings.timer.finalRound;
      self.round.roundTimer = setInterval(() => {
        self.round.finalTimeLeft -= 1;
        if (self.round.finalTimeLeft <= 0) {
          self.setGameOver();
        }
      }, 1001);
    },

    /////////////////////////////
    // EMPLOYEE FUNCTIONS


    summonTheFlyingPig() {
      const self = this;
      self.round.flyingPig.active = true;
      if (self.my.role == "employee") {
        self.round.flyingPig.message = randomFrom(flyingPigLines.intro);
      }
    },

    killThePig() {
      const self = this;
      self.round.flyingPig.active = false;
      clearInterval(self.round.flyingPig.timer);
      self.round.flyingPig.timer = undefined;
    },


    endTheGuessingRound() {
      const self = this;

      // BUG: Figure out why this fires for each player, and try to make it only fire once.
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
      attempt = attempt.toUpperCase();
      /*
      if (self.round.claimedPasswords.includes(attempt)) {
        return true;
      } else {
        return false;
      }
      */

      let foundDupe = false;
      self.round.claimedPasswords.forEach(function(claimedPW) {
        if (attempt.replace(/[^0-9a-z]/gi, '') == claimedPW.toUpperCase().replace(/[^0-9a-z]/gi, '')) {
          foundDupe = true;
        }
      });
      return foundDupe;
    },

    tryToFind(attempt) {
      const self = this;
      attempt = attempt.toUpperCase();

      let foundOne = false;
      self.round.challenge.possible.forEach(function(possibility) {
        if (attempt.replace(/[^0-9a-z]/gi, '') == possibility.toUpperCase().replace(/[^0-9a-z]/gi, '')) {
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
      self.ui.passwordAttempt = "";
      self.ui.shibboleth = "";

      if (crashCheck) {

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
      self.my.score += settings.points.forGoodPassword;

      if (self.round.claimedPasswords.length < 1 && self.players.length > 2) {
        self.my.score += settings.points.forFirstPassword;
      }

      // Let's change the UI to reflect you having won.
      self.ui.passwordSucceeded = true;

      socket.emit("passwordSuccess", {
        roomCode: self.roomCode,
        playerIndex: self.my.playerIndex,
        pwAttempt: attempt,
        attemptCount: self.my.passwordAttempts,
        playerScore: self.my.score,
        result: "success"
      });

      if (self.round.flyingPig.active) {
        self.round.flyingPig.message = randomFrom(flyingPigLines.afterCorrect);
        clearInterval(self.round.flyingPig.timer);
        self.round.flyingPig.timer = undefined;
        soundOink.play();
      }
    },

    startNextRoundClicked() {
      const self = this;

      var summary = {
        challenge: self.round.challenge.name,
        sysAdmin: self.my.name,
        rules: self.round.rules,
        bugs: self.round.bugs,
        attempts: self.round.attempts,
        listSource: self.round.challenge.source,
        possibleAnswers: self.round.possibleAnswerCount
      };

      socket.emit("startNewRound", {
        roomCode: self.roomCode,
        playerIndex: self.my.playerIndex,
        players: self.players,
        summary: summary
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

        if (p.pw.replace(/[^0-9a-z]/gi, '') == attempt.replace(/[^0-9a-z]/gi, '')) {
          pwMatch = true;
          if (p.name == self.my.name || p.playerIndex == self.my.playerIndex) {
            soundYouIdiot.play();
            pwMatchErrorMessage = "You just hacked into your own account. Did you mean to do that?";
            self.players[self.my.playerIndex].score += settings.points.forCrackingOwnPassword;
            self.allEmployeePasswords[i].claimed = self.my.name;
            socket.emit("passwordCracked", {
              roomCode: self.roomCode,
              players: self.players,
              allEmployeePasswords: self.allEmployeePasswords,
              crackSummary: {
                pw: attempt,
                attackerIndex: self.my.playerIndex,
                victimIndex: self.my.playerIndex
              }
            });
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
        self.players[self.my.playerIndex].score += settings.points.forCrackingPassword;
        self.players[pwPlayerIndex].score += settings.points.forHavingPasswordCracked;

        self.allEmployeePasswords[matchIndex].claimed = self.my.name;

        socket.emit("passwordCracked", {
          roomCode: self.roomCode,
          players: self.players,
          allEmployeePasswords: self.allEmployeePasswords,
          crackSummary: {
            pw: attempt,
            attackerIndex: self.my.playerIndex,
            victimIndex: pwPlayerIndex
          }
        });

        if (self.computedUnclaimedPasswords < 1) {
          self.setGameOver();
        }

        document.getElementById("PasswordAttempt").focus();
      }

      document.getElementById("PasswordAttempt").focus();
    },

    setGameOver() {
      const self = this;
      clearInterval(self.round.roundTimer);
      self.round.roundTimer = undefined;
      self.round.phase = "GAME OVER";
      soundGameOver.play();
      socket.emit("gameOver", {
        roomCode: self.roomCode,
        gameName: self.gameName,
        playerIndex: self.my.playerIndex,
        passwordAttempts: self.my.passwordAttempts
      });
    },

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

    computedUsedRuleNames() {
      let self = this;
      let u = [];
      self.round.rules.forEach(function(r) {
        u.push(r.type);
      });
      return u;
    },

    computedShibbolethRequired() {
      const self = this;
      if (self.round.shibboleth && (self.ui.shibboleth.toUpperCase() != self.round.shibboleth.toUpperCase())) {
        return true;
      } else {
        return false;
      }
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
    },
    computedUncrackedPasswords() {
      const self = this;
      if (self.allEmployeePasswords.length < 1) {
        return [];
      } else {
        let arr = [];
        self.allEmployeePasswords.forEach(function(p) {
          if (!p.claimed) {
            arr.push(p);
          }
        });
        return arr;
      }
    },
    computedPlayersByScore() {
      const self = this;
      const computedPlayers = [...self.players];
      
      function compare(a, b) {
        if (a.score < b.score)
          return 1;
        if (a.score > b.score)
          return -1;
        return 0;
      }
      
      return computedPlayers.sort(compare);
    },

    computedCheevos() {      
      const self = this;


      // TODO: This entire setup sucks balls.
      // Come up with a better way to hand out cheevos.
      let playerCracks = [];
      self.players.forEach(player => 
        playerCracks.push({
          name: player.name,
          cracks: 0,
          cracked: 0,
          selfPwn: 0
        })
      );
      self.crackSummary.forEach((crack,cIndex)  => {
        playerCracks[crack.attackerIndex].cracks += 1;
        playerCracks[crack.victimIndex].cracked += 1;
        if (crack.attackerIndex == crack.victimIndex) {
          playerCracks[crack.attackerIndex].selfPwn += 1;
        }
      });

      return {
        playerCracks: playerCracks
      };

    }
  },

  mounted: function() {
    const self = this;
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('create')) { 
      self.createRoom();
    } else if (urlParams.has('room')) {
      self.roomCode = urlParams.get('room').toUpperCase();
      self.joinRoom();
    } else if (urlParams.has('join')) {
      document.getElementById("EnterRoomCode").focus();
    }

    
    /////////////////////////////////////////////
    // FAKE A SYSADMIN
    /*
    self.my.role = "SysAdmin";
    self.my.name = "Lemon";
    self.my.playerIndex = 0;
    self.currentlyInGame = true;
    self.round.number = 1;
    self.round.sysAdminIndex = 0;
    self.players = [
      { name: "Lemon", role:"SysAdmin", employeeNumber:1, score:0  },
      { name: "Carlos", role:"employee", employeeNumber:2, score:0  },
      { name: "Pablo", role:"employee", employeeNumber:3, score:0  }
    ];
    self.maxRounds = 6;
    self.round.phase = "choose rules";
    self.definePossibleChallenges();
    */

    /////////////////////////////////////////////
    // FAKE AN EMPLOYEE
    /*
    self.my.role = "employee";
    self.my.name = "Lemon";
    self.my.playerIndex = 0;
    self.currentlyInGame = true;
    self.round.number = 1;
    self.round.sysAdminIndex = 1;
    self.players = [
      { name: "Lemon", role:"employee", employeeNumber:1, score:0  },
      { name: "Carlos", role:"SysAdmin", employeeNumber:2, score:0  },
      { name: "Pablo", role:"employee", employeeNumber:3, score:0  }
    ];
    self.maxRounds = 6;
    self.round.phase = "choose rules";
  
    self.definePossibleChallenges();

    self.round.phase = "create password";
    self.round.challenge = {"id":29,"name":"Periodic Table of Elements","nameAsRule":"Your password must be an element on the Periodic Table.","failedMessage":"[PASS]? Next you'll tell me unobtanium is real. Try again.","possible":["ACTINIUM","ALUMINUM","AMERICIUM","ANTIMONY","ARGON","ARSENIC","ASTATINE","BARIUM","BERKELIUM","BERYLLIUM","BISMUTH","BOHRIUM","BORON","BROMINE","CADMIUM","CALCIUM","CALIFORNIUM","CARBON","CERIUM","CESIUM","CHLORINE","CHROMIUM","COBALT","COPPER","CURIUM","DARMSTADTIUM","DUBNIUM","DYSPROSIUM","EINSTEINIUM","ERBIUM","EUROPIUM","FERMIUM","FLOURINE","FRANCIUM","GADOLINIUM","GALLIUM","GERMANIUM","GOLD","HAFNIUM","HASSIUM","HELIUM","HOLMIUM","HYDROGEN","INDIUM","IODINE","IRIDIUM","IRON","KRYPTON","LANTHANUM","LAWRENCIUM","LEAD","LITHIUM","LUTETIUM","MAGNESIUM","MANGANESE","MEITNERIUM","MENDELEVIUM","MERCURY","MOLYBDENUM","NEODYMIUM","NEON","NEPTUNIUM","NICKEL","NIOBIUM","NITROGEN","NOBELIUM","OGANESSON","OSMIUM","OXYGEN","PALLADIUM","PHOSPHORUS","PLATINUM","PLUTONIUM","POTASSIUM","PRASEODYMIUM","PROMETHIUM","PROTACTINIUM","RADIUM","RADON","RHENIUM","RHODIUM","ROENTGENIUM","RUBIDIUM","RUTHENIUM","RUTHERFORDIUM","SAMARIUM","SCANDIUM","SEABORGIUM","SELENIUM","SILICON","SILVER","SODIUM","STRONTIUM","SULFUR","TANTALUM","TECHNETIUM","TELLURIUM","TERBIUM","THALLIUM","THORIUM","THULIUM","TIN","TITANIUM","TUNGSTEN","UNUNBIUM","UNUNHEXIUM","UNUNQUADIUM","UNUNSEPTIUM","UNUNTRIUM","URANIUM","VANADIUM","XENON","YTTERBIUM","YTTRIUM","ZINC","ZIRCONIUM"]};
    self.round.bugs = ["FART"];
    self.round.rules = [{"type":"Set A Minimum","message":"Your password must be more than 5 characters","inputValue":6,"inputValueTwo":null}];
    */

    /////////////////////////////////////////////
    // FAKE A PLAYER IN THE FINAL ROUND.
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
      { pw: "GORO", name: "Lemon", playerIndex:1, claimed: false },
      { pw: "MILEENA", name: "Pablo", playerIndex:2, claimed: false },
      { pw: "KITANA", name: "Lemon", playerIndex:1, claimed: false },
      { pw: "KANO", name: "Pablo", playerIndex:2, claimed: false },
    ];
    self.roundSummary = [
      { challenge: "Top 100 SNES Games",
        rules: [
          { type: "Ban A Letter", inputValue: "D" },
          { type: "Ban A Letter", inputValue: "S" },
        ]
      },
      { challenge: "Human Organs",
      rules: [
        { type: "Set A Maximum", inputValue: 15 },
        { type: "Limit Vowels", inputValue: 6 },
        { type: "Ban A Combo", inputValue: "O", inputValueTwo:"U" },
      ]
      },
      { challenge: "Classic Board Games",
        rules: [
          { type: "Ban A Combo", inputValue: "E", inputValueTwo:"S" },
          { type: "Ban A Letter", inputValue: "E" },
        ]
      },
      { challenge: "Periodic Table of Elements",
        rules: [
          { type: "Demand A Letter", inputValue: "I" },
          { type: "Set A Maximum", inputValue: 12 },
        ]
      },
      { challenge: "Types of Cookies",
        rules: [
          { type: "Demand A Letter", inputValue: "I" },
          { type: "Set A Minimum", inputValue: 6 },
        ] 
      },


    ];
    self.startCountdownToFinalRound();
    */
    
    /////////////////////////////////////////////
    // FAKE A GAME OVER SCREEN.
    /*
    self.my.role = "employee";
    self.my.name = "Lemon";
    self.my.playerIndex = 0;
    self.currentlyInGame = true;
    self.players = [
      { name: "Lemon", role:"employee", employeeNumber:1, score:118  },
      { name: "Boots", role:"SysAdmin", employeeNumber:2, score:320  },
      { name: "Sanguinary Novel", role:"employee", employeeNumber:3, score:212  },
      { name: "Bunnybread", role:"employee", employeeNumber:5, score:-40  },
      { name: "Achilles' Heelies", role:"employee", employeeNumber:99, score:131  },
      { name: "Victor Laszlo", role:"employee", employeeNumber:8, score:0  },
    ];
    self.round.phase = "GAME OVER";
    
    self.roundSummary = [
      { 
        challenge: "Top 100 SNES Games",
        sysAdmin: "Lemon",
        rules: [
          { message: "You may not use the letter R", },
          { message: "Before entering a password, you must type SWORDFISH", },
          { message: "You may not use the letter A and I together", },
        ],
        bugs: [
          "SONIC", "MARIO", "WARIO"
        ],
        attempts: [
          { playerIndex: 1, pwAttempt: "DSHJDKSHK", result: "failed" },
          { playerIndex: 2, pwAttempt: "CALL OF DUTY", result: "failed" },
          { playerIndex: 3, pwAttempt: "ALADDIN", result: "success" },
          { playerIndex: 4, pwAttempt: "MORTAL KOMBAT", result: "failed" },
          { playerIndex: 1, pwAttempt: "SUPER MARIO WORLD", result: "success" },
          { playerIndex: 2, pwAttempt: "SONIC", result: "crash" },
        ],
        listSource: ""
      },
      { 
        challenge: "2000's US One-Hit Wonders",
        sysAdmin: "Boots",
        rules: [
          { message: "You must use the letter D", },
          { message: "The maximum letters allowed is 10", },
          { message: "You may not use the letter A and I together", },
        ],
        bugs: [
          "EVERYTHING BUT THE GIRL"
        ],
        attempts: [
          { playerIndex: 0, pwAttempt: "SEMISONIC", result: "success" },
          { playerIndex: 2, pwAttempt: "EVENESENCE", result: "failed" },
          { playerIndex: 2, pwAttempt: "EVANASANCE", result: "failed" },
          { playerIndex: 3, pwAttempt: "HANSON", result: "success" },
          { playerIndex: 4, pwAttempt: "MORTAL KOMBAT", result: "failed" },
          { playerIndex: 2, pwAttempt: "LIT", result: "success" },
        ]
      },
      { 
        challenge: "Gemstones Used in Jewelry",
        sysAdmin: "Sanguinary Novel",
        rules: [],
        bugs: [
          "RUBY", "SAPPHIRE", "PEARL", "DIAMOND", "GARNET", "OPAL", "ONYX"
        ],
        attempts: [
          { playerIndex: 5, pwAttempt: "RUBY", result: "crash" },
        ],
        listSource:"https://www.antiquejewellerycompany.com/gemstone-guide/"
      },
      { 
        challenge: "Football Teams",
        sysAdmin: "Bunnybread",
        rules: [
          { message: "You may not use the letter R", },
          { message: "You must use the letter A", },
          { message: "You may not use the letter O", },
        ],
        attempts: [
          { playerIndex: 1, pwAttempt: "RAVENS", result: "failed" },
          { playerIndex: 2, pwAttempt: "BADGERS", result: "failed" },
          { playerIndex: 0, pwAttempt: "PIRATES", result: "failed" },
          { playerIndex: 4, pwAttempt: "PACKERS", result: "failed" },
          { playerIndex: 4, pwAttempt: "PACKERS?", result: "failed" },
          { playerIndex: 5, pwAttempt: "COLTS", result: "failed" },
          { playerIndex: 4, pwAttempt: "PACKERS?", result: "failed" },
          { playerIndex: 5, pwAttempt: "COLTS", result: "failed" },
        ]
      },
      { 
        challenge: "Top 100 SNES Games",
        sysAdmin: "Achilles' Heelies",
        rules: [
          { message: "You may not use the letter R", },
          { message: "Before entering a password, you must type SWORDFISH", },
          { message: "You may not use the letter A and I together", },
        ],
        bugs: [
          "SONIC", "MARIO", "WARIO"
        ],
        attempts: [
          { playerIndex: 1, pwAttempt: "DSHJDKSHK", result: "failed" },
          { playerIndex: 2, pwAttempt: "CALL OF DUTY", result: "failed" },
          { playerIndex: 3, pwAttempt: "ALADDIN", result: "success" },
          { playerIndex: 4, pwAttempt: "MORTAL KOMBAT", result: "failed" },
          { playerIndex: 1, pwAttempt: "SUPER MARIO WORLD", result: "success" },
          { playerIndex: 2, pwAttempt: "SONIC", result: "crash" },
        ]
      },
      { 
        challenge: "Top 100 SNES Games",
        sysAdmin: "Victor Laszlo",
        rules: [
          { message: "You may not use the letter R", },
          { message: "Before entering a password, you must type SWORDFISH", },
          { message: "You may not use the letter A and I together", },
        ],
        attempts: [
          { playerIndex: 1, pwAttempt: "DSHJDKSHK", result: "failed" },
          { playerIndex: 2, pwAttempt: "CALL OF DUTY", result: "failed" },
          { playerIndex: 3, pwAttempt: "ALADDIN", result: "success" },
          { playerIndex: 4, pwAttempt: "MORTAL KOMBAT", result: "failed" },
          { playerIndex: 1, pwAttempt: "SUPER MARIO WORLD", result: "success" },
          { playerIndex: 2, pwAttempt: "SONIC", result: "crash" },
        ]
      }
    ];
    self.allEmployeePasswords = [
      { pw: "SCORPION", name: "Lemon", playerIndex:0, claimed: false },
      { pw: "RAIDEN", name: "Sanguinary Novel", playerIndex:2, claimed: true },
      { pw: "GORO", name: "Boots", playerIndex:1, claimed: false },
      { pw: "MILEENA", name: "Sanguinary Novel", playerIndex:2, claimed: true },
      { pw: "KITANA", name: "Boots", playerIndex:1, claimed: false },
      { pw: "KANO", name: "Bunnybread", playerIndex:4, claimed: false },
      { pw: "SIAMESE", name: "Boots", playerIndex:1, claimed: false },
      { pw: "PERSIAN", name: "Bunnybread", playerIndex:4, claimed: false }
    ];
    self.crackSummary = [
      { pw: "ALADDIN", attackerIndex: 1, victimIndex: 3 },
      { pw: "HANSON", attackerIndex: 5, victimIndex: 3 },
      { pw: "GENE", attackerIndex: 5, victimIndex: 5 },
      { pw: "AMBER", attackerIndex: 4, victimIndex: 0 },
      { pw: "SUGAR COOKIE", attackerIndex: 4, victimIndex: 2 },
      { pw: "AMBER", attackerIndex: 0, victimIndex: 0 },
      { pw: "TAMBLYN", attackerIndex: 0, victimIndex: 0 },
      { pw: "DIPPER", attackerIndex: 3, victimIndex: 1 },
      { pw: "SOMALI", attackerIndex: 2, victimIndex: 3 },
      { pw: "FART", attackerIndex: 4, victimIndex: 1 },
    ];
    ///////////////////////////////////////////////
    */

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