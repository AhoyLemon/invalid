
const challenges = [
  {
    id: 1,
    name: "Mortal Kombat",
    nameAsRule: "Your password must be a playable Mortal Kombat character",
    failedMessage: "[PASS] is not a playable Mortal Kombat character",
    possible: [
      "johnny cage",
      "kano",
      "liu kang",
      "raiden",
      "scorpion",
      "sonya blade",
      "sub-zero",
      "goro",
      "shang tsung",
      "reptile",
      "baraka",
      "jade",
      "jax",
      "kintaro",
      "kitana",
      "kung lao",
      "mileena",
      "noob saibot",
      "shao khan",
      "smoke",
      "chameleon",
      "cyrax",
      "ermac",
      "kabal",
      "khameleon",
      "motaro",
      "nightwolf",
      "rain",
      "sektor",
      "sheeva",
      "sindel",
      "stryker",
      "meat",
      "bo rai cho",
      "frost"
    ]
  },

  {
    id: 2,
    name: "Bob's Burgers",
    nameAsRule: "Your password must be the first name of a Bob's Burgers character",
    failedMessage: "[PASS] is not a Bob's Burgers character",
    possible: [
      "Mike",
      "Bob",
      "LINDA",
      "GENE",
      "LOUISE",
      "TINA",
      "TEDDY",
      "MORT",
      "RUDY",
      "JIMMY",
      "ANDY",
      "OLLIE",
      "JOCELYN",
      "TAMMY",
      "HELEN",
      "TREV",
      "MARSHMALLOW",
      "BOO BOO",
      "DARRYL",
      "PHILLIP",
      "ALEX",
      "ART",
      "RANDY",
      "KURT",
      "LOGAN",
      "SASHA"
    ]
  },

  {
    id: 3,
    name: "Words For Breasts",
    nameAsRule: "Your password must be a word the Oxford English Dictionary recognizes as a synonym for “breasts”",
    failedMessage: "The OED doesn't recognize [PASS] as a word for breasts.",
    naughty: true,
    possible: [
      "CHEST",
      "BUST",
      "BOSOM",
      "BOOBS",
      "KNOCKERS",
      "BOOBIES",
      "BOOBS",
      "BAZOOKAS",
      "MELONS",
      "JUBBLIES",
      "BUBBLIES",
      "ORBS",
      "GLOBES",
      "CHARLIES",
      "BAPS",
      "BAZOOMS",
      "CASABAS",
      "CHI CHIS",
      "NORKS",
      "TITS",
      "TITTIES",
      "JUGS",
      "HOOTERS",
      "CANS"
    ]
  },

  {
    id: 4,
    name: "African Countries",
    nameAsRule: "Your password MUST be a country in Africa",
    failedMessage: "[PASS] is not an African country",
    possible: [
      "ALGERIA",
      "ANGOLA",
      "BENIN",
      "BOTSWANA",
      "Algeria",
      "Angola",
      "Benin",
      "Botswana",
      "Burkina Faso",
      "Burundi",
      "Cabo Verde",
      "Cameroon",
      "Central African Republic",
      "Chad",
      "Comoros",
      "Republic of the Congo",
      "Democratic Republic of the Congo",
      "Cote d'Ivoire",
      "Djibouti",
      "Egypt",
      "Equatorial Guinea",
      "Eritrea",
      "Eswatini",
      "Ethiopia",
      "Gabon",
      "Gambia",
      "Ghana",
      "Guinea",
      "Guinea-Bissau",
      "Kenya",
      "Lesotho",
      "Liberia",
      "Libya",
      "Madagascar",
      "Malawi",
      "Mali",
      "Mauritania",
      "Mauritius",
      "Morocco",
      "Mozambique",
      "Namibia",
      "Niger",
      "Nigeria",
      "Rwanda",
      "Senegal",
      "Seychelles",
      "Sierra Leone",
      "Somalia",
      "South Africa",
      "South Sudan",
      "Sudan",
      "Tanzania",
      "Togo",
      "Tunisia",
      "Uganda",
      "Zambia",
      "Zimbabwe"
    ]
  },

  {
    id: 5,
    name: "European Countries",
    nameAsRule: "Your password must be a country in Europe",
    failedMessage: "Sorry! [PASS] is not a European Country.",
    possible: [
      "Albania",
      "Andorra",
      "Armenia",
      "Austria",
      "Azerbaijan",
      "Belarus",
      "Belgium",
      "Bosnia and Herzegovina",
      "Bulgaria",
      "Croatia",
      "Cyprus",
      "Czechia",
      "Denmark",
      "Estonia",
      "Finland",
      "France",
      "Georgia",
      "Germany",
      "Greece",
      "Hungary",
      "Iceland",
      "Ireland",
      "Italy",
      "Kazakhstan",
      "Kosovo",
      "Latvia",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Malta",
      "Moldova",
      "Monaco",
      "Montenegro",
      "Netherlands",
      "North Macedonia",
      "Norway",
      "Poland",
      "Portugal",
      "Romania",
      "Russia",
      "San Marino",
      "Serbia",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Sweden",
      "Switzerland",
      "Turkey",
      "Ukraine",
      "United Kingdom",
      "Vatican City"
    ]
  },

  {
    id: 6,
    name: "Football Teams",
    nameAsRule: "Your password must be an NFL football team name",
    failedMessage: "Sorry! There are no [PASS] in the NFL.",
    possible: [
      "CARDINALS",
      "FALCONS",
      "PANTHERS",
      "BEARS",
      "COWBOYS",
      "LIONS",
      "PACKERS",
      "RAMS",
      "VIKINGS",
      "SAINTS",
      "GIANTS",
      "EAGLES",
      "49ERS",
      "SEAHAWKS",
      "BUCCANEERS",
      "FOOTBALL TEAM",
      "RAVENS",
      "BILLS",
      "BENGALS",
      "BROWNS",
      "BRONCOS",
      "TEXANS",
      "COLTS",
      "JAGUARS",
      "CHIEFS",
      "RAIDERS",
      "CHARGERS",
      "DOLPHINS",
      "PATRIOTS",
      "STEELERS",
      "TITANS"
    ]
  },

  {
    id: 7,
    name: "State Birds",
    nameAsRule: "Your password must be a U.S. state bird",
    failedMessage: "Sorry, no US State made [PASS] their official bird.",
    possible: [
      "YELLOWHAMMER",
      "WILLOW PTARMIGAN",
      "WREN",
      "MOCKINGBIRD",
      "QUAIL",
      "LARK",
      "ROBIN",
      "BLUE HEN",
      "THRUSH",
      "THRASHER",
      "GOOSE",
      "BLUEBIRD",
      "CARDINAL",
      "GOLDFINCH",
      "FINCH",
      "MEADOWLARK",
      "PELICAN",
      "CHICKADEE",
      "ORIOLE",
      "LOON",
      "ROADRUNNER",
      "FRUIT DOVE",
      "GROUSE",
      "RHODE ISLAND RED",
      "PHEASANT",
      "GULL",
    ]
  },

  {
    id: 8,
    name: "Synonyms for Blue",
    nameAsRule: "Your password must be a synonym for blue",
    failedMessage: "Thesaurus.com doesn't list [PASS] as a synonym for blue.",
    possible: [
      "AZURE",
      "COBALT",
      "SAPPIRE",
      'CERULEAN',
      "NAVY",
      "ULTRAMARINE",
      "LAPIS",
      "INDIGO",
      "AQUAMARIE",
      "TURQUOISE",
      "TEAL",
      "CYAN",
      "DEPRESSED",
      "DOWN",
      "SAD",
      "SADDENED",
      "UNHAPPY",
      "MELANCHOLY",
      "MISERABLE",
      "SORROWFUL",
      "GLOOMY",
      "DEJECTED",
      "DOWNHEARTED",
      "DISHEARTENED",
      "DESPONDENT",
      "DISPIRITED",
      "LOW",
      "LOW SPIRITED",
      "HEAVY HEARTED",
      "GLUM",
      "MOROSE",
      "DISMAL",
      "DOWNCAST",
      "CAST DOWN",
      "TEARFUL",
      "DOWN IN THE DUMPS",
      "DOWN IN THE MOUTH",
      "FED UP",
      "INDECENT",
      "DIRTY",
      "RUDE",
      "COARSE",
      "VULGAR",
      "BAWDY",
      "LEWD",
      "RACY"
    ]
  },

  {
    id: 9,
    name: "My Little Ponies",
    nameAsRule: "Your password must be a My Little Pony (unicorns count)",
    failedMessage: "[PASS] isn't a My Little Pony! 🦄",
    possible: [
      "TWILIGHT SPARKLE",
      "APPLEJACK",
      "FLUTTERSHY",
      "RARITY",
      "PINKIE PIE",
      "RAINBOW DASH",
      "APPLE BLOOM",
      "SCOOTALOO",
      "SWEETIE BELLE",
      "BABS SEED",
      "PRINCESS CELESTIA",
      "PRINCESS LUNA",
      "PRINCE BLUEBLOOD",
      "SHINING ARMOR",
      "PROCESS CADENCE",
      "FLURRY HEART",
      "PRINCESS AMORE",
      "GRANNY SMITH",
      "BIG MCINTOSH",
      "BRAEBURN",
      "AUNT ORANGE",
      "UNCLE ORANGE",
      "HAYSEED TURNIP TRUCK",
      "APPLE STRUDEL",
      "AUNTIE APPLESAUCE",
      "APPLE ROSE",
      "GOLDIE DELICIOUS",
      "BRIGHT MAC",
      "PEAR BUTTER",
      "MAUD PIE",
      "STARLIGHT GLIMMER",
      "SUNSET SHIMMER",
      "TEMPEST SHADOW"
    ]
  },

  {
    id: 9,
    name: "Leafy Green Vegetables",
    nameAsRule: "Your password must be a leafy green vegetable",
    failedMessage: "[PASS] is not a leafy green vegeable",
    possible: [
      "ARUGULA",
      "BIBB",
      "CABBAGE",
      "LETTUCE",
      "BEET GREENS",
      "COLLARD GREENS",
      "DANDELION GREENS",
      "KALE",
      "MICROGREENS",
      "MUSTARD GREENS",
      "RAPINI",
      "BROCCOLI RABE",
      "ROMAINE",
      "SPINACH",
      "SWISS CHARD",
      "WATERCRESS",
      "ENDIVE",
      "BOK CHOY",
      "TURNIP GREENS",
      "PARSLEY"
    ]
  },

  {
    id: 10,
    name: "World Languages",
    nameAsRule: "Your password must be an Official Language of any country",
    failedMessage: "[PASS] is not a language recognized by any country.",
    possible: [
      "ABKHAZ",
      "ALBANIAN",
      "ARABIC",
      "ARMENIAN",
      "AZERBAIJANI",
      "BELARUSIAN",
      "BENGALI",
      "BOSNIAN",
      "BULGARIAN",
      "BURMESE",
      "CASTILIAN",
      "CATALAN",
      "COMORIAN",
      "CROATIAN",
      "CZECH",
      "DANISH",
      "DARI",
      "DUTCH",
      "DZONGKHA",
      "ENGLISH",
      "ESTONIAN",
      "FIJIAN",
      "FINNISH",
      "FRENCH",
      "GEORGIAN",
      "GERMAN",
      "GREEK",
      "HEBREW",
      "HINDI",
      "HUNGARIAN",
      "ICELANDIC",
      "INDONESIAN",
      "IRISH",
      "ITALIAN",
      "JAPANESE",
      "KAZAKH",
      "KHMER",
      "KIRUNDI",
      "KYRGYZ",
      "KOREAN",
      "LAO",
      "LATVIAN",
      "LITHUANIAN",
      "LUXEMBOURGISH",
      "MACEDONIAN",
      "MALAY",
      "MALTESE",
      "MAORI",
      "MANDARIN",
      "MONGOLIAN",
      "NEPALI",
      "NORWEGIAN",
      "PALAUAN",
      "PASHTO",
      "PERSIAN",
      "POLISH",
      "PORTUGUESE",
      "QUECHUA",
      "ROMANIAN",
      "RUSSIAN",
      "SERBIAN",
      "SLOVAK",
      "SLOVENE",
      "SOMALI",
      "SOTHO",
      "SPANISH",
      "SWAHILI",
      "SWAZI",
      "SWEDISH",
      "TAJIK",
      "TAMAZIGHT",
      "TETUM",
      "TIGRINYA",
      "TSWANA",
      "TURKISH",
      "UKRANIAN",
      "URDU",
      "UZBEK",
      "WOLEAIAN"
    ],
    source: "https://en.wikipedia.org/wiki/List_of_official_languages_by_country_and_territory"

  },

  {
    id: 11,
    name: "Coen Brothers Movies",
    nameAsRule: "Your password must be the title of a film written and/or directed by Joel and/or Ethan Coen.",
    failedMessage: "[PASS] is not a Coen Brothers movie.",
    possible: [
      "BLOOD SIMPLE",
      "CRIMEWAVE",
      "RAISING ARIZONA",
      "MILLER'S CROSSING",
      "BARTON FINK",
      "THE HUDSUCKER PROXY",
      "FARGO",
      "THE BIG LEBOWSKI",
      "THE NAKED MAN",
      "O BROTHER, WHERE ART THOU?",
      "THE MAN WHO WASN'T THERE",
      "INTOLERABLE CRUELTY",
      "THE LADYKILLERS",
      "TUILERIES",
      "WORLD CINEMA",
      "NO COUNTRY FOR OLD MEN",
      "BURN AFTER READING",
      "A SERIOUS MAN",
      "TRUE GRIT",
      "GAMBIT",
      "INSIDE LLEWYN DAVIS",
      "UNBROKEN",
      "BRIDGE OF SPIES",
      "HAIL, CAESAR!",
      "SUBURBICON",
      "THE BALLAD OF BUSTER SCRUGGS",
      "THE TRAGEDY OF MACBETH"
    ]
  },

  {
    id: 12,
    name: "Worst Movies",
    nameAsRule: "Your password must be a movie which won a “Worst Picture” award at the Golden Raspberry Awards",
    hint: "one picture awarded per year, starting in 1980",
    failedMessage: "[PASS] never won a Razzie",
    possible: [
      "CAN'T STOP THE MUSIC",
      "MOMMIE DEAREST",
      "INCHON",
      "THE LONELY LADY",
      "BOLERO",
      "RAMBO: FIRST BLOOD PART II",
      "HOWARD THE DUCK",
      "UNDER THE CHERRY MOON",
      "LEONARD PART 6",
      "COCKTAIL",
      "STAR TREK 5",
      "STAR TREK V",
      "THE ADVENTURES OF FORD FAIRLANE",
      "GHOSTS CAN'T DO IT",
      "HUDSON HAWK",
      "SHINING THROUGH",
      "INDECENT PROPOSAL",
      "COLOR OF NIGHT",
      "SHOWGIRLS",
      "STRIPTEASE",
      "THE POSTMAN",
      "BURN HOLLYWOOD BURN",
      "WILD WILD WEST",
      "BATTLEFIELD EARTH",
      "FREDDY GOT FINGERED",
      "SWEPT AWAY",
      "GIGLI",
      "CATWOMAN",
      "DIRTY LOVE",
      "BASIC INSTICT 2",
      "I KNOW WHO KILLED ME",
      "THE LOVE GURU",
      "TRANSFORMERS: REVENGE OF THE FALLEN",
      "THE LAST AIRBENDER",
      "JACK AND JILL",
      "THE TWILIGHT SAGA: BREAKING DAWN PART 2",
      "MOVIE 43",
      "SAVING CHRISTMAS",
      "FANTASTIC FOUR",
      "FIFTY SHADES OF GREY",
      "HILLARY'S AMERICA",
      "THE EMOJI MOVIE",
      "HOLMES & WATSON",
      "CATS"
    ],
    source: "https://en.wikipedia.org/wiki/Golden_Raspberry_Award_for_Worst_Picture"
  }
];

