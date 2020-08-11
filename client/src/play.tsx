import React from "react";
import ReactDOM from "react-dom";
import {
  ThemeProvider,
  theme,
  Input,
  Button,
  Grid,
  CSSReset,
  SimpleGrid,
  Box,
  Text,
  Icon,
} from "@chakra-ui/core";
import {
  ApolloProvider,
  gql,
  useMutation,
  useSubscription,
} from "@apollo/client";

import client from "./client";

const [_, game] = document.location.href.match(/game=(.*?)$/);

const STATE_SUBSCRIPTION = gql`
  subscription($game: String!) {
    gameState(game: $game) {
      id
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
`;

const Signup = ({ game, onSignup }) => {
  const [name, nameSet] = React.useState("");
  const [addPlayer] = useMutation(gql`
    mutation($game: String!, $name: String!) {
      addPlayer(game: $game, name: $name)
    }
  `);

  const onAddPlayer = () => {
    addPlayer({
      variables: {
        game,
        name,
      },
    }).then((data) => onSignup(data.data.addPlayer));
  };

  return (
    <>
      <Box>
        <Input
          placeholder="Name"
          value={name}
          onChange={(evt) => nameSet(evt.target.value)}
        ></Input>
      </Box>
      <Box mt={3}>
        <Button isDisabled={name.length === 0} onClick={onAddPlayer}>
          Let's Play
        </Button>
      </Box>
    </>
  );
};

const Registration = ({ playerId }) => {
  const [startRound] = useMutation(
    gql`
      mutation($game: String!) {
        startRound(game: $game) {
          id
        }
      }
    `,
    {
      variables: {
        game,
      },
    }
  );

  return (
    <>
      <Text fontSize="3xl">
        <strong>Wait for more players to arrive</strong>
      </Text>
      {playerId === "0" && (
        <Box mt={5}>
          <Button onClick={() => startRound()}>Start Game!</Button>
        </Box>
      )}
    </>
  );
};

const Prompt = ({ playerId, gameState }) => {
  const [response, responseSet] = React.useState("");
  const [updateResponse] = useMutation(gql`
    mutation($game: String!, $index: ID!, $response: String!) {
      updateResponse(game: $game, index: $index, response: $response) {
        state
      }
    }
  `);

  const onUpdateResponse = () => {
    updateResponse({
      variables: {
        game,
        index: playerId,
        response: response,
      },
    });
  };

  return (
    <>
      <Text fontSize="xl">When you think of</Text>
      <Text fontSize="3xl">
        <strong>{gameState.players[playerId].prompt}</strong>
      </Text>
      <Text fontSize="xl">you think?</Text>
      <Box mt={5}>
        <Input
          placeholder="Response"
          value={response}
          onChange={(evt) => responseSet(evt.target.value)}
        />
      </Box>
      <Box mt={5}>
        <Button
          isDisabled={
            response.length === 0 ||
            gameState.players[playerId].response.length > 0
          }
          onClick={onUpdateResponse}
        >
          Send It!
        </Button>
      </Box>
    </>
  );
};

const Vote = ({ playerId, gameState }) => {
  const [registerVote] = useMutation(gql`
    mutation($game: String!, $index: ID!, $vote: Int!) {
      registerVote(game: $game, index: $index, vote: $vote) {
        state
      }
    }
  `);

  const onRegisterVote = (vote) => {
    registerVote({
      variables: {
        game,
        index: playerId,
        vote,
      },
    });
  };

  if (gameState.voteOn < 0) {
    return null;
  }

  return (
    <>
      <Text fontSize="xl">When I think of</Text>
      <Text fontSize="3xl">
        <strong>{gameState.players[gameState.voteOn].prompt}</strong>
      </Text>
      <Text fontSize="xl">I think of</Text>
      <Text fontSize="3xl">
        <strong>{gameState.players[gameState.voteOn].response}</strong>
      </Text>
      <Grid gridTemplateColumns="repeat(3, 33%)" gap={2} mt={3}>
        <Button onClick={() => onRegisterVote(-1)}>
          <Icon name="triangle-down" />
        </Button>
        <Button onClick={() => onRegisterVote(0)}>
          <Icon name="minus" />
        </Button>
        <Button onClick={() => onRegisterVote(1)}>
          <Icon name="triangle-up" />
        </Button>
      </Grid>
    </>
  );
};

const GameDisplay = ({ playerId, gameState }) => (
  <>
    {gameState.state === "REGISTRATION" && <Registration playerId={playerId} />}
    {gameState.state === "PROMPT" && (
      <Prompt playerId={playerId} gameState={gameState} />
    )}
    {gameState.state === "VOTE" && (
      <Vote playerId={playerId} gameState={gameState} />
    )}
  </>
);

const App = () => {
  const [playerId, playerIdSet] = React.useState(null);
  const { data } = useSubscription(STATE_SUBSCRIPTION, {
    variables: { game },
  });

  if (!data) {
    return null;
  }

  return (
    <Box p={5} maxWidth={800} margin="auto">
      <SimpleGrid columns={[1, 2]}>
        <Box textAlign="center" m={3}>
          {playerId === null && data.gameState.state === "REGISTRATION" && (
            <Signup game={game} onSignup={(id) => playerIdSet(id)} />
          )}
          {playerId !== null && (
            <GameDisplay playerId={playerId} gameState={data.gameState} />
          )}
          {data.gameState.state === "FINISHED" && (
            <Text fontSize="3xl">This game is Over!</Text>
          )}
        </Box>
        <Box border="1px solid #ccc" borderRadius={10} p={5} m={3}>
          <Text fontSize="xl">
            Game: <strong>{game}</strong>
          </Text>
          {data.gameState.state !== "FINISHED" && (
            <Text fontSize="3xl">
              Round: <strong>{data.gameState.round}</strong>
            </Text>
          )}
          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                <td>
                  <Text fontSize="xl">
                    <strong>Player</strong>
                  </Text>
                </td>
                <td>
                  <Text fontSize="xl">
                    <strong>Score</strong>
                  </Text>
                </td>
              </tr>
            </thead>
            <tbody>
              {data.gameState.players.map(({ name, score }, i) => (
                <tr key={i}>
                  <td>
                    <Text fontSize="lg">{name}</Text>
                  </td>
                  <td>
                    <Text fontSize="lg">{score}</Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

ReactDOM.render(
  <ApolloProvider client={client}>
    <ThemeProvider theme={theme}>
      <CSSReset />
      <App />
    </ThemeProvider>
  </ApolloProvider>,
  document.getElementById("app")
);
