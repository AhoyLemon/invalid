const settings = {
  timeToPresent: 30,
};


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