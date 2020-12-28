const audioSrc = 'audio/';


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