import { MaxUint256 } from "@ethersproject/constants";
import { TransactionResponse } from "@ethersproject/providers";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";
import { useCallback, useMemo } from "react";

import {currentChainId} from "../constants/chains";
import { useSingleCallResult } from "./multicall";
import useActiveWeb3React from "./useActiveWeb3React";
import { useTokenContract } from "./useContract";
import { nativeOnChain } from "../constants/token";

export enum ApprovalState {
  UNKNOWN = "UNKNOWN",
  NOT_APPROVED = "NOT_APPROVED",
  APPROVED = "APPROVED",
}

export function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string
): CurrencyAmount<Token> | undefined {
  const contract = useTokenContract(token?.address, false);

  const inputs = useMemo(() => [owner, spender], [owner, spender]);
  const allowance = useSingleCallResult(contract, "allowance", inputs).result;

  return useMemo(
    () =>
      token && allowance
        ? CurrencyAmount.fromRawAmount(token, allowance.toString())
        : undefined,
    [token, allowance]
  );
}

export function useApprovalStateForSpender(
  amountToApprove: CurrencyAmount<Token> | undefined,
  spender: string | undefined
): ApprovalState {
  const { account, chainId } = useActiveWeb3React();
  const token = amountToApprove?.currency;

  const currentAllowance = useTokenAllowance(
    token,
    account ?? undefined,
    spender
  );

  return useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN;
    if (
      amountToApprove.currency.isNative ||
      amountToApprove.wrapped.currency.address ===
      nativeOnChain(currentChainId(chainId)).wrapped.address
    )
      return ApprovalState.APPROVED;
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN;

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED;
  }, [amountToApprove, chainId, currentAllowance, spender]);
}

export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(120).div(100);
}

export function useApproval(
  amountToApprove: CurrencyAmount<Token> | undefined,
  spender: string | undefined
): [
  ApprovalState,
  () => Promise<
    | {
        response: TransactionResponse;
        tokenAddress: string;
        spenderAddress: string;
      }
    | undefined
  >
] {
  const { chainId } = useActiveWeb3React();
  const token = amountToApprove?.currency?.isToken
    ? amountToApprove.currency
    : undefined;

  // check the current approval status
  const approvalState = useApprovalStateForSpender(amountToApprove, spender);

  const tokenContract = useTokenContract(token?.address);

  const approve = useCallback(async () => {
    function logFailure(error: Error | string): undefined {
      console.warn(`${token?.symbol || "Token"} approval failed:`, error);
      return;
    }

    // Bail early if there is an issue.
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      return logFailure("approve was called unnecessarily");
    } else if (!chainId) {
      return logFailure("no chainId");
    } else if (!token) {
      return logFailure("no token");
    } else if (!tokenContract) {
      return logFailure("tokenContract is null");
    } else if (!amountToApprove) {
      return logFailure("missing amount to approve");
    } else if (!spender) {
      return logFailure("no spender");
    }

    let useExact = false;
    const estimatedGas = await tokenContract.estimateGas
      .approve(spender, MaxUint256)
      .catch(() => {
        // general fallback for tokens which restrict approval amounts
        useExact = true;
        return tokenContract.estimateGas.approve(
          spender,
          amountToApprove.quotient.toString()
        );
      });

    return tokenContract
      .approve(
        spender,
        useExact ? amountToApprove.quotient.toString() : MaxUint256,
        {
          gasLimit: calculateGasMargin(estimatedGas),
        }
      )
      .then((response) => ({
        response,
        tokenAddress: token.address,
        spenderAddress: spender,
      }))
      .catch((error: Error) => {
        logFailure(error);
        throw error;
      });
  }, [approvalState, token, tokenContract, amountToApprove, spender, chainId]);

  return [approvalState, approve];
}
