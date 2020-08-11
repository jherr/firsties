import { request, gql } from "graphql-request";

const SERVER = "http://localhost:4000/";

const getState = async (game) =>
  request(
    SERVER,
    gql`
      query($game: String!) {
        gameState(game: $game) {
          state
          round
          voteOn
          players {
            name
            prompt
            response
            score
            voted
          }
        }
      }
    `,
    {
      game,
    }
  );

const startGame = async () => {
  const { startGame } = await request(
    SERVER,
    gql`
      mutation {
        startGame
      }
    `
  );
  return startGame;
};

const addPlayer = async (game, name) => {
  const { addPlayer } = await request(
    SERVER,
    gql`
      mutation($game: String!, $name: String!) {
        addPlayer(game: $game, name: $name)
      }
    `,
    {
      game,
      name,
    }
  );
  return addPlayer;
};

const startRound = async (game) =>
  request(
    SERVER,
    gql`
      mutation($game: String!) {
        startRound(game: $game) {
          state
        }
      }
    `,
    {
      game,
    }
  );

const registerVote = async (game, player, vote) =>
  request(
    SERVER,
    gql`
      mutation($game: String!, $index: ID!, $vote: Int!) {
        registerVote(game: $game, index: $index, vote: $vote) {
          state
          round
          voteOn
          players {
            voted
          }
        }
      }
    `,
    {
      game,
      index: player,
      vote: vote,
    }
  );

const updateResponse = (game, player, response) =>
  request(
    SERVER,
    gql`
      mutation($game: String!, $index: ID!, $response: String!) {
        updateResponse(game: $game, index: $index, response: $response) {
          state
          players {
            name
            prompt
            response
          }
        }
      }
    `,
    {
      game,
      index: player,
      response: response,
    }
  );

(async function () {
  const game = await startGame();

  const p1 = await addPlayer(game, "Jack");
  const p2 = await addPlayer(game, "Jill");

  await startRound(game);

  // Round #1 - Prompt
  await updateResponse(game, p1, "Foo");
  await updateResponse(game, p2, "Bar");

  // Round #1 - Vote
  await registerVote(game, p1, 1);
  await registerVote(game, p2, 0);
  await registerVote(game, p1, 0);
  await registerVote(game, p2, -1);

  // Round #2 - Prompt
  await updateResponse(game, p1, "Foo");
  await updateResponse(game, p2, "Bar");

  // Round #2 - Vote
  await registerVote(game, p1, 1);
  await registerVote(game, p2, 0);
  await registerVote(game, p1, 0);
  await registerVote(game, p2, -1);

  // Round #3 - Prompt
  await updateResponse(game, p1, "Foo");
  await updateResponse(game, p2, "Bar");

  // Round #3 - Vote
  await registerVote(game, p1, 1);
  await registerVote(game, p2, 0);
  await registerVote(game, p1, 0);
  await registerVote(game, p2, 1);

  console.log(JSON.stringify(await getState(game), null, 2));
})();
