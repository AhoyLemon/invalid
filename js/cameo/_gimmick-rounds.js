const gimmickRounds = {
  richards: {
    name: "Oops! All Richards",
    description: "Let's evaluate some dicks",
    queue: [

      { name: "Richard Hatch", desc:"Winner, Survivor Season 1", slug:"richhatch", value:50 },
      { name: "Richard Karn", desc:"Al on Home Improvement", slug:"richardkarn", value:100 },
      { name: "Richard Patrick", desc:"Vocalist of Filter", slug:"filter_richard_patrick", value:70 },

      { name: "Richard Blais", desc:"Perennial Top Chef Contestant", slug:"richardblais", value:115 },
      { name: "Richard Kline", desc:"Larry on Three's Company", slug:"larrydallas", value:100 },
      { name: "Richard Marx", desc:"Wherever you go, whatever you do, he will be right here waiting for you.", slug:"richardmarx", value:250 },

      { name: "Richard Dreyfuss", desc:"Hooper in Jaws", slug:"richarddreyfuss1", value:999 },
      { name: "Richard Rosenblatt", desc:"Former Chairman of MySpace", slug:"richardrosenblatt", value:30 },
      { name: "Richard Brake", desc:"The Night King on Game of Thrones", slug:"richbrake", value:80 },

      { name: "Richard Roeper", desc:"Movie Critic, Formerly of Ebert & Roeper", slug:"richarderoeper", value:55 },
      { name: "Richard Turner", desc:"Bassist, Blackberry Smoke", slug:"richardturner", value:50 },
      { name: "Richard Petty", desc:"NASCAR driver", slug:"rlpetty43", value:250 },
    ],

    finalHires: [
      { name: "Richard McGonagle", desc:"Voice Actor, the Uncharted video game series", slug:"richardmcgonagle", value:35 },
      { name: "Richard Thomas", desc:"John-Boy Walton on The Waltons", slug:"richardthomas", value:100 },
      { name: "Richard Schiff", desc:"Toby on The West Wing", slug:"richard_schiff", value:250 },
      { name: "Dick Beardsley", desc:"Marathon Runner", slug:"dickbeardsley", value:70 },
      { name: "Richard Dreyfuss", desc:"Hooper in Jaws", slug:"richarddreyfuss1", value:999 },
      { name: "Richard Hamilton", desc:"aka “The Man In The Mask”", slug:"ripcity3232", value:250 },
      { name: "Richard Marx", desc:"Wherever you go, whatever you do, he will be right here waiting for you.", slug:"richardmarx", value:250 },
      { name: "Kim Richards", desc:"Real Housewives of Beverly Hills", slug:"kimrichards", value:125 },
      { name: "Mo B. Dick", desc:"rap producer, No Limit Records", slug:"themobdick", value:35 },
      { name: "Dick Butkus", desc:"Former Linebacker, Chicago Bears", slug:"dickbutkus", value:395 }
    ]
  },

  trumpworld: {
    name: "Trumpworld",
    desc: "This round is cursed.",
    queue: [
      { name: "Roger Stone", desc:"Commuted Felon", slug:"rogerstone", value:75 },
      { name: "Michael Cohen", desc:"Disbarred Legal Fixer", slug:"michaelcohen212", value:100 },
      { name: "Joe Arpaio", desc: "Former Sheriff, Convicted of Criminal Contempt", slug:"sheriffjoearpaio", value:30 },

      { name: "Kevin Sorbo", desc: "Former Hercules, Current Gab Poster", slug:"ksorbs", value:80 },
      { name: "Anthony Scaramucci", desc:"Former White House Communications Director", slug:"themooch", value:55 },
      { name: "Mike Cernovich", desc: "Liar", slug:"cerno", value:50 },

      { name: "Sarah Palin", desc:"Portent of Things To Come", slug:"sarahpalin", value:200 },
      { name: "Sebastian Gorka", desc:"Trump Strategist", slug:"sebastian_gorka", value:99 },
      { name: "Sean Spicer", desc:"Former White House Press Secretary", slug:"seanspicer", value:99 },

      { name: "Ice Cube", desc: "Helped Trump Solve Racism", slug:"donmega69", value:500 },
    ]
  }
};


const testLoad = {
  playerName: "Carlos",
  playerScore: 1604,
  cameoHistory: [{"name":"LeVar Burton","correct":true},{"name":"John C. McGinley","correct":true},{"name":"Paula Poundstone","correct":true},{"name":"Steve Guttenberg","correct":true},{"name":"Roger Stone","correct":true},{"name":"Les Gold","correct":true},{"name":"deadmau5","correct":true},{"name":"Basil Brush","correct":true},{"name":"Kyle Troup","correct":true},{"name":"Elijah Wood","correct":true},{"name":"Ted DiBiase","correct":true},{"name":"David Ellefson","correct":true}],
  cameoValuationIndexes: [2,0,1,0],
  valuationHistory: [{"celebName":"Paula Poundstone","celebValue":49,"playerValue":"70","valuePoints":0},{"celebName":"Steve Guttenberg","celebValue":250,"playerValue":"225","valuePoints":0},{"celebName":"Basil Brush","celebValue":97,"playerValue":"125","valuePoints":0},{"celebName":"Elijah Wood","celebValue":300,"playerValue":"325","valuePoints":0}],
  availableToHire: [{"name":"Kenny G","desc":"Saxophonist","slug":"kennyg","value":295},{"name":"Henry","desc":"aka The NoTortoise BIG","slug":"thenotortoisebig","value":200},{"name":"Sarah Palin","desc":"Portent of things to come","slug":"sarahpalin","value":200},{"name":"Tommy Chong","desc":"Marijuana Enthusiast","slug":"tommychong","value":150},{"name":"Hide The Pain Harold","desc":"Photo Meme","slug":"hidethepainharold","value":250},{"name":"Sir Mix-A-Lot","desc":"Likes Big Butts","slug":"therealsirmixalot","value":150},{"name":"Steve Wozniak","desc":"Apple Co-Founder","slug":"stevewoz","value":500},{"name":"Montell Jordan","desc":"Singer, “This Is How We Do It”","slug":"mrjordan1911","value":100},{"name":"Sean Astin","desc":"Sam in The Lord of the Rings","slug":"seanastin","value":295},{"name":"Dr Drew","desc":"Radio Doctor, “Loveline”","slug":"drdrew","value":198}],
  finalBudget: 935,
  finalSpent: 1300
};










/*
///////////////////////////////////////////////////////////
// These people ARE in gimmick rounds, but ARE NOT in the basic game.
{ name: "Richard Blais", desc:"Perennial Top Chef Contestant", slug:"richardblais", value:115 },
{ name: "Richard Hatch", desc:"Winner, Survivor Season 1", slug:"richhatch", value:50 },
{ name: "Richard Dreyfuss", desc:"Hooper in Jaws", slug:"richarddreyfuss1", value:999 },
{ name: "Richard Patrick", desc:"Vocals, Filter", slug:"filter_richard_patrick", value:70 },
{ name: "Richard Roeper", desc:"Movie Critic, Formerly of Ebert & Roeper", slug:"richarderoeper", value:55 },
{ name: "Richard Brake", desc:"The Night King on Game of Thrones", slug:"richbrake", value:80 },
{ name: "Richard Turner", desc:"Bassist, Blackberry Smoke", slug:"richardturner", value:50 },
{ name: "Richard Petty", desc:"NASCAR driver", slug:"rlpetty43", value:250 },
{ name: "Richard Rosenblatt", desc:"Former Chairman of MySpace", slug:"richardrosenblatt", value:30 },
*/