const gameTitle = "The Rules Have Changed";
const siteURL = "";
const playerID = randomNumber(1,100);
const employeeNumberSeed = randomNumber(10000,99999);


// TODO: Refactor this category into structured settings.
const defaults = {
  rulebux: 7,
  maxOffset: 2,
  minOffset: 2,
  vowelOffset: 1,
  hurryTime: 20,
  adminTimeLeft: 90,
  employeeMaxTime: 50,
  finalTimeLeft: 60,
  numberOfPossibleChallenges: 3,
};

const settings = {
  points: {
    forGoodPassword: 100,
    forFirstPassword: 20,
    perSecondPlayed: 1,
    forFailedPassword: 3,
    forServerCrash: 100,
    forCrackingPassword: 40,
    forHavingPasswordCracked: -40,
    forCrackingOwnPassword: -50
  }
};

// TODO: Remove this object
const myDefaults = {
  rulebux: 7,
  passwordAttempts: 0
};



const roundDefaults = {
  possibleChallenges: [],
  challenge: {},
  rules: [],
  shibboleth: "",
  bugs: [],
  attempts: [],
  claimedPasswords: [],
  possibleAnswerCount: 0,
  averageSize: 0,
  averageVowels: 0,
  elapsedTime: 0,
  adminTimer: undefined,
  roundTimer: undefined,
  hurryTimer: undefined,
  hurryTime: defaults.hurryTime,
  adminTimeLeft: defaults.adminTimeLeft,
  finalTimeLeft: defaults.finalTimeLeft,
  crash: {
    active: false,
    word: "",
    player: []
  }
};

function resetRoundVariables() {
  app.round.possibleChallenges = [];
  app.round.challenge = {};
  app.round.rules = [];
  app.round.shibboleth = "";
  app.round.bugs = [];
  app.round.attempts = [];
  app.round.claimedPasswords = [];
  app.round.possibleAnswerCount = 0;
  app.round.averageSize = 0;
  app.round.averageVowels = 0;
  app.round.elapsedTime = 0;
  app.round.adminTimer = undefined;
  app.round.roundTimer = undefined;
  app.round.hurryTimer = undefined;
  app.round.hurryTime = defaults.hurryTime;
  app.round.adminTimeLeft = defaults.adminTimeLeft;
  app.round.finalTimeLeft = defaults.finalTimeLeft;
  app.round.crash.active = false;
  app.round.crash.word = "";
  app.round.crash.player = [];
}

function resetUI() {
  app.ui.appliedForJob = false;
  app.ui.enterCode.focus = false;
  app.ui.challengeID = null;
  app.ui.roundOver =  false;
  app.ui.addBug = "";
  app.ui.addBugErrors = [];
  app.ui.passwordAttempt = null;
  app.ui.passwordInputError = false;
  app.ui.passwordSucceeded = false;
  app.ui.currentRule.editing = false;
  app.ui.currentRule.name = null;
  app.ui.currentRule.cost = 0;
  app.ui.currentRule.inputValue = null;
  app.ui.currentRule.inputValueTwo = null;
  app.ui.enterFinalPasswords = false;
  app.ui.passwordSuccessMessage = null;
}

const rules = [
  {
    name: "Demand A Letter",
    cost: 5
  },
  {
    name: "Ban A Letter",
    cost: 3
  },
  {
    name: "Shibboleth",
    cost: 3
  },
  {
    name: "Set A Maximum",
    cost: 2
  },
  {
    name: "Set A Minimum",
    cost: 2
  },
  {
    name: "Limit Vowels",
    cost: 1
  },
  {
    name: "Ban A Combo",
    cost: 1
  }
];

