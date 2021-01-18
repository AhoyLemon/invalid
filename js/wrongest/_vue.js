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
    gameOver: false,
    maxRounds: 0,
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
      phase: "",
      number: 0,
      dealerIndex: -1,
      activePlayerIndex: -1,
      playerPresenting: false,
      presentationTimer: undefined,
      presentationTimeLeft: settings.timeToPresent,
      cardsPresented: [],
      votesSubmitted: 0
    },
    ui: {
      nameEntered: false,
      upVoteIndex: -1,
      downVoteIndex: -1,
      iVoted: false,
    },
    statementHistory: [],
    voteHistory: [],

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
        score: 0
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
        gameStarted: self.gameStarted,
        roundNumber: self.round.number
      });
    },

    startTheGame() {
      const self = this;
      let d = shuffle(fPlusDeck.cards);
      self.gameDeck.cards = d;
      self.dealOutCards();

      if (self.computedPlayerCount == 3) {
        self.maxRounds = 6;
      } else {
        self.maxRounds = self.computedPlayerCount;
      }

      socket.emit('startTheGame', {
        roomCode: self.roomCode,
        players: self.players,
        gameDeck: self.gameDeck,
        maxRounds: self.maxRounds
      });
    },

    ////////////////////////////////////////
    // In Game
    dealOutCards() {
      const self = this;
      self.players.forEach(function(player, index) {
        self.players[index].card = self.gameDeck.cards[0];
        self.gameDeck.cards.shift();
      });
    },

    sendGameDeck() {
      socket.emit('sendGameDeck', {
        roomCode: self.roomCode,
        gameDeck: self.gameDeck
      });
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

    presentationFinished() {
      const self = this;
      socket.emit('donePresenting', {
        roomCode: self.roomCode,
        activePlayerIndex: self.round.activePlayerIndex,
        activePlayerName: self.players[self.round.activePlayerIndex].name,
        activePlayerCard: self.players[self.round.activePlayerIndex].card
      });
    },

    /////////////////////////////////////////
    // Voting
    startVoting() {
      const self = this;
      socket.emit('startVoting', {
        roomCode: self.roomCode,
        cardsPresented: self.round.cardsPresented
      });
    },

    voteUp(index) {
      const self = this;
      self.ui.upVoteIndex = index;
      if (self.ui.downVoteIndex == index) {
        self.ui.downVoteIndex = -1;
      }
    },

    voteDown(index) {
      const self = this;
      self.ui.downVoteIndex = index;
      if (self.ui.upVoteIndex == index) {
        self.ui.upVoteIndex = -1;
      }
    },

    submitVotes() {
      const self = this;
      socket.emit('submitVotes', {
        roomCode: self.roomCode,
        votingPlayerIndex: self.my.playerIndex,
        votingPlayerName: self.my.name,
        downVoteIndex: self.ui.downVoteIndex,
        upVoteIndex: self.ui.upVoteIndex,
      });
      self.ui.iVoted = true;
    },

    startNextRound() {
      const self = this;
      self.players.push(self.players.shift());
      self.round.number += 1;
      self.dealOutCards();
      const s = self.statementHistory.concat(self.round.cardsPresented);
      self.statementHistory = s;
      socket.emit('startNextRound', {
        roomCode: self.roomCode,
        players: self.players,
        gameDeck: self.gameDeck,
        statementHistory: self.statementHistory,
        roundNumber: self.round.number
      });
    },

    ////////////////////////////////////////
    // Timers
    startPresentationTimer() {
      const self = this;
      self.round.presentationTimeLeft = settings.timeToPresent;

      self.round.presentationTimer = setInterval(() => {
        self.round.presentationTimeLeft -= 0.05;
        if (self.round.presentationTimeLeft <= 0) {
          if (self.computedAmIPresenting) {
            self.presentationFinished();
          }
        }
      }, 50);
  
    },

    resetPresentationTimer() {
      const self = this;
      clearInterval(self.round.presentationTimer);
      self.round.presentationTimer = undefined;
      self.round.presentationTimeLeft = settings.timeToPresent;
    },

    cardText(txt) {
      const self = this;
      if (self.gameStarted && self.computedAmIPresenting) {
        let t = txt.replace('{','<span class="secret-text">').replace('}','</span>');
        return t;
      } else if (self.round.phase == "presenting" && (self.round.activePlayerIndex < self.my.playerIndex)) {
        return txt.replace(/\{.*?\}/, "...");
      } else {
        return txt.replace('{','').replace('}','');
      }
    },

    /*
    playerScoreHTML(n) {
      if (n == 0) {
        return '<span class="num">0</span>';
      } else if (n > 0) {
        return '<sup>+</sup><span class="num">'+n+'</span>';
      } else if (n < 0) {
        return '<sup>-</sup><span class="num">'+Math.abs(n)+'</span>';
      } else {
        return "ERROR";
      }
    }
    */

    /*

    playerClasses(player,index) {
      const self = this;
      let classOutput = "";
      
      if (my.playerIndex == index) {
        classOutput += " is-you";
      }
      if (self.round.activePlayerIndex == index && self.round.playerPresenting) {
        classOutput += " presenting";
      }
      if (index <= self.round.activePlayerIndex && !self.round.playerPresenting) {
        classOutput += " already-went";
      }
      if ((self.round.activePlayerIndex + 1) == index && !self.round.playerPresenting) {
        classOutput += " up-next";
      }
      return classOutput;
    }
    */

  },

  computed: {

    computedPlayerCount() {
      const self = this;
      if (self.players && self.players.length >= 0) {
        return (self.players.length);
      } else {
        return 0;
      }
    },

    computedCanIAdvanceTheGame() {
      const self = this;

      if (self.round.phase == 'presenting') {
        if ((self.round.activePlayerIndex + 1) == self.my.playerIndex && !self.round.playerPresenting) {
          // I'm next to play, I see a button.
          return true;
        } else if (self.my.playerIndex == 0 && (self.players.length == (self.round.activePlayerIndex + 1)) && !self.round.playerPresenting) {
          // It's time to vote, and I'm the first player.
          return true;
        } else {
          return false;
        }
      } else if (self.round.phase == 'voting') {
        if (self.my.playerIndex == 0 && (self.round.votesSubmitted >= self.computedPlayerCount)) {
          return true;
        } else {
          return false;
        }
      }
      return false;
    },

    computedAmIPresenting() {
      const self = this;
      if (self.round.playerPresenting == true && (self.round.activePlayerIndex == self.my.playerIndex)) {
        return true;
      } else {
        return false;
      }
    },

    computedAreAllVotesCast() {
      const self = this;
      if (self.round.votesSubmitted >= self.computedPlayerCount) {
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
    },

    computedPlayersByScore() {
      const self = this;
      const computedPlayers = [...self.players];
      
      function compare(a, b) {
        if (a.score < b.score)
          return 1;
        if (a.score > b.score)
          return -1;
        return 0;
      }
      
      return computedPlayers.sort(compare);
    },

    computedStatementsByScore() {
      const self = this;
      const computedStatements = [...self.statementHistory];
      
      function compare(a, b) {
        if (a.score < b.score)
          return 1;
        if (a.score > b.score)
          return -1;
        return 0;
      }
      
      let sortedListAll = computedStatements.sort(compare);
      let leastWrongList = sortedListAll.filter(statement => statement.score >= sortedListAll[0].score);
      let wrongestList = sortedListAll.filter(statement => statement.score <= sortedListAll[(sortedListAll.length - 1)].score);

      return {
        wrongest: wrongestList,
        leastWrong: leastWrongList,
        all: sortedListAll
      };

    },

    /*
    computedTheWrongestWords() {
      const self = this;
      if (!self.computedStatementsByScore) {
        return null;
      } else {
        const computedStatements = [...self.computedStatementsByScore];
        return computedStatements.filter(statement => statement.score >= computedStatements[0].score);
      }
    }
    */
  },

  mounted: function() {
    const self = this;
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
      self.roomCode = urlParams.get('room').toUpperCase();
    }
    self.startPresentationTimer();


    /////////////////////////////////////
    // Fake a Game Over
    /*
    self.inRoom = true;
    self.gameStarted = true;
    self.gameOver = true;
    self.round.phase = "GAME OVER";
    self.players = [{"name":"Four","socketID":"amu153xNcGNFYbrNAAAZ","card":"Clowns are {sexy.}","score":2},{"name":"One","socketID":"H3VJpdzS0oFvU2KnAAAT","card":"Laura Ingalls Wilder is {God.}","score":4},{"name":"Two","socketID":"Q0Jb1qZaIjel8a3iAAAV","card":"Ice is the {natural enemy of} bottled water.","score":-4},{"name":"Three","socketID":"d-BI3QtAXf0XxMTuAAAX","card":"Women were {made to be} spanked by men.","score":-2}];
    self.statementHistory = [{"card":"{Man used to live} for hundreds of years disease free.","playerIndex":0,"playerName":"One","score":0},{"card":"Jelqing (manually wringing blood into your penis) {is positively REQUIRED just prior to sex.}","playerIndex":1,"playerName":"Two","score":0},{"card":"The first polio vaccine, the Salk vaccine{, was a total disaster}.","playerIndex":2,"playerName":"Three","score":-3},{"card":"{It is legal to} post nude photos of someone without their consent.","playerIndex":3,"playerName":"Four","score":3},{"card":"It's almost impossible to quit {giving yourself wedgies.}","playerIndex":0,"playerName":"Two","score":-1},{"card":"The inner penis {is before} the outer penis of course.","playerIndex":1,"playerName":"Three","score":-1},{"card":"There is no difference between night dreams and daytime dreams {except about elephant.}","playerIndex":2,"playerName":"Four","score":1},{"card":"{Leonardo DiCaprio's salary} is bankrupting America.","playerIndex":3,"playerName":"One","score":1},{"card":"The Latino people have never had {a revolution.}","playerIndex":0,"playerName":"Three","score":3},{"card":"I was having sex with my ladyfriend {and we're both prego.}","playerIndex":1,"playerName":"Four","score":-3},{"card":"We don't know how to make fat people {into thin people or how to make thin people into fat people.}","playerIndex":2,"playerName":"One","score":0},{"card":"No one on Earth is {gay.}","playerIndex":3,"playerName":"Two","score":0}];
    */
  }


});