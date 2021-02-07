var app = new Vue({
  el: '#app',
  data: {
    h1: 'It works.',
    celebs: allValues,
    round: {
      compareThree: [
        {},
        {},
        {}
      ]
    }

  },

  methods: {
    compareThreeCelebs() {
      const self = this;


      // Find the middle celeb.
      let possibleMiddles = self.celebs.filter(celeb => (celeb.value < 750 && celeb.value > 21));
      self.round.compareThree[0] = randomFrom(possibleMiddles);
      const middleValue = self.round.compareThree[0].value;

      // Find the most expensive celeb.
      let possibleUppers = self.celebs.filter(celeb => (celeb.value > middleValue));
      self.round.compareThree[1] = randomFrom(possibleUppers);
      const upperValue = self.round.compareThree[0].value;

      // Find the least expensive celeb.
      let possibleLowers = self.celebs.filter(celeb => (celeb.value > middleValue));
      self.round.compareThree[2] = randomFrom(possibleLowers);
      const lowerValue = self.round.compareThree[2].value;

      // Shuffle the celebs.
      shuffle(self.round.compareThree);
    }
  },

  computed: {

  },

  mounted: function() {
    const self = this;
    self.compareThreeCelebs();
    
  }

});
