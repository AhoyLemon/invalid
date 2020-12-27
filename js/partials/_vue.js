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
      adminTimeleft: defaults.adminTimeleft,
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
      }
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
      pubnub.subscribe({
        channels: [self.roomCode],
        withPresence: true
      });
      self.isRoomHost = true;
      self.currentlyInGame = true;
      self.round.phase = "pregame";
      const url = new URL(window.location);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);
    },

    joinRoom() {
      const self = this;

      pubnub.subscribe({
        channels: [self.roomCode],
        withPresence: true
      });
      self.currentlyInGame = true;
      self.round.phase = "pregame";
      const url = new URL(window.location);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);
    },


    /////////////////////////////////////////////////////////////////////
    // BEFORE GAME (game hasn't started yet)


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
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'updatePlayers',
          data: {
            players: self.players
          }
        },
      });
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
        self.maxRounds = 4;
      } else if (self.players.length == 3) {
        self.maxRounds = 6;
      } else {
        self.maxRounds = self.players.length;
      }

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
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'updatePasswordChallenge',
          data: {
            challenge: self.round.challenge
          }
        },
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
        
        // Inform the other players.
        pubnub.publish({
          channel : self.roomCode,
          message : {
            type: 'updatePasswordRules',
            data: {
              rules: self.round.rules
            }
          },
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


      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'updateBugs',
          data: {
            bugs: self.round.bugs
          }
        },
      });
    },

    onboardEmployees() {
      const self = this;
      self.resetAdminTimer();
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'startGuessing',
          data: {
            sysAdminIndex: self.my.playerIndex
          }
        },
      });
    },

    // TIMERS:
    // The guessing has begun.
    startAdminTimer() {
      const self = this;
      self.round.adminTimer = setInterval(() => {
        self.round.adminTimeleft -= 0.05;
        if (self.round.adminTimeleft <= 0) {
          self.onboardEmployees();
        }
      }, 50);
    },

    resetAdminTimer() {
      const self = this;
      clearInterval(self.round.adminTimer);
      self.round.adminTimer = undefined;
      self.round.adminTimeleft = defaults.adminTimeleft;
    },


    roundStartTimer() {
      const self = this;
      self.round.roundTimer = setInterval(() => {
        self.round.elapsedTime += 1;
        self.players[self.round.sysAdminIndex].score += 1;
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
      self.round.hurryTime = 10;
    },

    endTheGuessingRound() {
      const self = this;
      pubnub.publish({
        channel : self.roomCode,
        message : {
          type: 'roundOver'
        },
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
          if (possibility.length < r.inputValue) {
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
      } else if (correctAnswer) {
        self.passwordSuccess(attempt);
      } else {
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
    },


    startNextRoundClicked() {
      const self = this;
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
    }

  },

  computed: {

    computedSysAdminName() {
      const self = this;
      return self.players[self.round.sysAdminIndex].name;
    },
    computedSysAdminIndex() {
      const self = this;
      return self.round.sysAdminIndex;
    }

  },

  mounted: function() {
    const self = this;
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
      self.roomCode = urlParams.get('room');

      // Commented out autojoin stuff while in testing.
      /*
      self.currentlyInGame = true;
      self.round.phase = "pregame";

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
      { name: "Carlos", role:"SysAdmin", employeeNumber:2, score:0  },
      { name: "Lemon", role:"employee", employeeNumber:1, score:0  }
    ];
    self.ui.passwordSucceded = true;
    self.ui.roundOver = true;
    self.startHurryTimer();
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