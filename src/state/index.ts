import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { load, save } from "redux-localstorage-simple";

import multicall from "../utils/multicall";
import application from "./application/reducer";
import transactions from './transactions/reducer'
import user from "./user/reducer";
import claim from "./claim/reducer";
import { findServiceSignatureSplitApi } from "./service/signatureApi";
import { findServiceUserSplitApi } from "./service/userApi";
import { findServiceClaimSplitApi } from "./service/claimApi";
import price from "./price/reducer";
import { updateVersion } from "./global/actions";

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'claim']

const store = configureStore({
  reducer: {
    application,
    user,
    transactions,
    claim,
    price,
    multicall: multicall.reducer,
    [findServiceSignatureSplitApi.reducerPath]: findServiceSignatureSplitApi.reducer,
    [findServiceUserSplitApi.reducerPath]: findServiceUserSplitApi.reducer,
    [findServiceClaimSplitApi.reducerPath]: findServiceClaimSplitApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: true })
      .concat(findServiceSignatureSplitApi.middleware, findServiceUserSplitApi.middleware, findServiceClaimSplitApi.middleware)
      .concat(save({ states: PERSISTED_KEYS, debounce: 1000 })),
  preloadedState: load({
    states: PERSISTED_KEYS,
    disableWarnings: process.env.NODE_ENV === "test",
  }),
});

store.dispatch(updateVersion())

setupListeners(store.dispatch);

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
