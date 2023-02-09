import { BigNumber } from "@ethersproject/bignumber";
import { ContractTransaction } from "ethers/lib/ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Factory } from "../abis/types/Factory";
import { CreateFormData } from "../components/Form/Common";
import { SupportedChainId, supportedChainId2Name } from "../constants/chains";
import { getSelectToken, nativeOnChain, SelectToken, SelectTokenChainToFindPoolFee, SelectTokenIDs } from "../constants/token";
import { useLatestTokenQuery, Token as OspToken } from "../graphql/find/generated";
import { useSignatureNormalCreateMutation, useSignatureOwnerCreateMutation } from "../state/service/generatedSignatureApi";
import useActiveWeb3React from "./useActiveWeb3React";
import { useFindFactoryContract } from "./useContract";
import { useFindClient } from "./useGraphqlClient";
import { getScanLink } from "../constants/link";

export interface CreateDoneSignal {
  token: OspToken
  withMultiply: boolean
}

function useCreateOSP(
  chainId: SupportedChainId, formData: CreateFormData, clearFormData: () => void, openDoneModal: (t: CreateDoneSignal) => void
): {
  createLoading: boolean,
  createContractResult?: ContractResultData,
  handleCreateToken: () => void,
} {
  const contract = useFindFactoryContract(true)
  const { account } = useActiveWeb3React()
  const [createLoading, setCreateLoading] = useState<boolean>(false)
  const [createContractResult, setCreateContractResult] = useState<ContractResultData>()

  const [targetNormalCreateSign, ] = useSignatureNormalCreateMutation()
  const [targetOwnerCreateSign, ] = useSignatureOwnerCreateMutation()

  const [, selectTokenPoolFee] = useMemo(() => {
    const tid = SelectTokenIDs.find(t => getSelectToken(t)[chainId] === formData.pairToken) || SelectToken.FIND
    return [
      tid,
      SelectTokenChainToFindPoolFee[tid] ? SelectTokenChainToFindPoolFee[tid][chainId].toString() : "0"
    ]
  }, [chainId, formData.pairToken])

  const [name, symbol, selectToken, selectFee, freeForOwner] = useMemo(() => ([formData.github?.replaceAll("https://", ""), formData.tokenName, formData.pairToken.address, selectTokenPoolFee, formData.freeForOwner]), [formData.freeForOwner, formData.github, formData.pairToken.address, formData.tokenName, selectTokenPoolFee])

  const [createDoneName, setCreateDoneName] = useState<string>()
  const findClient = useFindClient()

  const {data: latestToken} = useLatestTokenQuery({
    skip: !createDoneName,
    pollInterval: 1000,
    client: findClient,
  })

  useEffect(() => {
    if (!createDoneName) return
    if (!latestToken?.tokens || latestToken.tokens.length === 0) return
    if (latestToken.tokens[0].name === createDoneName) {
      const withMultiply = formData.multiplyAmount?.greaterThan(0) ?? false
      openDoneModal({
        token: latestToken.tokens[0] as OspToken,
        withMultiply
      })

      setCreateContractResult(undefined)
      clearFormData()
      setCreateDoneName(undefined)
      setCreateLoading(false)
    }
  }, [clearFormData, createDoneName, formData.multiplyAmount, latestToken?.tokens, openDoneModal])

  const sendTransactionSuccess = useCallback((ct: ContractTransaction) => {
    setCreateContractResult({
      isError: false,
      msg: 'transaction link',
      link: getScanLink(chainId, ct.hash),
    });
    ct.wait().then(() => {
      setCreateDoneName(name)
    }).catch((reason) => {
      setCreateContractResult({
        isError: true,
        msg: reason.data?.message || reason.message,
      })
      setCreateLoading(false)
    });
  }, [chainId, name])

  const sendTransactionFailed = useCallback((reason: any) => {
    console.log(reason)
    setCreateContractResult({
      isError: true,
      msg: reason.data?.message || reason.message,
    });
    setCreateLoading(false)
  }, [])

  const signatureFailed = useCallback((e: any) => {
    console.error(e)
    setCreateContractResult({
      isError: true,
      msg: "The failure to initiate the creation may be caused by transaction fluctuations, please try again",
    });
    setCreateLoading(false)
  }, [])

  useEffect(() => {
    if (createContractResult && createContractResult.isError && createContractResult.msg) {
      setTimeout(() => {
        setCreateContractResult(undefined)
      }, 5000)
    }
  }, [createContractResult])

  const getNativeValue = useCallback((payNFT?: any, payMultiply?: BigNumber) => {
    if (formData.pairToken.address !== nativeOnChain(chainId).wrapped.address) return {}
    const pn = payNFT || BigNumber.from(0)
    const pm = payMultiply || BigNumber.from(0)
    return {
      value: pn.add(pm)
    }
  }, [chainId, formData.pairToken.address])

  const getCreateOSPParams: (r: any) => Factory.CreateOSPParamsStruct = useCallback((result: any) => {
    const { projectId, deadline, buyNftTokenAmountMax, buyNftFindAmount, tokenToFindOutPath, signature, stars, poolConfigIndex, nftPercentConfigIndex } = result
    // console.log([formatUnits(buyNftTokenAmountMax, 18), formatUnits(buyNftFindAmount, 18)])
    return {
      base: {
        name: name || '',
        symbol: symbol || '',
        projectId: projectId || '',
        stars: parseInt(stars || '0'),
        poolConfigIndex,
        nftPercentConfigIndex,
      },
      deadline: parseInt(deadline || '0'),
      buyNFTTokenAmountMax: BigNumber.from(buyNftTokenAmountMax),
      buyNFTFindAmount: BigNumber.from(buyNftFindAmount),
      tokenToFindOutPath,
      signature
    }
  }, [name, symbol])
  const getCreateOSPByOwnerParams: (r: any) => Factory.CreateOSPByProjectOwnerParamsStruct = useCallback((result: any) => {
    const { projectId, deadline, signature, stars, poolConfigIndex, nftPercentConfigIndex } = result
    return {
      base: {
        name: name || '',
        symbol: symbol || '',
        projectId: projectId || '',
        stars: parseInt(stars),
        poolConfigIndex,
        nftPercentConfigIndex,
      },
      deadline,
      signature
    }
  }, [name, symbol])

  const handleNormalCreateWithMultiply = useCallback(() => {
    setCreateLoading(true)
    targetNormalCreateSign({
      v1NormalCreateRequest: {
        name, symbol, selectToken, selectFee, chainId: supportedChainId2Name(chainId), sender: account
      }
    }).unwrap().then((result) => {
      const params = getCreateOSPParams(result)
      console.log({ params })
      const amountPayMax = BigNumber.from(formData.multiplyPayMaxAmount?.asFraction.quotient.toString())
      console.log(formData.multiplyOutFindAmount?.quotient.toString(), amountPayMax.toBigInt().toString())
      contract.createOSPAndMultiply(
        params,
        BigNumber.from(formData.multiplyOutFindAmount?.quotient.toString()),
        amountPayMax,
        getNativeValue(params.buyNFTTokenAmountMax, amountPayMax)
      ).then(sendTransactionSuccess).catch(sendTransactionFailed)
    }).catch(signatureFailed)
  }, [chainId, account, targetNormalCreateSign, name, symbol, selectToken, signatureFailed, getCreateOSPParams, formData.multiplyOutFindAmount?.quotient, formData.multiplyPayMaxAmount?.asFraction, contract, getNativeValue, sendTransactionSuccess, sendTransactionFailed, selectFee])
  const handleNormalCreateWithoutMultiply = useCallback(() => {
    setCreateLoading(true)
    targetNormalCreateSign({ 
      v1NormalCreateRequest: { 
        name, symbol, selectToken, selectFee, chainId: supportedChainId2Name(chainId), sender: account
      }
    }).unwrap().then((result) => {
      const params = getCreateOSPParams(result)
      console.log({ params })
      contract.createOSP(
        params,
        getNativeValue(params.buyNFTTokenAmountMax)
      ).then(sendTransactionSuccess).catch(sendTransactionFailed)
    }).catch(signatureFailed)
  }, [chainId, account, contract, getCreateOSPParams, getNativeValue, name, selectToken, sendTransactionFailed, sendTransactionSuccess, signatureFailed, symbol, targetNormalCreateSign, selectFee])

  const handleOwnerCreateWithMultiply = useCallback(() => {
    setCreateLoading(true)
    targetOwnerCreateSign({
      v1OwnerCreateRequest: {
        name, symbol, selectToken, selectFee, ownerAddress: account || "", state: freeForOwner, chainId: supportedChainId2Name(chainId)
      }
    }).unwrap().then((result) => {
      const params = getCreateOSPByOwnerParams(result)
      console.log({ params })
      const amountPayMax = BigNumber.from(formData.multiplyPayMaxAmount?.asFraction.quotient.toString())
      console.log(formData.multiplyOutFindAmount?.quotient.toString(), amountPayMax.toBigInt().toString())
      contract.createOSPByProjectOwnerAndMultiply(
        getCreateOSPByOwnerParams(result),
        result.tokenToFindOutPath || '',
        BigNumber.from(formData.multiplyOutFindAmount?.quotient.toString()),
        amountPayMax,
        getNativeValue(undefined, amountPayMax)
      ).then(sendTransactionSuccess).catch(sendTransactionFailed)
    }).catch(signatureFailed)
  }, [chainId, account, contract, formData.multiplyPayMaxAmount?.asFraction, formData.multiplyOutFindAmount?.quotient, freeForOwner, getCreateOSPByOwnerParams, getNativeValue, name, selectToken, sendTransactionFailed, sendTransactionSuccess, signatureFailed, symbol, targetOwnerCreateSign, selectFee])

  const handleOwnerCreateWithoutMultiply = useCallback(() => {
    setCreateLoading(true)
    targetOwnerCreateSign({ 
      v1OwnerCreateRequest: { 
        name, symbol, selectToken, selectFee, ownerAddress: account || "", state: freeForOwner, chainId: supportedChainId2Name(chainId)
      }
    }).unwrap().then((result) => {
      const params = getCreateOSPByOwnerParams(result)
      console.log({ params })
      contract.createOSPByProjectOwner(
        params,
      ).then(sendTransactionSuccess).catch(sendTransactionFailed)
    }).catch(signatureFailed)
  }, [chainId, account, contract, freeForOwner, getCreateOSPByOwnerParams, name, selectToken, sendTransactionFailed, sendTransactionSuccess, signatureFailed, symbol, targetOwnerCreateSign, selectFee])

  const handleCreateToken = useCallback(() => {
    if (!account) return
    const withMultiply = formData.multiplyAmount?.greaterThan(0) ?? false
    if (freeForOwner && withMultiply) {
      handleOwnerCreateWithMultiply()
    }
    if (freeForOwner && !withMultiply) {
      handleOwnerCreateWithoutMultiply()
    }
    if (!freeForOwner && withMultiply) {
      handleNormalCreateWithMultiply()
    }
    if (!freeForOwner && !withMultiply) {
      handleNormalCreateWithoutMultiply()
    }
  }, [account, formData.multiplyAmount, freeForOwner, handleNormalCreateWithMultiply, handleNormalCreateWithoutMultiply, handleOwnerCreateWithMultiply, handleOwnerCreateWithoutMultiply])
  return useMemo(() => ({
    createLoading,
    createContractResult,
    handleCreateToken,
  }), [createContractResult, createLoading, handleCreateToken])
}

export default useCreateOSP