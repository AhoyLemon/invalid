var app = new Vue({
  el: '#app',
  data: {
    roomCode: "",
    isRoomHost: false,
    inRoom: false,
    gameStarted: false,
    my: {
      name: "",
      socketID: ""
    },
    players: [],
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
        socketID: self.my.socketID
      };

      if (!self.ui.nameEntered) {
        self.players.push(p);
      } else {
        self.players.forEach(function(player, index) {
          if (player.socketID == self.my.socketID) {
            //alert('found one');
            self.players[index].name = self.my.name;
          }
        });
      }
      
      self.ui.nameEntered = true;
      self.sendPlayerUpdate();
    },
    sendPlayerUpdate() {
      const self = this;
      socket.emit('updatePlayers', {
        roomCode: self.roomCode,
        players: self.players,
        gameStarted: self.gameStarted
      });
    }
  },

  computed: {

  },

  mounted: function() {
    const self = this;
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
      self.roomCode = urlParams.get('room').toUpperCase();
    }
  }

});
