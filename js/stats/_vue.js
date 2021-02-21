var app = new Vue({
  el: '#app',
  data() {
    return {
      stats: {
        general: {},
        cameo: {},
        invalid: {},
        wrongest: {},
        celebArray: []
      },

      columns: {
        playerNames: [
          {
            label: "Player Name",
            field: "iname",
            tdClass: 'player-name-cell'
          },
          {
            label: "Played",
            field: "icount",
            type:  "number"
          },
          {
            label: "Last Played",
            field: "lastPlayed",
            tdClass: 'last-played-cell',
            //width: "100px"
          }
        ],
        celebs: [
          {
            label: "Name",
            field: "cameoName"
          },
          {
            label: "Actual Value",
            field: "actualValue",
            type:  "number",
            formatFn: this.dollars
          },
          {
            label: "Avg Value",
            field: "averageValuation",
            type:  "decimal",
            formatFn: this.dollars,
          },
          {
            label: "Market Forces",
            field: "marketForces",
            type:  "decimal",
            formatFn: this.dollars
          },
          {
            label: "Sort Score",
            field: "sortScore",
            type:  "number",
          },
          {
            label: "Birthdays",
            field: "birthdayWishes",
            type:  "number",
          },
        ],
        cameoPlayers: [
          {
            label: "Score",
            field: "playerScore",
            type:  "number"
          },
          {
            label: "Sorts",
            field: "correctSorts",
            type:  "number"
          },
          {
            label: "Value Offset",
            field: "averageValuationOffset",
            type:  "number",
            formatFn: this.dollars
          },
          {
            label: "Blew Budget",
            field: "exceededBudget",
            formatFn: this.exceededBudgetOutput
          }
        ],
        bugs: [
          {
            label: "Bug",
            field: "iname",
          },
          {
            label: "Deployed",
            field: "icount",
            type: "number"
          },
        ],
        challenges: [
          {
            label: "Challenge",
            field: "iname",
          },
          {
            label: "Played",
            field: "icount",
            type: "number"
          },
        ],
        letters: [
          {
            label: "Letter",
            field: "letter",
          },
          {
            label: "Banned",
            field: "banned",
            type: "number"
          },
          {
            label: "Demanded",
            field: "demanded",
            type: "number"
          },
        ],
        passwords: [
          {
            label: "Password",
            field: "password"
          },
          {
            label: "Challenge",
            field: "challenge",
          },
          {
            label: "Used",
            field: "used",
            type:  "number"
          },
          {
            label: "Cracked",
            field: "cracked",
            type:  "number"
          },
          {
            label: "Crashed",
            field: "crashed",
            type:  "number"
          }
        ],
        playerCounts: [
          {
            label: "Game Type",
            field: "iname",
          },
          {
            label: "Played",
            field: "icount",
            type: "number"
          },
        ],
        rules: [
          {
            label: "Rule",
            field: "iname",
          },
          {
            label: "Deployed",
            field: "icount",
            type: "number"
          },
        ],
        wrongestStatements: [
          {
            label: "Statement",
            field: "iname",
            formatFn: this.formatStatement
          },
          {
            label: "Total Score",
            field: "icount",
            type: "number"
          },
        ],
        decks: [
          {
            label: "Deck",
            field: "iname",
          },
          {
            label: "Played",
            field: "icount",
            type: "number"
          },
        ]
      },
      ui: {
        viewing: "general",
        cameoLoaded: false,
        invalidLoaded: false,
        wrongestLoaded: false
      }
    };
  },

  methods: {

    getData(game) {
      const self = this;

      if (game == "cameo") {

        axios.get('/stats/live/cameo/json')
          .then(function (response) {
            // handle success
            self.stats.cameo = response.data;
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
          .then(function () {
            // always executed

            self.stats.cameo.celebScores.forEach((celeb) => {
              if (celeb.cameoName) {
                self.stats.cameo.celebs.push({
                  cameoName: celeb.cameoName,
                  actualValue: 0,
                  sortScore: celeb.sortScore,
                  birthdayWishes: celeb.birthdayWishes,
                  valuations: 0,
                  totalValuation: 0,
                  averageValuation: 0,
                  marketForces: 0,
                });
              }
            });

            self.stats.cameo.valuations.forEach((celeb) => {
              let m = self.stats.cameo.celebs.find(element => element.cameoName == celeb.cameoName);
              if (m) {
                //console.log('match for '+celeb.cameoName);

                if (celeb.actualValue && celeb.playerValue && celeb.playerValue < 2000) {
                  if (m.actualValue == 0) {
                    m.actualValue = celeb.actualValue;
                    m.totalValuation = celeb.playerValue;
                    m.valuations = 1;
                    m.averageValuation = m.totalValuation.toFixed(2); 
                  } else if (m.actualValue) {
                    m.totalValuation += celeb.playerValue;
                    m.valuations += 1;
                    m.averageValuation = (m.totalValuation / m.valuations).toFixed(2);
                  }
                }
              } else {
                //console.log('NO MATCH FOR '+celeb.cameoName);
              }

              self.stats.cameo.celebs.forEach((celeb) => {
                celeb.marketForces = (celeb.averageValuation - celeb.actualValue);
              });

              self.ui.cameoLoaded = true;
              self.ui.viewing = "cameo";
            });
          });

      } else if (game == "invalid") {
        axios.get('/stats/live/invalid/json')
          .then(function (response) {
            // handle success
            self.stats.invalid = response.data;
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
          .then(function () {
            // always executed

            self.stats.invalid.successfulPasswords.forEach((pw) => {
              if (pw.iname) {
                self.stats.invalid.passwords.push({
                  password: pw.iname,
                  challenge: pw.challenge,
                  used: pw.icount,
                  cracked: 0,
                  crashed: 0
                });
              }
            });

            self.stats.invalid.cracks.forEach((pw) => {
              let m = self.stats.invalid.passwords.find(element => element.iname == pw.password);
              if (m) {
                m.cracked = pw.icount;
              } else {
                self.stats.invalid.passwords.push({
                  password: pw.iname,
                  challenge: "",
                  used: 0,
                  cracked: pw.icount,
                  crashed: 0
                });
              }
            });

            self.stats.invalid.crashes.forEach((pw) => {
              let m = self.stats.invalid.passwords.find(element => element.iname == pw.password);
              if (m) {
                m.crashed = pw.icount;
              } else {
                self.stats.invalid.passwords.push({
                  password: pw.iname,
                  challenge: "",
                  used: 0,
                  cracked: 0,
                  crashed: pw.icount
                });
              }
            });

            self.stats.invalid.demandedLetters.forEach((l) => {
              if (l.iname) {
                self.stats.invalid.letters.push({
                  letter: l.iname,
                  demanded: l.icount,
                  banned: 0
                });
              }
            });

            self.stats.invalid.bannedLetters.forEach((l) => {
              let m = self.stats.invalid.letters.find(element => element.letter == l.iname);
              if (m) {
                m.banned = l.icount;
              } else {
                self.stats.invalid.letters.push({
                  letter: l.iname,
                  demanded: 0,
                  banned: l.icount
                });
              }
            });





            self.ui.invalidLoaded = true;
            self.ui.viewing = "invalid";
          });
      } else if (game == "wrongest") {
        axios.get('/stats/live/wrongest/json')
          .then(function (response) {
            // handle success
            self.stats.wrongest = response.data;
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
          .then(function () {
            // always executed

            self.ui.wrongestLoaded = true;
            self.ui.viewing = "wrongest";
          });
      }
    },

    formatTime(stamp,format) {
      if (format == "fromNow") {
        return moment(stamp).subtract('6','hours').fromNow();
      } else if (format == "calendar") {
        if (moment(stamp).diff(moment(),'days') > -7) {
          return moment(stamp).subtract('6','hours').calendar();
        } else {
          return moment(stamp).subtract('6','hours').format('MMM Do @ LT');
        }
      } else if (format) {
        return moment(stamp).subtract('6','hours').format(format);
      } else {
        return moment(stamp).subtract('6','hours').format('LLLL');
      }
    },

    dollars(amount) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });

      if (amount) {
        return formatter.format(amount);
      } else {
        return "-";
      }
    },

    formatStatement(statement) {
      return statement.replace('{','').replace('}','');
    },

    exceededBudgetOutput(v) {
      if (v == "YES" || v == "NO") {
        return v;
      } else {
        return "-";
      }
    }
  },

  computed: {
    computedCameoPlayerData() {

      let cameoObject = {
        averagePoints: 0,
        averageCorrectSorts: 0,
        averageBirthdayWishes: 0,
        exceededBudget: 0,
        observedBudget: 0,
        exceededBudgetPercent: 0,
        correctSortPercent: 0,
      };

      const self = this;
      if (!self.stats.cameo.playerScores || self.stats.cameo.playerScores.length < 10) {
        return cameoObject;
      }

      let totalPoints = 0;
      let totalCorrectSorts = 0;
      let totalBirthdayWishes = 0;
      self.stats.cameo.playerScores.forEach((player) => {

        totalPoints += player.playerScore;
        totalCorrectSorts += player.correctSorts;
        totalBirthdayWishes += player.birthdayWishes;

        if (player.exceededBudget == "no") {
          // do nothing
          // This is because I screwed up early data.
        } else if (player.exceededBudget == "NO") {
          cameoObject.observedBudget++;
        } else if (player.exceededBudget == "YES") {
          cameoObject.exceededBudget++;
        }
      });

      let playerCount = self.stats.cameo.playerScores.length;
      cameoObject.averagePoints = parseInt(totalPoints / playerCount);
      cameoObject.averageCorrectSorts = parseInt(totalCorrectSorts / playerCount);
      cameoObject.averageBirthdayWishes = parseInt(totalBirthdayWishes /playerCount);


      cameoObject.exceededBudgetPercent = percentOf( (cameoObject.observedBudget + cameoObject.exceededBudget) ,cameoObject.exceededBudget);
      cameoObject.correctSortPercent = percentOf( 12, cameoObject.averageCorrectSorts );

      return cameoObject;
    },

    computedNaughtyPercentage() {
      const self = this;

      if (!self.stats.general || !self.stats.general.invalid || !self.stats.general.invalid.NaughtyModeOn) {
        return "0";
      }

      return percentOf((self.stats.general.invalid.NaughtyModeOn + self.stats.general.invalid.NaughtyModeOff), self.stats.general.invalid.NaughtyModeOn);
    },
    computedCrackedPasswordPercent() {
      const self = this;

      if (!self.stats.invalid || !self.stats.invalid.successfulPasswords || !self.stats.invalid.cracks) {
        return "0";
      }

      return percentOf(self.stats.invalid.successfulPasswords.length, self.stats.invalid.cracks.length);
    }
  },

  created: function() {
    const self = this;
    axios.get('/stats/live/general/json')
      .then(function (response) {
        // handle success
        self.stats.general = response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
  }

});
