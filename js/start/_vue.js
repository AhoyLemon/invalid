var app = new Vue({
  el: '#app',
  data: {
    roomCode: "",
    gameChoice: ""
  },

  methods: {
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
      const url = new URL(window.location + "" + self.gameChoice + "?create");
      //alert(url);
      location.assign(url);
      
    },
    joinRoom() {
      const self = this;
      const url = new URL(window.location + "" + self.gameChoice + "?join");
      location.assign(url);
    }
  },

  computed: {

  },

  mounted: function() {

  }

});