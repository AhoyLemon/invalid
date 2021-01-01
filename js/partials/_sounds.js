const audioSrc = 'audio/';



// Employee Sounds
// Final Round Sounds.
const soundNewRule = new Howl({
  src: [ audioSrc + 'odqid3.mp3' ],
  volume: 0.25,
});

const soundStartGuessing = new Howl({
  src: [ audioSrc + '0dln84.mp3' ],
  volume: 0.6,
});

const soundBadGuess = new Howl({
  src: [ audioSrc + '3ge4hh-2.mp3' ],
  volume: 0.55,
});

const soundCorrectGuess = new Howl({
  src: [ audioSrc + 'pi392f.mp3' ],
  volume: 0.8,
});

const soundSystemCrash = new Howl({
  src: [ audioSrc + 'unngxf.mp3' ],
  volume: 0.8,
});

// Final Round Sounds.
const soundCorrect = new Howl({
  src: [ audioSrc + 'correct.mp3' ]
});

const soundNo = new Howl({
  src: [ audioSrc + 'no.mp3' ]
});

const soundCracked = new Howl({
  src: [ audioSrc + 'password_cracked.mp3' ]
});

const soundYouIdiot = new Howl({
  src: [ audioSrc + 'you_idiot.mp3' ]
});

const soundTooSlow = new Howl({
  src: [ audioSrc + 'too_slow.mp3' ]
});

const soundGameOver = new Howl({
  src: [ audioSrc + 'you_made_it_to_the_end_of_the_game.mp3' ]
});