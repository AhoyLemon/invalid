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
    h1: 'It works.',
    celebs: allValues,
    isDragging: false,
    round: {
      compareThree: [],
      leftSide: [],
      rightSide: [],
      correctSide: [],
      orderConfirmed: false,
      guessValueIndex: -1,
      valueGuessed: false
    },
    ui: {
      valueGuess: 0
      
    }

  },

  methods: {
    compareThreeCelebs() {
      const self = this;

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
    
      //let sortedCelebs = celebs;
      //let randomCelebs = shuffle(celebs);
      //let sortedCelebs = self.sortByValue(celebs);


      self.round.leftSide = [...shuffle(celebs)];
      self.round.correctSide = [...shuffle(celebs)];
      self.round.correctSide = self.sortByValue(self.round.correctSide);
      self.round.guessValueIndex = randomNumber(0,2);

    },

    dollars(amount) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      });
      return formatter.format(amount);
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
      self.round.orderConfirmed = true;
      if (self.round.guessValueIndex != 2) {
        const i = (self.round.guessValueIndex + 1);
        self.ui.valueGuess = (self.round.correctSide[i].value + 1);
      }

      let correctAnswers = 0;
      self.round.correctSide.forEach((cameo,index) => {
        if (cameo.slug == self.round.rightSide[index].slug) {
          correctAnswers++;
        }
      });
      let headline = "";
      if (correctAnswers < 1) {
        headline = "None correct!";
      } else if (correctAnswers > 2) {
        headline = "Perfect!";
      } else {
        headline = correctAnswers+" Point";
      }
      toastMessage = "Now guessing the Cameo value of "+self.round.correctSide[self.round.guessValueIndex].name;

      let instance = Vue.$toast.open(
        {
          message: "<h3>"+headline+"</h3><ul>"+toastMessage+"</ul>",
          type: "info",
          position: "bottom-right"
        }
      );
    },

    submitCameoValueGuess() {
      const self = this;
      let offBy = Math.abs(self.ui.valueGuess - self.round.correctSide[self.round.guessValueIndex].value);
      let instance = Vue.$toast.open(
        {
          message: "<h2>Off by "+offBy+"</h2><ul>",
          type: "info",
          position: "bottom-right"
        }
      );

      self.round.valueGuessed = true;
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
      } else if (!self.round.orderConfirmed) {
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