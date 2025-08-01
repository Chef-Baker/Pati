"use strict";
const {
  Client,
  GatewayIntentBits,
  Guild,
  ClientUser,
  ChannelType,
  ActivityType,
} = require("discord.js");
require("dotenv").config();
const fs = require("fs");
// loads the wordle data
let data = fs.readFileSync("wordle.json");
let wordle = JSON.parse(data);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// rotates between rules in its status
function setRuleStatus(i) {
  let rules = [
    "always boss up",
    "never forget ya homies",
    "get outdoors",
    "take time 4 urself",
    "keep ur promises",
    "no one gets left behind",
    "love is always the answer",
  ];
  client.user.setPresence({
    activities: [
      {
        name: `rule #${i + 1}: ${rules[i]}`,
        type: ActivityType.Custom,
      },
    ],
  });
  setTimeout(() => {
    i++;
    if (i == rules.length) i = 0;
    setRuleStatus(i);
  }, 30000);
}
client.on("ready", () => {
  console.log("Connected as " + client.user.tag);
  setRuleStatus(0);
});

let id = {
    testServer: "946959817170378803",
    mainServer: "1379699654836617260",
    adminRole: "1379706399084380200",
    wordle: "1211781489931452447",
    mainChat: "1379708536291983460",
  },
  triggers = [
    /^ping/gi,
    /i+ *l+(o+v+e+|u+v+) *(y+o+)*u+/gi,
    /\bi *l *y+/gi,
    /\bpa+ti+/gi,
  ],
  replies = ["pong", "i love you too", "ily2", "mrow"],
  emojis = [
    "1381729943268098068",
    "1379998170435551403",
    "1383858281604452413",
    "1381730018316521624",
    "1400326245387866224",
    "1400326349754728518",
    "1400326563144274050",
  ];

// when a message is created
client.on("messageCreate", async (message) => {
  const channel = message.channel;
  // makes sure some things only happen in some servers
  switch (message.guildId) {
    case id.testServer:
      break;
    case id.mainServer:
      if (message.author.id == id.wordle) {
        // this is where the string containing the wordle # and result is ¯\_(ツ)_/¯
        const shareContent = message.components[0]?.components[0].data.content;
        // if the share command was sent
        share: if (shareContent != undefined) {
          // ex. Wordle #1505
          const wordleIndex = Number(shareContent.substring(7, 11));
          console.log(
            `${message.interactionMetadata.user.username} shared ${shareContent}`
          );
          // looks for the i in "i/6"
          let wordleResult = shareContent.charAt(12);
          if (wordleResult == "X") wordleResult = 7;
          // react to the message depending on how they did
          message.react(emojis[wordleResult - 1]);
          // cycles through every stored wordle
          for (let i = 0; i < wordle.length; i++) {
            // (1) if the shared wordle is stored, it adds them to the thread
            if (wordle[i].number != wordleIndex) continue;
            const thread = await message.channel.threads.fetch(
              wordle[i].threadId
            );
            await thread.members.add(message.interactionMetadata.user.id);
            message.forward(thread);
            console.log(
              `Added ${message.interactionMetadata.user.username} to the thread`
            );
            break share;
          }
          // (2) otherwise, a new thread is made
          const thread = await channel.threads.create({
            name: `Wordle #${wordleIndex}`,
            autoArchiveDuration: 1440,
            type: ChannelType.PrivateThread,
            invitable: false,
            reason: "wordle",
          });
          console.log(`Created thread: ${thread.name}`);
          thread.members.add(message.interactionMetadata.user.id);
          message.forward(thread);
          console.log(
            `Added ${message.interactionMetadata.user.username} to thread`
          );
          // store the shared wordle
          wordle.push({
            number: wordleIndex,
            threadId: `${thread.id}`,
          });
          let jsonWordle = JSON.stringify(wordle);
          fs.writeFileSync("wordle.json", jsonWordle);
          console.log(`Added wordle #${wordleIndex} to wordle.json`);
        } else
          playing: if (message.content.includes("is playing")) {
            if (message.channel.id != id.mainChat) {
              message.reply("wrong channel dumbass");
              break playing;
            }
            console.log(message.content);
            message.reply(
              "Use </share:1354514123479711745> when you're done to get added to the discussion thread!"
            );
          }
      }
      break;
  }
  // automated response w
  if (!message.author.bot) {
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].test(message.content)) message.reply(replies[i]);
    }
  }
});

client.login(process.env.TOKEN);
