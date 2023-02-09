import { Trans } from "@lingui/macro";
import { Box, BoxProps, Stack } from "@mui/material";
import { FC, forwardRef, ForwardedRef, useMemo } from "react";

import { SupportedCurrency } from "../../constants/currency";
import useCurrency from "../../hooks/useCurrency";
import { formatNumber } from "../../utils";
import { CommonTooltip } from "../Tooltip/Common";

type DataCardProps = {
  large?: boolean;

  valueA: number;
  nameA?: any;
  currencyA?: SupportedCurrency;

  valueB?: number;
  nameB?: any;
  currencyB?: SupportedCurrency;

  bees?: boolean

  beesType?: 'home' | 'claim';
} & BoxProps;

type MortgageCardProps = {
  width: string;
  minHeight?: string;
  maxHeight?: string;
} & BoxProps

export const MortgageCard = forwardRef(
  function MortgageCard(props: MortgageCardProps, ref?: ForwardedRef<any>) {
    const { width, minHeight, maxHeight, ...ep } = props;
    return <Box ref={ref} sx={{
      width,
      minHeight,
      maxHeight,
      bgcolor: "inuse.text",
      borderRadius: "20px",
      // boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
      padding: "34px 42px",
      fontSize: "14px",
      lineHeight: "18px",
      color: "inuse.blacktext",
      fontWeight: "500",
    }} {...ep} />
  }
)

export const DataCard: FC<DataCardProps> = ({
  large,
  valueA,
  nameA,
  currencyA,
  valueB,
  nameB,
  currencyB,
  bees,
  beesType,
  ...props
}) => {
  const {
    symbol: currencyASymbol, symbolPosition: currencyASymbolPosition, currency: currencyAValue, currencyUnit: currencyAUnit
  } = useCurrency({ base: currencyA, value: valueA})

  const {
    symbol: currencyBSymbol, symbolPosition: currencyBSymbolPosition, currency: currencyBValue, currencyUnit: currencyBUnit
  } = useCurrency({ base: currencyB, value: valueB })

  const textAFontSize = useMemo(() => large ? ["24px", "24px", "76px"] : ["14px", "24px", "48px"], [large])
  const textBFontSize = useMemo(() => large ? ["12px", "36px", "20px"] : ["12px", "24px", "14px"], [large])

  return (
    <Box {...props}>
      {!!bees && (beesType === "home" ? <Box sx={{
        backgroundImage: "url('assets/bees.png')",
        backgroundSize: "47.3px",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        transform: "rotate(-30deg)",
        width: "80px",
        height: "80px",
        position: "relative",
        top: "20px",
        left: "-60px",
      }} /> : <CommonTooltip placement="right" title={<Trans>The HBG token has been claimed by the open source project owner</Trans>}>
        <Box sx={{
          backgroundImage: "url('assets/bees.png')",
          backgroundSize: "47.3px",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          transform: "rotate(-30deg)",
          width: "80px",
          height: "80px",
          position: "relative",
          top: "20px",
          left: "-60px",
        }} />
      </CommonTooltip>)  }
      <Box
        sx={{
          backgroundImage: "url('assets/v1.png')",
          width: large ? "320px" : "245px",
          height: large ? "364px" : "275px",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          color: "#2C272D",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: large ? "364px" : "275px",
            display: "flex",
            flexDirection: "column",
            m: "auto",
            fontWeight: 400,
            whiteSpace: "nowrap",
            textAlign: "center"
          }}
        >
          <Box sx={{ mt: large ? "114px" : "90px", fontSize: textAFontSize[0] }}>
            {nameA || <Trans>TVL</Trans>}
          </Box>
          {currencyA ? <Stack justifyContent={"center"} direction={"row"} sx={{ mt: "12px", fontSize: textAFontSize[1] }} spacing={"4px"} alignItems={"baseline"} >
            {currencyASymbolPosition === "prefix" && <Box>{currencyASymbol}&nbsp;</Box>}
            <Box sx={{ fontSize: textAFontSize[2], lineHeight: 1 }}>{currencyAValue}</Box>
            {currencyAUnit && <Box>{currencyAUnit}</Box>}
            {currencyASymbolPosition === "postfix" && <Box>&nbsp;{currencyASymbol}</Box>}
          </Stack> : <Box sx={{ mt: "12px", fontSize: textAFontSize[2], lineHeight: 1 }}>{formatNumber(valueA, 0)}</Box>}
        </Box>
      </Box>
      <Box
        sx={{
          backgroundImage: "url('assets/v2.png')",
          backgroundRepeat: "no-repeat",
          width: large ? "161px" : "122px",
          height: large ? "179px" : "134px",
          backgroundSize: "cover",
          color: "#2C272D",
          position: "relative",
          top: large ? "-365px" : "-277px",
          left: large ? "237px" : "181px",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: large ? "179px" : "134px",
            display: "flex",
            flexDirection: "column",
            m: "auto",
            fontWeight: 400,
            whiteSpace: "nowrap",
            textAlign: "center"
          }}
        >
          <Box sx={{ mt: large ? "50px" : "35px", fontSize: textBFontSize[0] }}>
            {nameB || <Trans>Total HBG</Trans>}
          </Box>
          {currencyB ? <Stack direction={"row"} justifyContent={"center"} sx={{ mt: "12px", fontSize: textBFontSize[2] }} alignItems={"baseline"} >
            {currencyBSymbolPosition === "prefix" && <Box>{currencyBSymbol}&nbsp;</Box>}
            <Box sx={{ fontSize: textBFontSize[1], lineHeight: 1 }}>{currencyBValue}</Box>
            {currencyBUnit && <Box>{currencyBUnit}</Box>}
            {currencyBSymbolPosition === "postfix" && <Box>&nbsp;{currencyBSymbol}</Box>}
          </Stack> : <Box sx={{ mt: "12px", fontSize: textBFontSize[1], lineHeight: 1 }}>{formatNumber(valueB, 0)}</Box>}
        </Box>
      </Box>
    </Box>
  );
};
