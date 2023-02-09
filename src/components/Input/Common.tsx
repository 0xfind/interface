import { t } from "@lingui/macro";
import { Box, Button, Stack } from "@mui/material";
import { FC, ReactElement, useCallback, useEffect, useState } from "react";
import { DebounceInput } from "react-debounce-input";
import NumberFormat from 'react-number-format';
import ClipLoader from "react-spinners/ClipLoader";
import { currentChainId, SupportedChainId } from "../../constants/chains";
import { getChainSelectToken, getSelectTokenName, SelectToken, SelectTokenIcon } from "../../constants/token";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { PairTokenSelect } from "../Select/Common";
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { setWalletOpenModal } from "../../state/application/reducer";

type NumberInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabledInput?: boolean;
  footer?: ReactElement;
  max?: number;
  min?: number;
  selectDom?: ReactElement;
  tips?: ReactElement;
  strikethrough?: boolean;
  loading?: boolean;
  prefix?: string;
  actionButton?: ReactElement;
  decimalScale?: number;
}

export const NumberInput: FC<NumberInputProps> = ({ value, onChange, decimalScale, footer, disabledInput, min, max, selectDom, tips, strikethrough, loading, prefix, actionButton }) => {
  const [delayLoading, setDelayLoading] = useState<boolean>(false)
  useEffect(() => {
    if (loading) setDelayLoading(true)
    else {
      const id = setTimeout(() => setDelayLoading(false), 500)
      return () => clearTimeout(id)
    }
  }, [loading])
  const withValueCap = useCallback((values) => {
    const { floatValue, value } = values
    if (min && floatValue && floatValue < min) return false
    if (max && floatValue && floatValue > max) return false
    if (decimalScale && value && value.split(".")[1] && value.split(".")[1].length > decimalScale) return false
    return true
  }, [decimalScale, max, min])
  return <>
    <Box sx={{
      bgcolor: "inuse.secondarytext",
      border: "1px solid #fff",
      borderRadius: "10px",
      p: "16px"
    }}>
      <Box sx={{
        display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      }}>
        {delayLoading ? <ClipLoader size={18} loading color="#444A9E" /> : <NumberFormat
          disabled={disabledInput || false}
          thousandSeparator
          isNumericString
          prefix={prefix || ""}
          value={value || ''}
          style={{
            backgroundColor: "#F4F5F9",
            color: "rgb(0, 0, 0)",
            appearance: "textfield",
            textOverflow: "ellipsis",
            width: "0px",
            fontWeight: 400,
            outline: "none",
            border: "none",
            flex: "1 1 auto",
            fontSize: "28px",
            padding: "0",
            textAlign: "left",
            filter: "none",
            opacity: "1",
            transition: "opacity 0.2s ease-in-out 0s",
            textDecoration: strikethrough ? 'line-through' : 'unset',
            fontStyle: strikethrough ? 'italic' : 'normal'
          }}
          placeholder="0.00"
          onValueChange={(values) => {
            if (!withValueCap(values)) return
            const { value } = values
            if (onChange) onChange(value)
          }}
        />}
        {selectDom}
      </Box>
      {!!footer && <Box sx={{
        display: "flex", flexDirection: "row", justifyContent: "right", alignItems: "center",
        mt: "14px"
      }}>
        {footer}
      </Box>}
      {!!actionButton && <Box sx={{ width: "100%", mt: "24px" }}>
        {actionButton}
      </Box>}
    </Box>
    {tips && (
      <Box
        sx={{
          fontSize: "0.875rem",
          color: "#B32F3D",
          ml: "10px",
          mt: "2px",
        }}
      >
        {tips}
      </Box>
    )}
  </>
}

type GithubInputProps = {
  value: string | undefined;
  errorTips?: string;
  onChange: (value: string) => void;
}

export const GithubInputReg = /^https:\/\/github.com\/([^/]+)\/([^/\n]+)$/;

export const GithubInput: FC<GithubInputProps> = ({ value, onChange, errorTips }) => {
  const { account } = useActiveWeb3React()
  const dispatch = useAppDispatch()
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!account) {
      dispatch(setWalletOpenModal(true))
      return
    }
    onChange(e.target.value)
  }, [account, dispatch, onChange])
  return <>
    <DebounceInput
      debounceTimeout={500}
      onChange={handleChange}
      onClick={() => !account && dispatch(setWalletOpenModal(true))}
      value={value}
      placeholder={t`Please enter a GitHub URL, e.g. http//github.com/0xfind/0xfind`}
      style={{
        width: "100%", fontSize: "14px", fontWeight: 500, lineHeight: "21px", color: "#2C272D",
        background: "#F4F5F9", border: "0", borderRadius: "10px", padding: "11px 15px",
        outline: "none", "&:focus": { outline: "none" },
      }}
    />
    {!!errorTips && (
      <Box sx={{ fontSize: "14px", color: "inuse.error", mt: "8px", fontWeight: 500, lineHeight: "21px" }}>
        {errorTips}
      </Box>
    )}
  </>
}

export type NFTPriceInputProps = {
  chainId: SupportedChainId
  nftPrice?: string
  errTips?: string
  fetching: boolean
  tokenId: SelectToken
  onChangeToken: (token: SelectToken) => void
  disabledSelect?: boolean
  footer?: ReactElement
  strikethrough?: boolean
}

export const NFTPriceInput: FC<NFTPriceInputProps> = ({ chainId, nftPrice, errTips, onChangeToken, disabledSelect, footer, strikethrough, fetching, tokenId }) => {
  return <NumberInput
    disabledInput
    selectDom={<PairTokenSelect options={getChainSelectToken(chainId)} value={tokenId} onSelect={onChangeToken} disabledSelect={disabledSelect} />}
    value={nftPrice}
    footer={footer}
    strikethrough={strikethrough}
    loading={fetching}
    tips={<>{errTips}</>}
  />
}

export type BuyTokenInputProps = {
  pairTokenId: SelectToken
  value?: string
  onChange: (v: string) => void
  disabled?: boolean
  footer?: ReactElement
}

export const MultiplyTokenInput: FC<BuyTokenInputProps> = ({ pairTokenId, value, onChange, disabled, footer }) => {
  const chainId = useAppSelector((state) => currentChainId(state.application.chainId));
  return <NumberInput
    disabledInput={disabled}
    selectDom={<Button variant="contained" disabled={disabled} sx={{
      borderRadius: "10px",
      boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
      bgcolor: "inuse.text",
      color: "inuse.blacktext",
      fontSize: "14px",
      lineHeight: "18px",
      fontWeight: 500,
      minWidth: "85px",
      maxWidth: "100px",
      p: "7.2px 10px",
      "&:hover": {
        bgcolor: "inuse.text",
      },
      "&:disabled": {
        bgcolor: "inuse.text",
        boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
        color: "inuse.graytext",
      }
    }}>
      <Box sx={{
        display: "flex", flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", width: "100%"
      }}>
        <Stack direction={"row"} alignItems={"center"} spacing={"8px"} justifyContent={"flex-start"}>
          {SelectTokenIcon[pairTokenId]}
          <Box sx={{
            fontWeight: 500, fontSize: "14px"
          }}>{getSelectTokenName(chainId, pairTokenId)}</Box>
        </Stack>
      </Box>
    </Button>}
    value={value}
    footer={footer}
    onChange={onChange}
  />
}