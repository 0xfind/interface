import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  ethPrice: 0,
  findPrice: 0,
  findDerivedETH: 0,
};

const priceSlice = createSlice({
  name: "price",
  initialState,
  reducers: {
    updateEthPrice(state, action) {
      const { ethPrice } = action.payload;
      state.ethPrice = ethPrice;
    },
    updateFindPrice(state, action) {
      const { findPrice } = action.payload;
      state.findPrice = findPrice;
    },
    updateFindDerivedETH(state, action) {
      const { findDerivedETH } = action.payload;
      state.findDerivedETH = findDerivedETH;
    },
  },
});

export const { updateEthPrice, updateFindPrice, updateFindDerivedETH } = priceSlice.actions;
export default priceSlice.reducer;
