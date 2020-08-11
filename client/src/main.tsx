import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider, theme, CSSReset, Box, Text } from "@chakra-ui/core";
import { ApolloProvider, gql, useSubscription } from "@apollo/client";

import client from "./client";

const [_, game] = document.location.href.match(/game=(.*?)$/);

const STATE_SUBSCRIPTION = gql`
  subscription($game: String!) {
    gameState(game: $game) {
      state
      round
      voteOn
      players {
        name
        score
        prompt
        response
      }
    }
  }
`;

const App = () => {
  const { data } = useSubscription(STATE_SUBSCRIPTION, {
    variables: { game },
  });

  if (!data) {
    return null;
  }

  return (
    <Box p={5} maxWidth={800} margin="auto">
      <Box my={5}>
        <Text fontSize="5xl" textAlign="center">
          <strong>Firsties!</strong>
        </Text>
      </Box>
      {data.gameState.state === "REGISTRATION" && (
        <Box my={5}>
          <Text fontSize="3xl">
            <a href={`http://localhost:1234/play.html?game=${game}`}>
              http://localhost:1234/play.html?game={game}
            </a>
          </Text>
        </Box>
      )}
      {data.gameState.state === "VOTE" && data.gameState.voteOn !== -1 && (
        <Box my={5} textAlign="center">
          <Text fontSize="3xl" mb={3}>
            Round: <strong>{data.gameState.round}</strong>
          </Text>
          <hr />
          <Text fontSize="xl" mt={5}>
            When I think of
          </Text>
          <Text fontSize="3xl">
            <strong>
              {data.gameState.players[data.gameState.voteOn].prompt}
            </strong>
          </Text>
          <Text fontSize="xl">I think of</Text>
          <Text fontSize="3xl" mb={3}>
            <strong>
              {data.gameState.players[data.gameState.voteOn].response}
            </strong>
          </Text>
        </Box>
      )}
      <hr />
      <Box mt={5} border="1px solid #ccc" borderRadius={10} p={3}>
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
