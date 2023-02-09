import { SupportedChainId } from "./chains";

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY;
if (typeof INFURA_KEY === "undefined") {
  throw new Error(
    `REACT_APP_INFURA_KEY must be a defined environment variable`
  );
}

export const INFURA_NETWORK_URLS: { [key in SupportedChainId]: string } = {
  // [SupportedChainId.POLYGON]: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
  // [SupportedChainId.POLYGON_MUMBAI]: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
};
