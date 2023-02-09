import { useContext } from "react";
import { BlockNumberContext, MISSING_PROVIDER } from "../utils/blocknumber";

function useBlockNumberContext() {
  const blockNumber = useContext(BlockNumberContext)
  if (blockNumber === MISSING_PROVIDER) {
    throw new Error('BlockNumber hooks must be wrapped in a <BlockNumberProvider>')
  }
  return blockNumber
}

/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  return useBlockNumberContext().value
}

export function useFastForwardBlockNumber(): (block: number) => void {
  return useBlockNumberContext().fastForward
}
