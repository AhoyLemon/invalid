const settings = {
  timeToPresent: 30,
};


const audioSrc = 'wrongest/audio/';

/////////////////////////////////
// Interface Sounds
const soundBeginTalking = new Howl({
  src: [ audioSrc + 'time-is-now-585.mp3', audioSrc + 'time-is-now-585.ogg' ],
  volume: 0.9,
});

const soundPresentationOver = new Howl({
  src: [ audioSrc + 'decay-475.mp3', audioSrc + 'decay-475.ogg' ],
  volume: 0.9,
});


function resetRoundVariables() {
  app.round.phase = "presenting";
  app.round.activePlayerIndex = -1;
  app.round.dealerIndex = 0;
  app.round.playerPresenting = false;
  app.round.presentationTimer = undefined;
  app.round.presentationTimeLeft = settings.timeToPresent;
  app.round.cardsPresented = [];
  app.round.votesSubmitted = 0;
}

function resetUIVariables() {
  app.ui.upVoteIndex = -1;
  app.ui.downVoteIndex = -1;
  app.ui.iVoted = false;
}


function changeFavicon(src) {
  var link = document.createElement('link'),
      oldLink = document.getElementById('dynamic-favicon');
  link.id = 'dynamic-favicon';
  link.rel = 'shortcut icon';
  link.href = src;
  if (oldLink) {
    document.head.removeChild(oldLink);
  }
  document.head.appendChild(link);
}