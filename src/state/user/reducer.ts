import { createSlice } from "@reduxjs/toolkit";
import { ConnectionType } from "../../connectors";
import { SupportedCurrency } from "../../constants/currency";

export interface UserState {
  readonly selectedWallet?: ConnectionType;
  readonly selectedWalletBackfilled: boolean;
  readonly currentCurrency: SupportedCurrency;
}

const initialState: UserState = {
  selectedWallet: undefined,
  selectedWalletBackfilled: false,
  currentCurrency: SupportedCurrency.USD,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateSelectedWallet(state, { payload: { wallet } }) {
      state.selectedWallet = wallet
      state.selectedWalletBackfilled = true
    },
    setCurrentCurrency(
      state,
      action: { payload: SupportedCurrency }
    ) {
      state.currentCurrency = action.payload
    },
  },
});

export const {
  updateSelectedWallet, setCurrentCurrency
} = userSlice.actions;

export default userSlice.reducer;
