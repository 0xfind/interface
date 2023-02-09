import { SupportedChainId } from "./chains";

export const ALCHEMY_KEY = process.env.REACT_APP_ALCHEMY_KEY;
if (typeof ALCHEMY_KEY === "undefined") {
  throw new Error(
    `REACT_APP_ALCHEMY_KEY must be a defined environment variable`
  );
}

export const ALCHEMY_NETWORK_URLS: { [key in SupportedChainId]: string } = {
  // [SupportedChainId.POLYGON]: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  // [SupportedChainId.POLYGON_MUMBAI]: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [SupportedChainId.GOERLI]: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [SupportedChainId.MAINNET]: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
};
