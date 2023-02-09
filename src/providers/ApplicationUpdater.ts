import { useEffect, useState } from "react";

import {currentChainId} from "../constants/chains";
import useActiveWeb3React from "../hooks/useActiveWeb3React";
import useDebounce from "../hooks/useDebounce";
import useIsWindowVisible from "../hooks/useIsWindowVisible";
import { updateChainId } from "../state/application/reducer";
import { useAppDispatch } from "../state/hooks";

export default function ApplicationUpdater(): null {
  const { chainId } = useActiveWeb3React();
  const dispatch = useAppDispatch();
  const windowVisible = useIsWindowVisible();

  const [activeChainId, setActiveChainId] = useState(chainId);

  useEffect(() => {
    if (chainId && windowVisible) {
      setActiveChainId(chainId);
    }
  }, [dispatch, chainId, windowVisible]);

  const debouncedChainId = useDebounce(activeChainId, 100);

  useEffect(() => {
    const chainId = currentChainId(debouncedChainId);
    console.log("currentChainId", chainId)
    dispatch(updateChainId({ chainId }))
  }, [dispatch, debouncedChainId]);

  return null;
}
