var app = new Vue({
  el: '#app',
  data: {
    roomCode: "SIMONE",
    isRoomHost: true,
    players: [],
    gameStarted: false,
    my: {
      name: 'Poopy Butt Jr.'
    },
    round: {
      askerName: "Simone",
      question: "",
      questionAsked: false,
      questionAnswered: false
    },
    ui: {
      nameEntered: false
    }
  },


  methods: {
    startTheGame() {

    },
    askMyQuestion() {
      const self = this;
      self.round.questionAsked = true;
    },
    answerTheQuestion() {
      const self = this;
      self.round.questionAnswered = true;
    }
  },

  computed: {

  },

  mounted: function() {

  }

});
