var app = new Vue({
  el: '#app',
  data: {
    roomCode: "SIMONE",
    isRoomHost: true,
    players: [],
    gameStarted: false,
    my: {
      name: 'Poopy Butt Jr.'
      //name: ''
    },
    round: {
      askerName: "Simone",
      question: "What is my favorite subject in school?"
    },
    ui: {
      nameEntered: false
    }
  },


  methods: {
    startTheGame() {

    },
    askMyQuestion() {

    }
  },

  computed: {

  },

  mounted: function() {

  }

});
