import React from "react";
import ReactDOM from "react-dom";
import {
  ThemeProvider,
  theme,
  Button,
  CSSReset,
  Box,
  Text,
} from "@chakra-ui/core";
import { ApolloProvider, gql, useMutation } from "@apollo/client";

import client from "./client";

const App = () => {
  const [startGame, { data }] = useMutation(gql`
    mutation {
      startGame
    }
  `);

  React.useEffect(() => {
    if (data?.startGame) {
      document.location.href = `/main.html?game=${data.startGame}`;
    }
  }, [data]);

  return (
    <Box p={5} textAlign="center" maxWidth={800} margin="auto">
      <Text fontSize="5xl">
        <strong>Firsties!</strong>
      </Text>
      <Button onClick={() => startGame()}>Start A Game</Button>
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
