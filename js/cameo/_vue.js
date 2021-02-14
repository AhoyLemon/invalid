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
      name: "",
      score: 0,
      pointsEarnedInFinalRound: 0,
      correctSorts: 0,
      averageValuationOffset: 0,
      valuationOffBy: 0,
    },
    game: {
      mode: "",
      started: false,
      finalRound: false,
      over: false,
      cameoQueue: [],
      cameoValuationIndexes: [],
      availableToHire: [],
      cameoHistory: []
    },
    round: {
      number: 0,
      compareThree: [],
      leftSide: [],
      rightSide: [],
      correctSide: [],
      guessValueIndex: -1,
      valueGuessed: false,
      budget: 1000,
      spent: 0
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
      showEmailButton: false,
      showBeginFinalRoundButton: false,
      hiringFinished: false,
      countingHireIndex: 0,
      countingInterval: undefined,
      exceededBudget: false,
      cameosPaid: false,

      // TODO: Remove temp load game stuff.
      loadGameClicked: false
    }

  },

  methods: {


    startSinglePlayerGame() {
      const self = this;
      self.game.mode = "singleplayer";

      self.generateGameCelebrities();

      self.game.started = true;
      self.startNextRound();

      socket.emit('cameoStartGame', {
        gameName: self.gameName
      });

    },

    loadGame() {
      const self = this;
      self.ui.loadGameClicked = true;

      setTimeout(function () {
        self.ui.loadGameClicked = false;
      }, 7500);
    },

    generateGameCelebrities() {
      const self = this;

      // Okay, here's all the exhibition round stuff.
      let i = 0;
      
      while (i < settings.maxRounds) {
        // First, get three celebrities.
        let roundCelebs = self.returnThreeNewCelebs();

        // Check if any of them are duplicates. If none of them are, do stuff
        // (otherwise, this'll just loop again.)
        if (!self.isThisADuplicate(roundCelebs[0]) && !self.isThisADuplicate(roundCelebs[1]) && !self.isThisADuplicate(roundCelebs[2])) {
          roundCelebs.forEach((cameo) => {
            self.game.cameoQueue.push(cameo);
          });
  
          let r = randomNumber(1,30);
          if (r < 11) {
            self.game.cameoValuationIndexes.push(0);
          } else if (r < 21) {
            self.game.cameoValuationIndexes.push(1);
          } else {
            self.game.cameoValuationIndexes.push(2);
          }
          i++;
        }
      }

      self.populateFinalRound();

    },

    isThisADuplicate(x) {
      const self = this;
      if ( self.game.cameoQueue.filter(celeb => (celeb.name == x.name)).length > 0 ) {
        return true;
      } else {
        return false;
      }
    },


    returnThreeNewCelebs() {
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

      console.log(celebs[0].name);
      console.log(celebs[1].name);
      console.log(celebs[2].name);
      celebs = shuffle(celebs);
      
      //self.showTheGuesses();
      return celebs;
      
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
        self.my.valuationOffBy += 0;
        let instance = Vue.$toast.open(
          {
            message: "<h4>250 Points for bullseye!</h4>",
            type: "info",
            duration: 1500,
            position: "bottom-left"
          }
        );
        soundPerfectValue.play();
      } else if (offBy < 50) {
        let addScore = 200 - (offBy * 4);
        self.my.score += addScore;
        self.my.valuationOffBy += offBy;
        let instance = Vue.$toast.open(
          {
            message: "<h4>"+addScore+" Points for being close</h4>",
            type: "info",
            duration: 1500,
            position: "bottom-left"
          }
        );
        soundCloseValue.play();
      } else {
        self.my.valuationOffBy += offBy;
        let instance = Vue.$toast.open(
          {
            message: "<h4>Off By $"+offBy+"</h4>",
            type: "error",
            duration: 1500,
            position: "bottom-left"
          }
        );
        soundBadValue.play();
      }

      socket.emit('cameoValuationMade', {
        gameName: self.gameName,
        celeb: self.round.correctSide[self.round.guessValueIndex],
        valueGuessed: self.ui.valueGuess
      });

      self.round.valueGuessed = true;
      self.ui.itsTimeToGuessValue = false;



      if (self.round.number < settings.maxRounds) {

        setTimeout(function () {
          self.ui.showNextRoundButton = true;
        }, 3000);
        
      } else if (self.round.number >= settings.maxRounds) {
        setTimeout(function () {
          let instance = Vue.$toast.open(
            {
              message: "<h4>You have 1 new email</h4>",
              type: "info",
              duration: 1500,
              position: "bottom-right"
            }
          );
          soundNewEmail.play();
        }, 2000);
        setTimeout(function () {
          self.ui.showEmailButton = true;
        }, 3000);
      }
    },

    startNextRound() {
      const self = this;
      self.clearUI();
      self.round.valueGuessed = false;
      self.round.guessValueIndex = -1;


      //////////////////////////////////////////////////////////////
      // Let's put the answers in history (if there were any)
      if (self.round.correctSide && self.round.correctSide.length > 0) {
        self.round.correctSide.forEach((cameo,index) => {
          let c = {
            name: cameo.name,
            correct: false
          };
          if (self.round.correctSide[index].slug == self.round.rightSide[index].slug) {
            c.correct = true;
          }
          self.game.cameoHistory.push(c);
        });
      }

      // Advance round number
      self.round.number++;

      // Let's populate the left side with the queue....
      var i = 0;
      while (i < 3) {
        self.round.leftSide.push(self.game.cameoQueue.shift());
        i++;
      }
      // Empty the right side...
      self.round.rightSide = [];

      // Populate and then correctly sort the answers side...
      self.round.correctSide = [...self.round.leftSide];
      self.round.correctSide = self.sortByValue(self.round.correctSide);

      // And then figure out which one I'm valuating....
      self.round.guessValueIndex = self.game.cameoValuationIndexes[(self.round.number - 1)];

      // Hide and then show the left side...
      $('.list-group.unranked .cameo').addClass('off-table');
      setTimeout(function () {
        $('.list-group.unranked .cameo').addClass('off-table');
      }, 1);
      self.showTheGuesses();
    

      

      // Show a toast...
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
            self.my.correctSorts += 1;
            soundCorrect.play();
            let instance = Vue.$toast.open(
              {
                message: "<h4>100 Points for "+self.round.rightSide[n].name+"</h4>",
                type: "info",
                duration: 1500,
                position: "bottom-left"
              }
            );
          } else {
            soundMiss.play();
          }
        }
      }, 1000);
    },

    ////////////////////////////////////////////
    // FINAL ROUND

    showTheEmail() {
      const self = this;
      self.populateFinalRound();
      self.ui.showEmailButton = false;
      $("#EmailFromPasha").removeClass('off-screen');
      
      setTimeout(function () {

        let instance = Vue.$toast.open(
          {
            message: "<h4>"+self.dollars(self.round.budget)+" added to bank account.</h4>",
            type: "info",
            duration: 2500,
            position: "bottom-right"
          }
        );
        self.ui.showBeginFinalRoundButton = true;
      }, 5000);
    },

    beginFinalRound() {
      const self = this;
      self.round.leftSide = self.game.availableToHire;
      self.round.rightSide = [];
      self.game.finalRound = true;
    },

    populateFinalRound() {
      const self = this;
      let celebs = [...shuffle(self.celebs)];
      celebs = celebs.slice(0,10);
      self.game.availableToHire = celebs;

      let costForAll = 0;

      self.game.availableToHire.forEach((cameo,index) => {
        costForAll += cameo.value;
      });

      let avg = parseInt(costForAll / 2.5);
      if (avg > 1000) {
        self.round.budget = 1000;
      } else if (avg < 500) {
        self.round.budget = 500;
      } else {
        self.round.budget = avg;
      }
      
    },

    finishHiring() {
      const self = this;

      self.round.leftSide = [];
      self.ui.hiringFinished = true;

      self.ui.countingInterval = window.setInterval(function(){

        if (self.ui.countingHireIndex >= self.round.rightSide.length) {
          clearInterval(self.ui.countingInterval);

          let exceededBudget = "";
          if ((self.round.budget - self.round.spent) == 0) {
            exceededBudget = "yes";
          } else {
            exceededBudget = "no";
          }

          socket.emit('cameoFinishGame', {
            gameName: self.gameName,
            cameoHistory: self.game.cameoHistory,
            playerScore: self.my.score,
            correctSorts: self.my.correctSorts,
            averageValuationOffset: self.computedValuationSkill.number,
            birthdayWishes: self.round.rightSide,
            exceededBudget: exceededBudget
          });

          setTimeout(function () {
            self.game.finalRound = false;
            self.game.over = true;
            self.playTheGameOverAudio();
          }, 2000);
          
        } else {
          self.showHirePrice();
        }
      }, 3000);

    },

    showHirePrice() {
      const self = this;
      self.ui.countingHireIndex++;
      let n = (self.ui.countingHireIndex -1);
      $('.list-group.hired .cameo:nth-child('+self.ui.countingHireIndex+') .value').removeClass('invisible').addClass('animate__animated animate__bounceIn');

      setTimeout(function () {

        self.round.spent += self.round.rightSide[n].value;

        if (self.round.spent <= self.round.budget) {
          self.my.score += 100;
          self.my.pointsEarnedInFinalRound += 100;
          let instance = Vue.$toast.open(
            {
              message: "<h4>100 Points for "+self.round.rightSide[n].name+"</h4>",
              type: "info",
              duration: 1500,
              position: "bottom-left"
            }
          );
          soundUnderBudget.play();
        } else {
          if (!self.ui.exceededBudget) {
            self.my.score -= self.my.pointsEarnedInFinalRound;
            self.my.pointsEarnedInFinalRound = 0;
            let instance = Vue.$toast.open(
              {
                message: "<h2>"+self.round.rightSide[n].name+" exceeded the budget!</h2>",
                type: "error",
                duration: 1500,
                position: "bottom-left"
              }
            );
            self.ui.exceededBudget = true;
            soundOverBudget.play();
          } else {
            soundFutherOverBudget.play();
          }
        }
      }, 1000);

      setTimeout(function() {
        $('.list-group.hired .cameo:nth-child('+self.ui.countingHireIndex+')').addClass('animate__animated animate__backOutUp');
        setTimeout(function() {
          $('.list-group.hired .cameo:nth-child('+self.ui.countingHireIndex+')').addClass('display-none');
        }, 450);
      }, 2000);


    },

    playTheGameOverAudio() {
      const self = this;
      birthdayHowls = shuffle(birthdayHowls);
      let n = 0;
      let i = self.round.rightSide.length;
      soundgameOverMusic.play();
      setTimeout(function () {
        var intervalId = window.setInterval(function(){
          if (n < i) {
            birthdayHowls[n].play();
            n++;
          } else {
            clearInterval(intervalId);
          }
        }, 1000);
      }, 1200);
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
    },

    dollars(amount) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      });
      return formatter.format(amount);
    },

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
      if (self.game.finalRound) {
        if (!self.ui.hiringFinished) {
          return "hiring";
        } else {
          return "calculatingCosts";
        }
      } else {
        if (self.round.leftSide.length > 0 || self.round.rightSide.length < 3) {
          return "sort";
        } else if (!self.ui.orderConfirmed) {
          return "submit";
        } else if (!self.round.valueGuessed) {
          return "answers";
        } else if (self.round.valueGuessed && self.round.number >= settings.maxRounds) {
          return "newMail";
        } else {
          return "finished";
        }
      }
    },
    computedValuationSkill() {
      const self = this;

      if (!self.my.valuationOffBy || self.my.valuationOffBy < 1) {
        return {
          number: 0,
          rating: "Suspiciously Perfect"
        };
      } else {
        let averageValulationOffBy = parseInt(self.my.valuationOffBy / self.round.number);
        let valuationRating = "";
        if (averageValulationOffBy > 100) {
          valuationRating = "Terrible!";
        } else if (averageValulationOffBy > 90) {
          valuationRating = "Awful";
        } else if (averageValulationOffBy > 80) {
          valuationRating = "Bad";
        } else if (averageValulationOffBy > 70) {
          valuationRating = "Not Good";
        } else if (averageValulationOffBy > 60) {
          valuationRating = "Okay";
        } else if (averageValulationOffBy > 50) {
          valuationRating = "Good";
        } else if (averageValulationOffBy > 40) {
          valuationRating = "Great";
        } else if (averageValulationOffBy > 30) {
          valuationRating = "Amazing";
        } else if (averageValulationOffBy > 20) {
          valuationRating = "Spectacular";
        } else if (averageValulationOffBy > 10) {
          valuationRating = "Wonderful!";
        } else if (averageValulationOffBy > 0) {
          valuationRating = "Nearly Perfect!";
        }

        return {
          number: averageValulationOffBy,
          rating: valuationRating
        };
      }
    }
  },

  mounted: function() {
    const self = this;

    /*
    /////////////////////////////////
    // FAKE A FINAL ROUND
    self.round.number = 4;
    self.populateFinalRound();
    self.my.score = randomNumber(500,1500);
    */


    
    /*
    /////////////////////////////////
    // FAKE A GAME OVER SCREEN
    let celebs = [...shuffle(self.celebs)];

    const hiredCelebs = randomNumber(3,10);

    celebs = celebs.slice(0,hiredCelebs);
    self.round.rightSide = celebs;

    self.my.score = randomNumber(500,5000);
    self.round.spent = (hiredCelebs * 200);

    if (self.round.spent < self.round.budget) {
      self.my.pointsEarnedInFinalRound = (hiredCelebs * 100);
    }
    self.game.finalRound = false;
    self.game.over = true;
    //
    /////////////////////////////////
    */
    

  }

});