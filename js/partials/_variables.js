const siteURL = "";
const playerID = randomNumber(1,100);
const employeeNumberSeed = randomNumber(10000,99999);


const defaults = {
  rulebux: 6,
  maxOffset: 2,
  minOffset: 2,
  vowelOffset: 1,
  hurryTime: 10,
  adminTimeleft: 90,
  employeeMaxTime: 50,
  hackAccountBonus: 40
};

const myDefaults = {
  rulebux: 6,
  passwordAttempts: 0
};

const roundDefaults = {
  possibleChallenges: [],
  challenge: {},
  rules: [],
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
  adminTimeleft: defaults.adminTimeleft,
  crash: {
    active: false,
    word: "",
    player: []
  }
};

const uiDefaults = {
  appliedForJob: false,
  enterCode: {
    focus: false
  },
  
  challengeID: null,
  roundOver: false,
  addBug: '',
  addBugErrors: [],
  passwordAttempt: '',
  passwordAttemptErrors: [],
  passwordInputError: false,
  passwordSucceeded: false,
  currentRule: {
    editing: false,
    name: '',
    cost: 0,
    inputValue: '',
    inputValueTwo: ''
  },
  enterFinalPasswords: false,
  passwordSuccessMessage: null
};

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

