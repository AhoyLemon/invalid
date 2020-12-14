var app = new Vue({
  el: '#app',
  data: {
    rules: rules,
    my: {
      rulebux: 6,
      passwordAttempts: 0
    },
    players: [
      {
        name: 'Lemon',
        score: 0,
        employeeNumber: employeeNumberSeed + 1,
      },
      {
        name: 'Pablo',
        score: 0,
        employeeNumber: employeeNumberSeed + 2,
        attempts: 0
      },
      {
        name: 'Carlos',
        score: 0,
        employeeNumber: employeeNumberSeed + 3
      },
      {
        name: 'Anna',
        score: 0,
        employeeNumber: employeeNumberSeed + 4
      },
      {
        name: 'Meredith',
        score: 0,
        employeeNumber: employeeNumberSeed + 5
      },
      {
        name: 'Lindsay',
        score: 0,
        employeeNumber: employeeNumberSeed + 6
      },
    ],
    round: {
      phase: 'choose rules',
      number: 1,
      challenge: challenges[0],
      rules: [],
      bugs: [],
      possibleAnswerCount: challenges[0].possible.length,
      averageSize: 0,
      averageVowels: 0,
      maxOffset: 2,
      minOffset: 2,
      vowelOffset: 1,
      elapsedTime: 0,
      timer: undefined
    },
    ui: {
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
    }
  },

  methods: {
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

      self.round.challenge.possible.forEach(function(possibility) {
        if (attempt.toUpperCase() == possibility.toUpperCase()) {
          return true;
        }
      });
      return false;
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
        alert('the system crashed, the round is over');
      } else if (failCheck) {
        // you failed. I have nothing to add here, beacuse you're already seeing why you failed.
      } else if (correctAnswer) {

        // YOU GOT IT, FUCKO
        self.players[1].score += 100;
        self.players[1].score += 20;
        self.stopTimer();
        self.resetTimer();

        alert('at this point, I need to turn '+self.players[1].name+' into '+self.players[2].name);
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
    }

  },

  computed: {

  },

  mounted: function() {
    const self = this;
    self.findAverageSize();
    self.findAverageVowelCount();
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