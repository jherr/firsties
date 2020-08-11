import { GraphQLServer, PubSub } from "graphql-yoga";
import createGame from "./game";

const games = {};
const subscribers = {};

const generateId = () =>
  [
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  ].join("");
const getUniqueId = () => {
  let id: string = generateId();
  while (games[id] !== undefined) {
    id = generateId();
  }
  return id;
};

const getState = (game) => ({
  state: games[game].state.value,
  ...games[game].state.context,
});

const typeDefs = `
  type Query {
    gameState(game: String!): GameState
  }

  type Player {
    name: String!
    prompt: String!
    response: String!
    voted: Boolean!
    score: Int!
  }
  
  type GameState {
    id: ID!
    state: String!
    round: Int!
    voteOn: Int!
    players: [Player!]!
  }

  type Mutation {
    startGame: ID!
    addPlayer(game: String!, name: String!): ID
    startRound(game: String!): GameState
    updateResponse(game: String!, index: ID!, response: String!): GameState
    registerVote(game: String!, index: ID!, vote: Int!): GameState
  }

  type Subscription {
    gameState(game: String!): GameState
  }
`;

const resolvers = {
  Query: {
    gameState: (_, { game }) => getState(game),
  },
  Mutation: {
    startGame: () => {
      const id = generateId();
      const game = createGame(id);
      games[id] = game;
      game.onChange(() => {
        (subscribers[id] || []).forEach((s) => s(getState(id)));
      });
      return id;
    },
    addPlayer: (_, { game, name }) => {
      if (!games[game]) {
        return null;
      }
      games[game].send({
        type: "addPlayer",
        name,
      });
      return getState(game).players.length - 1;
    },
    updateResponse: (_, { game, index, response }) => {
      if (!games[game]) {
        return null;
      }
      games[game].send({
        type: "updateResponse",
        index,
        response,
      });
      return getState(game);
    },
    registerVote: (_, { game, index, vote }) => {
      if (!games[game]) {
        return null;
      }
      games[game].send({
        type: "registerVote",
        index,
        vote,
      });
      return getState(game);
    },
    startRound: (_, { game }) => {
      if (!games[game]) {
        return null;
      }
      games[game].send("start");
      return getState(game);
    },
  },
  Subscription: {
    gameState: {
      subscribe: (_, { game }, { pubsub }) => {
        if (!game || !games[game]) {
          return null;
        }
        const channel = Math.random().toString(36).substring(2, 15);
        subscribers[game] = [
          ...(subscribers[game] || []),
          (gameState) => {
            pubsub.publish(channel, { gameState });
          },
        ];
        setTimeout(
          () => pubsub.publish(channel, { gameState: getState(game) }),
          0
        );
        return pubsub.asyncIterator(channel);
      },
    },
  },
};

const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(() => console.log("Server is running on http://localhost:4000"));
