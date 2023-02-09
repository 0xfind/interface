import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ReactElement } from "react";
import { Box } from "@mui/material";
import { KeyboardArrowDownIcon, KeyboardArrowUpIcon } from "../Icons";
import { CommonTooltip } from "../Tooltip/Common";

export type CreateFormData = {
  pairToken: Token;
  github?: string;
  githubLogo?: string;
  githubStars?: string;
  githubErrorTips?: string;
  githubExistedId?: string;
  tokenName?: string;
  nftPrice?: string;
  nftPriceDiscounted?: string;
  freeForOwner?: string;
  freeForOwnerErrorTips?: string;

  multiplyOutFindAmount?: CurrencyAmount<Token>;
  multiplyInFindAmount?: CurrencyAmount<Token>;
  multiplyOutOSPAmount?: CurrencyAmount<Token>;
  multiplyFeeAmount?: CurrencyAmount<Token>;
  multiplyAmount?: CurrencyAmount<Token>;
  multiplyPayMaxAmount?: CurrencyAmount<Token>;
}

export const FormLabel = ({ label, info, mt, collapse, onCollapse }: { label: ReactElement, info?: ReactElement, mt?: string, collapse?: boolean, onCollapse?: (c: boolean) => void }) => {
  return <Box sx={{
    mb: "8px", mt: `${mt ?? '16px'}`, fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg",
    display: "flex", alignItems: "center", justifyContent: "space-between", cursor: `${onCollapse ? 'pointer' : 'default'}`,
  }} onClick={() => onCollapse && onCollapse(!collapse)}>
    <Box sx={{
      display: "flex", alignItems: "center", 
    }}>
      <Box>{label}</Box>
      {!!info && <CommonTooltip title={info} placement="right">
        <InfoOutlinedIcon sx={{ ml: "8px", fontSize: "16px" }} />
      </CommonTooltip>}
    </Box>
    {!!onCollapse && <Box sx={{
      display: "flex", alignItems: "center",
    }}>
      {collapse ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
    </Box>}
  </Box>
}

