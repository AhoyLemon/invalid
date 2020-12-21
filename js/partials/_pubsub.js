const theChannel = 'the_guide';

const pubnub = new PubNub({
  // replace the key placeholders with your own PubNub publish and subscribe keys
  publishKey: 'pub-c-c25666ba-28d6-41ef-8c12-670fc0f40021',
  subscribeKey: 'sub-c-ba437e90-31bb-11eb-9713-12bae088af96',
  uuid: playerID
});

pubnub.addListener({

  // Any message is received.
  message: function(event) {
    displayMessage(
      '[MESSAGE: received]',
      event.message,
      event.timetoken,
      event
    );

    if (event.message.type == "updatePlayers") {
      app.players = event.message.data.players;
    }

    

  },

  status: function(event) {
    displayMessage(
      event.category,
      'connected to channels: ' + event.affectedChannels,
      event.currentTimetoken,
      event
    );
  },

  // Count people in room.
  presence: function(event) {
    if (event.channel != theChannel) {
      app.playerCount = event.occupancy;
    }
  }

});

pubnub.subscribe({
  channels: ['the_guide'],
  withPresence: true
});

const displayMessage = function(messageType, aMessage, timeStamp, obj) {

  if (obj) {
    app.messages.push({ type: messageType, msg: aMessage, timeStamp:timeStamp, obj: obj });
  } else if (timeStamp) {
    app.messages.push({ type: messageType, msg: aMessage, timeStamp:timeStamp });
  } else if (aMessage) {
    app.messages.push({ type: messageType, msg: aMessage, });
  } else if (messageType) {
    app.messages.push({ type: messageType });
  }

};