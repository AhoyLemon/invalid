let currentPlayerNum = 0;



var app = new Vue({
  el: '#app',
  data: {
    currentlyInGame: false,
    roomCode: null,
    rules: rules,
    my: {
      employeeNumber: randomNumber(10000,99999),
      name: '',
      rulebux: 6,
      passwordAttempts: 0,
      score: 0
    },


    // Delete this whole category.
    currentPlayer: {},

    players: [],
    round: {
      phase: 'choose rules',
      number: 0,
      challenge: challenges[1],
      rules: [],
      bugs: [],
      possibleAnswerCount: challenges[1].possible.length,
      averageSize: 0,
      averageVowels: 0,
      maxOffset: 2,
      minOffset: 2,
      vowelOffset: 1,
      elapsedTime: 0,
      timer: undefined,
      crash: {
        active: false,
        word: "",
        player: []
      }
    },
    ui: {
      enterCode: {
        focus: false
      },
      addBug: '',
      addBugErrors: [],
      passwordAttempt: '',
      passwordAttemptErrors: [],
      passwordInputError: false,
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
      const url = new URL(window.location);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);
      alert('107')
    },


    /////////////////////////////////////////////////////////////////////
    // BEFORE GAME (game hasn't started yet)

    updatePlayer() {
      const self = this;
      
      //Is this a new player or a player update
      let newPlayer = true;

      /*
      self.players.forEach(function(player, index) {
        if (player.employeeNumber == app.players.employeeNumber) {
          // It's a player update, change the record
          app.players[index] = app.player;
          newPlayer = false;
        }
      });
      */
      
      // It's a new player, add that to the array.
      if (newPlayer) {
        
        const p = {
          name: self.my.name,
          employeeNumber: self.my.employeeNumber,
          score: 0
        };
        self.players.push(p);

      }

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





    ////////////////////////////////////////////////////////////////
    // SysAdmin Methods

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

      // Pay for it.
      self.my.rulebux = (self.my.rulebux - rule.cost);

      // Add it to the rule list.
      self.round.rules.push(r);

      // Clear out current rule.
      self.clearCurrentRule();

      // Recalculate Possible Right Answers.
      self.findPossibleRightAnswers();
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

    },

    onboardEmployees() {
      const self = this;
      self.round.phase = "create password";
      this.startTimer();
    },

    startTimer() {
      this.timer = setInterval(() => {
        this.round.elapsedTime += 1;
        this.players[0].score += 5;
      }, 1000);
    },
    stopTimer() {
      clearInterval(this.timer);
    },
    resetTimer() {
      this.elapsedTime = 0;
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
      const matchCheck = self.tryToFind(attempt);
      let correctAnswer = false;

      if (crashCheck) {
        self.round.phase = "crashed";

        // Set crash to true.
        self.round.crash.active = true;
        self.round.crash.player = self.players[1];
        self.round.crash.word = attempt;

        // Award the SysAdmin points and stop the timer.
        self.players[0].score += 100;
        self.stopTimer();
        self.resetTimer();

      }
      if (failCheck) {
        self.ui.passwordAttemptErrors = failCheck.reasons;
        self.ui.passwordInputError = true;
      } 
      
      if (matchCheck) {
        correctAnswer = true;
      }
      if (!matchCheck) {
        let errorMessage = self.round.challenge.failedMessage.replace("[PASS]", attempt);
        correctAnswer = false;
        self.ui.passwordAttemptErrors.push(errorMessage);
      }

      // Deal with the results of the attempt.
      self.my.passwordAttempts++;
      self.ui.passwordAttempt = '';
      if (crashCheck) {
        //alert('the system crashed, the round is over');
      } else if (failCheck) {
        // you failed. I have nothing to add here, beacuse you're already seeing why you failed.
      } else if (correctAnswer) {

        // YOU GOT IT, FUCKO
        self.players[1].score += 100;
        self.players[1].score += 20;
        self.my.score += 100;
        self.my.score += 20;

        self.stopTimer();
        self.resetTimer();

        alert('YOU WON! \n At this point, I need to turn '+self.players[1].name+' into '+self.players[2].name);

        self.passwordSuccess(attempt);
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


      // NOTE TO LEMON: Make a pressure valve here.
      // If there's too few possible answers, reject the rule.

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

    passwordSuccess(pw) {
      const self = this;
    },

    crashTheServer() {
      const self = this;
    }

    // REMOVE THIS FUNCTION. It shouldn't be necessary.
    

  },

  computed: {

    /*
    computedEnterCodePlaceholder() {
      const self = this;
      if (self.ui.enterCode.focus) {
        return 'Enter Room Code';
      } else {
        return 'Join A Room';
      }
    }
    */

  },

  mounted: function() {
    const self = this;
    self.findAverageSize();
    self.findAverageVowelCount();

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
      self.roomCode = urlParams.get('room');
    }


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


// Register a global custom directive called `v-focus`
Vue.directive('dropdown', {
  // When the bound element is inserted into the DOM...
  inserted: function (el) {
    // Focus the element
    el.select();
  }
});