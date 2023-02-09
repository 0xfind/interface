import { createSlice } from "@reduxjs/toolkit";
import { V1Verify } from "../service/generatedClaimApi";


export interface ClaimState {
  claimInfo: Record<string, V1Verify | undefined>;
}

const initialState: ClaimState = {
  claimInfo: {},
};

const claimSlice = createSlice({
  name: "claim",
  initialState,
  reducers: {
    updateClaim(state: ClaimState, { payload: { tokenId, verify } }: { payload: { tokenId?: string, verify?: V1Verify } }) {
      state.claimInfo[tokenId || ''] = verify
    },
  },
});

export const {
  updateClaim
} = claimSlice.actions;

export default claimSlice.reducer;
