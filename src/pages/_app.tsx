import React from "react";
import Head from "next/head";
import { AppProps } from "next/app";
import { customTheme } from "lib/theme";
import { ChakraProvider } from "@chakra-ui/react";

export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props;

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    // nullなら何もしない処理になる。
    jssStyles?.parentElement?.removeChild(jssStyles);
  }, []);

  return (
    <React.Fragment>
      <Head>
        <title>Online Lecture with Emotion</title>
        <meta
          name="viewport"
          content="minimu-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <ChakraProvider theme={customTheme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </React.Fragment>
  );
}
