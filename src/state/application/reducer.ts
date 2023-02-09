import { createSlice, nanoid } from "@reduxjs/toolkit";

import { DEFAULT_TXN_DISMISS_MS } from "../../constants";
import {DEFAULT_CHAINID, SupportedChainId} from "../../constants/chains";

export type PopupContent =
  | {
      txn: {
        hash: string;
      };
    }
  | {
      failedSwitchNetwork: SupportedChainId;
    };

type PopupList = Array<{
  key: string;
  show: boolean;
  content: PopupContent;
  removeAfterMs: number | null;
}>;

export interface ApplicationState {
  readonly chainId: SupportedChainId;
  readonly openWalletModal: boolean;
  readonly openWaitingModal: boolean;
  readonly openDoneModal: boolean;
  readonly popupList: PopupList;
  readonly totalNum: number;
}

const initialState: ApplicationState = {
  chainId: DEFAULT_CHAINID as SupportedChainId,
  openWalletModal: false,
  openWaitingModal: false,
  openDoneModal: false,
  popupList: [],
  totalNum: 0,
};

const applicationSlice = createSlice({
  name: "application",
  initialState,
  reducers: {
    updateChainId(state, action) {
      const { chainId } = action.payload;
      state.chainId = chainId as SupportedChainId;
    },
    updateTotalNum(state, action) {
      const { totalNum } = action.payload;
      state.totalNum = totalNum;
    },
    setWalletOpenModal(
      state,
      action: { payload: boolean }
    ) {
      state.openWalletModal = action.payload
    },
    setWaitingOpenModal(
      state,
      action: { payload: boolean }
    ) {
      state.openWaitingModal = action.payload
    },
    setDoneOpenModal(
      state,
      action: { payload: boolean }
    ) {
      state.openDoneModal = action.payload
    },
    addPopup(
      state,
      { payload: { content, key, removeAfterMs = DEFAULT_TXN_DISMISS_MS } }
    ) {
      state.popupList = (
        key
          ? state.popupList.filter((popup) => popup.key !== key)
          : state.popupList
      ).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ]);
    },
    removePopup(state, { payload: { key } }) {
      state.popupList.forEach((p) => {
        if (p.key === key) {
          p.show = false;
        }
      });
    },
  },
});

export const {
  updateChainId,
  setWalletOpenModal,
  setWaitingOpenModal,
  setDoneOpenModal,
  addPopup,
  removePopup,
  updateTotalNum,
} = applicationSlice.actions;

export default applicationSlice.reducer;
