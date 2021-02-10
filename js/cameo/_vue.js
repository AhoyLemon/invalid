Vue.use(VueToast);
Vue.directive('focus', {
  // When the bound element is inserted into the DOM...
  inserted: function (el) {
    // Focus the element
    el.focus();
  }
});

var app = new Vue({
  el: '#app',
  data: {
    gameName: "cameo",
    celebs: allValues,
    isDragging: false,
    my: {
      name: "Lemon",
      score: 0
    },
    game: {
      mode: "",
      started: false
    },
    round: {
      number: 0,
      compareThree: [],
      leftSide: [],
      rightSide: [],
      correctSide: [],
      guessValueIndex: -1,
      valueGuessed: false
    },
    ui: {
      orderConfirmed: false,
      showDragHelp: false,
      valueGuess: 0,
      valueGuessMax: null,
      valueGuessMin: null,
      animateCameoIndex: 0,
      itsTimeToGuessValue: false,
      showNextRoundButton: false,
    }

  },

  methods: {
    compareThreeCelebs() {
      const self = this;

      self.round.number ++;

      // Find the middle celeb.
      let possibleMiddles = self.celebs.filter(celeb => (celeb.value < 750 && celeb.value > 21));
      let middleCeleb = randomFrom(possibleMiddles);
      let middleValue = middleCeleb.value;

      // Find the most expensive celeb.
      let possibleUppers = self.celebs.filter(celeb => (celeb.value > middleValue));
      let upperCeleb = randomFrom(possibleUppers);
      let upperValue = upperCeleb.value;

      // Find the least expensive celeb.
      let possibleLowers = self.celebs.filter(celeb => (celeb.value < middleValue));
      let lowerCeleb = randomFrom(possibleLowers);
      let lowerValue = lowerCeleb.value;

      let celebs = [
        upperCeleb,
        middleCeleb,
        lowerCeleb
      ];

      self.round.leftSide = [...shuffle(celebs)];
      self.round.rightSide = [];
      self.round.correctSide = [...shuffle(celebs)];
      self.round.correctSide = self.sortByValue(self.round.correctSide);
      self.round.guessValueIndex = ( randomNumber(5,7) - 5);

      $('.list-group.unranked .cameo').addClass('off-table');
      setTimeout(function () {
        $('.list-group.unranked .cameo').addClass('off-table');
      }, 1);
      
      self.showTheGuesses();
      
    },

    dollars(amount) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      });
      return formatter.format(amount);
    },

    showTheGuesses() {
      const self = this;
      self.ui.animateCameoIndex = 0;
      var intervalId = window.setInterval(function(){
        if (self.ui.animateCameoIndex > self.round.leftSide.length) {
          self.ui.showDragHelp = true;
          clearInterval(intervalId);
        } else {
          self.showAGuessCard();
        }
      }, 1500);
    },

    sortByValue(list) {
      function compare(a, b) {
        if (a.value < b.value) { return 1; }
        if (a.value > b.value) { return -1; }
        return 0;
      }
      if (list && list.length > 1) {
        return list.sort(compare);
      } else {
        return list;
      }
    },

    submitSortOrder() {
      const self = this;
      self.ui.orderConfirmed = true;
      if (self.round.guessValueIndex != 2) {
        const i = (self.round.guessValueIndex + 1);
        self.ui.valueGuess = (self.round.correctSide[i].value + 1);
      } else {
        self.ui.valueGuess = 1;
      }

      if (self.round.guessValueIndex != 0) {
        self.ui.valueGuessMax = (self.round.correctSide[(self.round.guessValueIndex -1)].value - 1);
      } else {
        self.ui.valueGuessMax = "";
      }

      if (self.round.guessValueIndex != 2) {
        self.ui.valueGuessMin = (self.round.correctSide[(self.round.guessValueIndex + 1)].value + 1);
      } else {
        self.ui.valueGuessMin = "";
      }
      
      self.ui.animateCameoIndex = 0;

      var intervalId = window.setInterval(function(){

        if (self.ui.animateCameoIndex > self.round.correctSide.length) {
          clearInterval(intervalId);
          self.ui.itsTimeToGuessValue = true;

        } else {
          self.showAnAnswerCard();
        }
      }, 1500);

      
    },

    submitCameoValueGuess() {
      const self = this;
      const n = self.round.guessValueIndex;
      let offBy = Math.abs(self.ui.valueGuess - self.round.correctSide[self.round.guessValueIndex].value);

      if (self.round.correctSide[n].value == self.ui.valueGuess) {
        self.my.score += 300;
        let instance = Vue.$toast.open(
          {
            message: "<h4>250 Points for bullseye!</h4>",
            type: "info",
            duration: 1500,
            position: "bottom-left"
          }
        );
      } else if (offBy < 50) {
        let addScore = 200 - (offBy * 4);
        if (addScore > 0) {
          self.my.score += addScore;
          let instance = Vue.$toast.open(
            {
              message: "<h4>"+addScore+" Points for being close</h4>",
              type: "info",
              duration: 1500,
              position: "bottom-left"
            }
          );
        }
      } else {
        let instance = Vue.$toast.open(
          {
            message: "<h4>Off By $"+offBy+"</h4>",
            type: "error",
            duration: 1500,
            position: "bottom-left"
          }
        );
      }

      self.round.valueGuessed = true;
      self.ui.itsTimeToGuessValue = false;

      setTimeout(function () {
        self.ui.showNextRoundButton = true;
      }, 3000);
    },

    startNextRound() {
      const self = this;
      self.clearUI();
      self.round.valueGuessed = false;
      self.round.guessValueIndex = -1;

      self.compareThreeCelebs();
      let instance = Vue.$toast.open(
        {
          message: "<h4>Round "+self.round.number+" begins...</h4>",
          type: "info",
          duration: 1500,
          position: "bottom-right"
        }
      );
    },

    showAGuessCard() {
      const self = this;
      self.ui.animateCameoIndex++;      
      $('.list-group.unranked .cameo:nth-child('+self.ui.animateCameoIndex+')').removeClass('off-table').addClass('animate__animated animate__bounceInUp');
      setTimeout(function () {
        $('.list-group.unranked .cameo:nth-child('+self.ui.animateCameoIndex+')').removeClass('animate__animated animate__bounceInUp');
      }, 1000);
    },

    showAnAnswerCard() {
      const self = this;
      self.ui.animateCameoIndex++;
      let n = (self.ui.animateCameoIndex -1);
      $('.list-group.correct .cameo:nth-child('+self.ui.animateCameoIndex+')').removeClass('off-table').addClass('animate__animated animate__zoomInUp');

      setTimeout(function () {
        $('.list-group.guessed.ranked .cameo:nth-child('+self.ui.animateCameoIndex+')').addClass('colorized');
        if (self.round.rightSide[n] && self.round.correctSide[n]) {
          if (self.round.rightSide[n].slug == self.round.correctSide[n].slug) {
            self.my.score += 100;
            let instance = Vue.$toast.open(
              {
                message: "<h4>100 Points for "+self.round.rightSide[n].name+"</h4>",
                type: "info",
                duration: 1500,
                position: "bottom-left"
              }
            );
          }
        }
      }, 1000);
    },

    clearUI() {
      const self = this;
      self.ui.orderConfirmed = false;
      self.ui.showDragHelp = false;
      self.ui.valueGuess = 0;
      self.ui.valueGuessMax =  null;
      self.ui.valueGuessMin =  null;
      self.ui.animateCameoIndex =  0;
      self.ui.itsTimeToGuessValue =  false;
      self.ui.showNextRoundButton = false;
    }




  },

  computed: {
    dragOptions() {
      return {
        animation: 0,
        group: "description",
        //disabled: !this.editable,
        ghostClass: "ghost"
      };
    },
    computedGuessingPhase() {
      const self = this;
      if (self.round.leftSide.length > 0 || self.round.rightSide.length < 3) {
        return "sort";
      } else if (!self.ui.orderConfirmed) {
        return "submit";
      } else if (!self.round.valueGuessed) {
        return "answers";
      } else {
        return "finished";
      }
    },
  },

  mounted: function() {
    const self = this;
    self.compareThreeCelebs();
  }

});