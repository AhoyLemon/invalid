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
    roomCode: "",
    isRoomHost: false,
    inRoom: false,
    gameStarted: false,
    my: {
      name: "",
      socketID: "",
      card: "",
      playerIndex: -1
    },
    gameDeck: {},
    players: [],
    cardsPlayed: [],
    round: {
      number: 0,
      dealerIndex: -1,
      activePlayerIndex: -1,
      playerPresenting: false,
      presentationTimer: undefined,
      presentationTimeLeft: 30
    },
    ui: {
      nameEntered: false,
    }

  },

  methods: {

    ////////////////////
    // Room Create, Room Join

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

      // Create a room with the randomly generated code.
      socket.emit('createRoom', self.roomCode);

      // Set your local variables.
      self.isRoomHost = true;
      self.inRoom = true;
      const url = new URL(window.location);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);
    },

    joinRoom() {
      const self = this;

      // Try to join a room with the entered code.
      socket.emit('joinRoom', self.roomCode);
      socket.emit('requestPlayers', self.roomCode);

      self.isRoomHost = false;
      self.inRoom = true;
      const url = new URL(window.location);
      url.searchParams.set('room', self.roomCode);
      window.history.pushState({}, '', url);

    },

    ////////////////////////////////////////
    // Pregame
    updateMyInfo() {
      const self = this;
      
      const p = {
        name: self.my.name,
        socketID: self.my.socketID,
        card: "",
      };

      // Put this player in the Player Array.
      if (!self.ui.nameEntered) {
        self.players.push(p);
      } else {
        self.my.playerIndex = -1;
        self.players.forEach(function(player, index) {
          if (player.socketID == self.my.socketID) {
            //alert('found one');
            self.players[index].name = self.my.name;
          }
        });
      }

      // find this player's playerIndex
      self.players.forEach(function(player, index) {
        if (player.socketID == self.my.socketID) {
          self.my.playerIndex = index;
        }
      });
      
      self.ui.nameEntered = true;
      self.sendPlayerUpdate();
      if (self.my.playerIndex < 0) {
        alert('WARNING: I have a player index of '+self.my.playerIndex+'! This should not happen. I am a bug.');
      }
    },

    sendPlayerUpdate() {
      const self = this;
      socket.emit('updatePlayers', {
        roomCode: self.roomCode,
        players: self.players,
        gameStarted: self.gameStarted
      });
    },

    startTheGame() {
      const self = this;
      let d = shuffle(fPlusDeck);
      self.gameDeck = d;
      self.shuffleAndDeal();

      socket.emit('startTheGame', {
        roomCode: self.roomCode,
        players: self.players,
        gameDeck: self.gameDeck
      });
    },

    ////////////////////////////////////////
    // In Game
    shuffleAndDeal() {
      const self = this;
      self.players.forEach(function(player, index) {
        self.players[index].card = self.gameDeck.cards[0];
        self.gameDeck.cards.shift();
      });
      self.sendPlayerUpdate();
    },

    dealCard() {
      const self = this;
      self.round.activePlayerIndex++;
      socket.emit('startPresenting', {
        roomCode: self.roomCode,
        activePlayerIndex: self.round.activePlayerIndex,
        activePlayerName: self.players[self.round.activePlayerIndex].name
      });
    },

    ////////////////////////////////////////
    // Timers
    startPresentationTimer() {
      const self = this;
      self.round.presentationTimeLeft = 30;

      self.round.presentationTimer = setInterval(() => {
        self.round.presentationTimeLeft -= 0.05;
        self.round.presentationTimeLeft = self.round.presentationTimeLeft.toFixed(2);
        if (self.round.presentationTimeLeft <= 0) {
          self.round.playerPresenting = false;
          self.resetPresentationTimer();
          self.startPresentationTimer();
        }
      }, 50);

      setTimeout(function() {
        $(".timer").knob();
      }, 1000);
  
    },

    resetPresentationTimer() {
      const self = this;
      clearInterval(self.round.presentationTimer);
      self.round.presentationTimer = undefined;
      self.round.presentationTimeLeft = 30;
    },

    cardText(txt) {
      const self = this;
      if (self.gameStarted && self.computedAmIPresenting) {
        let t = txt.replace('{','<span class="secret-text">').replace('}','</span>');
        return t;
      } else {
        return txt.replace(/\{.*?\}/, "...");
      }
      
    }

  },

  computed: {
    computedAmITheDealer() {
      const self = this;
      if (self.my.playerIndex == self.round.dealerIndex) {
        return true;
      } else {
        return false;
      }
    },

    computedAmIPresenting() {
      const self = this;
      if (self.round.playerPresenting == true && (self.round.activePlayerIndex == self.my.playerIndex)) {
        return true;
      } else {
        return false;
      }
    },

    computedDashOffset() {
      const self = this;
      let a = percentOf(self.round.presentationTimeLeft, settings.timeToPresent);
      let d = (251 - percentOf(a, 251));
      return d.toFixed(2) + 'px';
    }
  },

  mounted: function() {
    const self = this;
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
      self.roomCode = urlParams.get('room').toUpperCase();
    }
    self.startPresentationTimer();

  }


});