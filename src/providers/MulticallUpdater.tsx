import useActiveWeb3React from "../hooks/useActiveWeb3React";
import useBlockNumber from "../hooks/useBlockNumber";
import { useInterfaceMulticall } from "../hooks/useContract";
import multicall from "../utils/multicall";
import {currentChainId} from "../constants/chains";

function MulticallUpdater() {
  const { chainId } = useActiveWeb3React()
  const latestBlockNumber = useBlockNumber()
  const contract = useInterfaceMulticall()

  return (
    <multicall.Updater
      chainId={currentChainId(chainId)}
      latestBlockNumber={latestBlockNumber}
      contract={contract}
      isDebug
    />
  );
}

export default MulticallUpdater;
