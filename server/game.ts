import { Machine, interpret, send } from "xstate";
import PROMPTS from "./prompts";
import { shuffle } from "lodash";

type Player = {
  name: string;
  prompt: string;
  response: string;
  score: number;
  voted: boolean;
};
type GameState = {
  round: number;
  players: Player[];
  voteOn: number;
  voteOrder: number[];
};

const gameMachine = (id) =>
  Machine(
    {
      initial: "REGISTRATION",
      context: {
        id,
        round: 1,
        players: [],
        voteOn: -1,
        voteOrder: [],
      } as GameState,
      states: {
        REGISTRATION: {
          on: {
            addPlayer: {
              actions: "addPlayer",
            },
            start: "PROMPT",
          },
        },
        PROMPT: {
          entry: "startPrompt",
          on: {
            updateResponse: {
              actions: ["updateResponse", send("checkResponses")],
            },
            checkResponses: {
              target: "VOTE",
              cond: "everyoneResponded",
            },
          },
        },
        VOTE: {
          on: {
            registerVote: {
              actions: ["registerVote", send("checkRound")],
            },
            checkRound: [
              {
                target: "FINISHED",
                cond: "gameIsOver",
              },
              {
                target: "PROMPT",
                cond: "roundIsOver",
              },
            ],
          },
        },
        FINISHED: {
          type: "final",
        },
      },
    },
    {
      guards: {
        everyoneResponded: ({ players }) =>
          players.every(({ response }) => response.length > 0),
        gameIsOver: ({ round }) => round === 4,
        roundIsOver: ({ voteOn }) => voteOn === -1,
      },
      actions: {
        updateResponse: (context, event) => {
          context.players[event.index].response = event.response;
        },
        addPlayer: (context, event) => {
          context.players = [
            ...context.players,
            {
              name: event.name,
              prompt: "",
              response: "",
              score: 0,
              voted: false,
            },
          ];
        },
        registerVote: (context, event) => {
          const index = parseInt(event.index);

          if (!context.players[index].voted) {
            context.players[context.voteOn].score += event.vote;
          }
          context.players[index].voted = true;

          if (context.players.every(({ voted }) => voted)) {
            context.players = context.players.map((player) => ({
              ...player,
              voted: false,
            }));
            if (context.voteOrder.length === 0) {
              context.voteOn = -1;
              context.round += 1;
            } else {
              context.voteOn = context.voteOrder.shift();
            }
          }
        },
        startPrompt: (context) => {
          context.players = context.players.map((player) => ({
            ...player,
            prompt: PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
            response: "",
            voted: false,
          }));
          context.voteOrder = shuffle(
            new Array(context.players.length).fill(0).map((_, i) => i)
          );
          context.voteOn = context.voteOrder.shift();
        },
      },
    }
  );

export default (id) => interpret(gameMachine(id)).start();
