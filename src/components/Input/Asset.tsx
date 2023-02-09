import { Trans } from "@lingui/macro";
import { Avatar, Box, Button } from "@mui/material";
import { FC, ReactElement, useMemo } from "react";

import { TokenData } from "../../hooks/useTokens";
import { FINDCoinIcon, KeyboardArrowDownIcon } from "../Icons";
import { NumberInput } from "./Common";
import { CommonTooltip } from "../Tooltip/Common";

type AssetInputProps = {
  value?: string;
  loading?: boolean;
  onChange?: (value: string) => void;

  selectDom?: ReactElement;
  select?: TokenData;
  onSelect?: () => void;
  disabledSelect?: boolean;

  disabledInput?: boolean;
  footer?: ReactElement;

  max?: number;
  min?: number;
}

const AssetInput: FC<AssetInputProps> = ({ value, loading, onChange, selectDom, select, onSelect, footer, disabledSelect, disabledInput, min, max }) => {
  const defalutSelectDom = useMemo(() => {
    if (!select) return <Button variant="contained" sx={{
      borderRadius: "10px",
      boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
      bgcolor: "inuse.text",
      color: "inuse.blacktext",
      fontSize: "14px",
      lineHeight: "18px",
      fontWeight: 500,
      p: "10px 10px",
      "&:hover": {
        bgcolor: "inuse.text",
        boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.12)'
      }
    }} onClick={onSelect} >
      <Trans>Select a token</Trans>
      <KeyboardArrowDownIcon sx={{ fontSize: "24px", marginLeft: "4px" }} />
    </Button>
    return <Button variant="contained" disabled={disabledSelect || false} sx={{
      borderRadius: "10px",
      boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
      bgcolor: "inuse.text",
      color: "inuse.blacktext",
      fontSize: "14px",
      lineHeight: "18px",
      fontWeight: 500,
      p: "7.2px 10px",
      "&:hover": {
        bgcolor: "inuse.text",
        boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.12)'
      },
      "&:disabled": {
        bgcolor: "inuse.text",
        boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
        color: "inuse.blacktext",
      },
    }} onClick={onSelect}>
      <Box sx={{
        display: "flex", flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Box sx={{
          display: "flex", flexDirection: "row", alignItems: "center",
        }}>
          {select.logo ? <Avatar sx={{ width: 24, height: 24 }} src={select.logo} /> : <FINDCoinIcon sx={{ width: 24, height: 24 }} />}
          <CommonTooltip title={<Box>
            {select?.symbol} <Box sx={{ color: "inuse.graytext" }}>{select?.github?.replace("https://", "")}</Box>
          </Box>} placement="top">
            <Box sx={{
              maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ml: "12px"
            }}>{select.symbol}</Box>
          </CommonTooltip>
        </Box>
        {!disabledSelect && <KeyboardArrowDownIcon sx={{ fontSize: "24px", marginLeft: "8px" }} />}
      </Box>
    </Button>
  }, [select, onSelect, disabledSelect])

  return useMemo(() => (
    <NumberInput 
      value={value}
      onChange={onChange}
      footer={footer}
      disabledInput={disabledInput}
      min={min}
      max={max}
      selectDom={selectDom || defalutSelectDom}
      decimalScale={18}
      loading={loading}
    />
  ), [defalutSelectDom, disabledInput, footer, loading, max, min, onChange, selectDom, value])
}

export default AssetInput;