import express from "express";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";
import {
  VerifyDiscordRequest,
  getRandomEmoji,
  DiscordRequest,
} from "./utils.js";
import { getShuffledOptions, getResult } from "./game.js";
import {
  CHALLENGE_COMMAND,
  TEST_COMMAND,
  GUESS_COMMAND,
  HasGuildCommands,
} from "./commands.js";
//import react from "convex";
import { ConvexReactClient } from "convex/react";
import { InternalConvexClient } from "convex/browser";

const url = "https://aware-spoonbill-23.convex.cloud";

import ws from "ws";


const client = new ConvexReactClient({address: url}, {
  webSocketConstructor: ws,
  unsavedChangesWarning: false
});
/*
const internalClient = new InternalConvexClient(
      client.clientConfig,
      updatedQueries => {
        console.log('updated queries');
        console.log(updatedQueries);
        console.log(client.listeners);
        for (const queryToken of updatedQueries) {
          const callbacks = client.listeners.get(queryToken);
          if (callbacks) {
            for (const callback of callbacks) {
              console.log("callback called");
              callback();
            }
          }
        }
      },
      client.options
    );

client.cachedSync = internalClient;
internalClient.remoteQuerySet = null;
const onOpen = internalClient.webSocketManager.onOpen;
internalClient.webSocketManager["onOpen"] = () => {
  console.log("websocket open");
  onOpen();
  console.log(internalClient.connectionCount);
  const existingTransition = internalClient.remoteQuerySet.transition.bind(internalClient.remoteQuerySet);
  internalClient.remoteQuerySet["transition"] = (t) => {
    console.log(`transition: `, t);
    existingTransition(t);
  };
};

setTimeout(() => {
  console.log("HI");
  console.log(internalClient.connectionCount);
  //internalClient.remoteQuerySet["transition"] = null;
  console.log(internalClient.remoteQuerySet.transition);
  const { modification, queryToken, unsubscribe } = internalClient.state.subscribe("getWinner", []);
  internalClient.webSocketManager.sendMessage(modification);
}, 1000);
*/
// now i need to actually write queries & mutations :P
//client.subscribe("");

function onUpdate(query, args, cb) {
  const watch = client.watchQuery(query, ...args);
  const cleanup = watch.onUpdate(() => cb(watch.localQueryResult()));
  // console.log(`started watching query ${query}`, client.listeners); 
  return cleanup;
}
/*
setTimeout(() => {
  const cleanup = onUpdate("getWinner", [], (value) => {
    console.log('got a Result!');
    console.log(value);
  });
}, 500);
*/
const cleanup = onUpdate("getWinner", [], (value) => {
    console.log('got a Result!');
    console.log(value);
  notifyWinner(value);
  });
 
const guessMutation = client.mutation("guess");

//nonReactiveQuery('getSomething');

// we need React installed too, unless we use the convex/browser internal client
// oh cool. does convex/browser have websockets? yep
// thanks! weird error message. hey it worked! thanks!
// now we need to install ws
// ran npm install ws (shouldn't this be a dependency of convex package?)
// normally we use the browser building WebSocket, but if we're running in node we need an impl
// aha it's a node thingy. we should write a node tutorial at some point +1!
// woo it worked. what was wrong?

// we need better error messages, now it's really time for our JavaScript focus
// I forgot a positional arg -- ugh

// we keep putting off supporting the alternate use case but they're important
// it

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

const notifyWinner = async (winner) => {
  const [winnerUser, messageTokens] = winner;
  if (!winnerUser) {
    return;
  }
  for (let messageToken of messageTokens) {
    const endpoint = `webhooks/${process.env.APP_ID}/${messageToken}/messages/@original`;
    try {
      await DiscordRequest(endpoint, {
            method: "PATCH",
            body: {
              content: "Nice choice " + getRandomEmoji(),
              components: [],
            },
          });
    } catch (e) {
      console.log(e);
    }
  }
  
};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" guild command
    if (name === "test") {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: "hello world " + getRandomEmoji(),
        },
      });
    }
    
    if (name === "guess") {
      const userId = req.body.member.user.id;
      const guessedNumber = req.body.data.options[0].value;
      await guessMutation(guessedNumber, userId, req.body.token);
      const winnerMsg = `<@${userId}> is winning`;
      const toReturn = await res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `You have guessed ${guessedNumber}. ${winnerMsg}`,
        },
      });
      
      return toReturn;
    }

    // "challenge" guild command
    if (name === "challenge" && id) {
      const userId = req.body.member.user.id;
      // User's object choice
      const objectName = req.body.data.options[0].value;

      // Create active game using message ID as the game ID
      activeGames[id] = {
        id: userId,
        objectName,
      };

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `Rock papers scissors challenge from <@${userId}>`,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Append the game ID to use later on
                  custom_id: `accept_button_${req.body.id}`,
                  label: "Accept",
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }
  }
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId.startsWith("accept_button_")) {
      // get the associated game ID
      const gameId = componentId.replace("accept_button_", "");
      // Delete message with token in request body
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      try {
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            // Fetches a random emoji to send from a helper function
            content: "What is your object of choice?",
            // Indicates it'll be an ephemeral message
            flags: InteractionResponseFlags.EPHEMERAL,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.STRING_SELECT,
                    // Append game ID
                    custom_id: `select_choice_${gameId}`,
                    options: getShuffledOptions(),
                  },
                ],
              },
            ],
          },
        });
        // Delete previous message
        await DiscordRequest(endpoint, { method: "DELETE" });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    } else if (componentId.startsWith("select_choice_")) {
      // get the associated game ID
      const gameId = componentId.replace("select_choice_", "");

      if (activeGames[gameId]) {
        // Get user ID and object choice for responding user
        const userId = req.body.member.user.id;
        const objectName = data.values[0];
        // Calculate result from helper function
        const resultStr = getResult(activeGames[gameId], {
          id: userId,
          objectName,
        });

        // Remove game from storage
        delete activeGames[gameId];
        // Update message with token in request body
        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

        try {
          // Send results
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: resultStr },
          });
          // Update ephemeral message
          await DiscordRequest(endpoint, {
            method: "PATCH",
            body: {
              content: "Nice choice " + getRandomEmoji(),
              components: [],
            },
          });
        } catch (err) {
          console.error("Error sending message:", err);
        }
      }
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);

  // Check if guild commands from commands.json are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    TEST_COMMAND,
    GUESS_COMMAND,
    CHALLENGE_COMMAND,
  ]);
});
