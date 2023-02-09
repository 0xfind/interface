import "./styles/globals.scss";

import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react"
import { BrowserTracing } from "@sentry/tracing"
import { Provider } from "react-redux"
import { ApolloProvider } from '@apollo/client/react'

import { client } from './graphql/client'
import App from "./App";
import ApplicationUpdater from "./providers/ApplicationUpdater";
import MulticallUpdater from "./providers/MulticallUpdater";
import LanguageProvider from "./providers/LanguageProvider";
import PriceUpdater from "./providers/PriceUpdater";
import Web3Provider from "./providers/Web3Provider";

import reportWebVitals from "./reportWebVitals";
import store from "./state";
import BlockNumberProvider from "./providers/BlockNumberUpdater";

if (!!window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

Sentry.init({
  dsn: "https://6f64d8723dc1442ab2324469542a0969@o1287227.ingest.sentry.io/4504237193691136",
  integrations: [new BrowserTracing()],
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.REACT_APP_ENV || "test",
  tracesSampleRate: 1.0,
});

function Updaters() {
  return <>
    <ApplicationUpdater />
    <MulticallUpdater />
    <PriceUpdater />
  </>
}

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <ApolloProvider client={client}>
        <LanguageProvider>
          <Web3Provider>
            <BlockNumberProvider>
              <Updaters />
              <App />
            </BlockNumberProvider>
          </Web3Provider>
        </LanguageProvider>
      </ApolloProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
