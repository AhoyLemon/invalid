var app = new Vue({
  el: '#app',
  data: {
    rules: rules,
    my: {
      rulebux: 6
    },
    round: {
      number: 1,
      challenge: challenges[0],
      rules: [],
      possibleAnswerCount: challenges[0].possible.length,
      averageSize: 0,
      averageVowels: 0,
      maxOffset: 2,
      minOffset: 2,
      vowelOffset: 1
    },
    ui: {
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
        r.message = 'You may not use the letters ' +  r.inputValue + ' and ' + r.inputValueTwo + " together";
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
      self.ui.currentRule.cost = 0;
      self.ui.currentRule.editing = false;
    },

    findPossibleRightAnswers() {
      const self = this;

      let possibleAnswerCount = 0;
      self.round.challenge.possible.forEach(function(p) {

        // Set the possibility to uppercase and give it a default state of OK.
        const possibility = p.toUpperCase();
        let possibilityFailed = false;

        // Go through each of the rules and try to fail the possibility.
        self.round.rules.forEach(function(r) {

          if (r.type == "Ban A Letter") {
            if (possibility.includes(r.inputValue)) {
              possibilityFailed = true;
            }
          } else if (r.type == "Demand A Letter") {
            if (!possibility.includes(r.inputValue)) {
              possibilityFailed = true;
            }
          } else if (r.type == "Set A Maximum") {
            if (possibility.length > r.inputValue) {
              possibilityFailed = true;
            }
          } else if (r.type == "Set A Minimum") {
            if (possibility.length < r.inputValue) {
              possibilityFailed = true;
            }
          } else if (r.type == "Limit Vowels") {
            let vowelCount = 0;
            let matchingInstances = possibilities[i].match(/[aeiou]/gi);
            if (matchingInstances) {
              vowelCount = matchingInstances.length;
            }
            if (vowelCount > r.inputValue) {
              possibilityFailed = true;
            }
          } else if (r.type == "Limit Vowels") {
            if (possibility.includes(r.inputValue) && possibility.includes(r.inputValue)) {
              possibilityFailed = true;
            }
          }

        });
        if (!possibilityFailed) {
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
  }

});
