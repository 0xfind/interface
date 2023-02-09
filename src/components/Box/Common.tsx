import { Box, Button, Stack, BoxProps } from "@mui/material"
import { FC, ReactElement, useCallback, useEffect, useState } from "react"
import { CopyIcon, EmptyIcon, CopyCompleteIcon } from "../Icons";
import { Connector } from "@web3-react/types";
import { getConnection, getConnectionIcon, getConnectionName } from "../../connectors/utils";
import { CommonTooltip } from "../Tooltip/Common";

type TooltipBoxProps = {
  width: string;
} & BoxProps

export const TooltipBox: FC<TooltipBoxProps> = ({ width, children, sx, ...props }) => {
  const [open, setOpen] = useState<boolean>(false)

  const onMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const currentWidth = e.currentTarget.scrollWidth;
    const parentWidth = e.currentTarget?.offsetWidth || 0;
    // console.log(currentWidth, e.currentTarget.offsetWidth)
    if (currentWidth > parentWidth) {
      setOpen(true);
    }
  }, [])

  const onMouseLeave = useCallback(() => {
    setOpen(false);
  }, [])

  return <CommonTooltip open={open} title={children || ''} placement={"right"} followCursor>
    <Box sx={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", width, ...sx }} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave} {...props}>
      {children}
    </Box>
  </CommonTooltip>
}

type CopyTextProps = {
  text: string,
  content?: string,
  color?: string,
  copy: (text: string) => Promise<boolean>
}

export const CopyText: FC<CopyTextProps> = ({ text, copy }) => {
  const [copyed, setCopyed] = useState(false)
  useEffect(() => {
    if (copyed) {
      setTimeout(() => {
        setCopyed(false)
      }, 1000)
    }
  }, [copyed])
  return <Stack direction="row" spacing={1.375} sx={{
    color: "inuse.graytext", alignItems: "center", fontWeight: 500, fontSize: "0.875rem"
  }}>
    {copyed ? <CopyCompleteIcon sx={{ fontSize: "18px" }} /> : <CopyIcon sx={{ fontSize: "18px", "&:hover": { color: "inuse.blacktext" } }} onClick={() => {
      copy(text)
      setCopyed(true)
    }} />}
    <Box>{text}</Box>
  </Stack>
}

export const AddressCopyText: FC<CopyTextProps> = ({ text, color, content, copy }) => {
  const [copyed, setCopyed] = useState(false)
  useEffect(() => {
    if (copyed) {
      setTimeout(() => {
        setCopyed(false)
      }, 1000)
    }
  }, [copyed])
  return <Stack direction="row" spacing={1} sx={{
    color: color || "inuse.graytext", alignItems: "center", fontWeight: 500, fontSize: "0.875rem"
  }}>
    <Box>{content || text}</Box>
    {copyed ? <CopyCompleteIcon sx={{ fontSize: "18px" }} /> : <CopyIcon sx={{ fontSize: "18px", color: "inuse.graytext", "&:hover": { color: "inuse.blacktext" } }} onClick={() => {
      copy(text)
    setCopyed(true)
    }}/>}
  </Stack>
}

type ContentRawProps = {
  sx?: any,
  children: ReactElement | ReactElement[],
}

export const ContentRaw: FC<ContentRawProps> = ({ sx, children }) => {
  return <Stack alignItems={'center'} spacing={'8px'} direction="row" sx={
    {...{fontSize: '14px', fontWeight: 500, lineHeight: "21px", color: 'inuse.blacktext'}, ...sx}
  }>
    {children}
  </Stack>
}

export const EmptyRow = ({title} : {title: ReactElement}) => {
  return <Stack sx={{ width: '100%', ml: 'auto', mr: 'auto' }} direction={'row'} justifyContent={'center'}>
    <Stack>
      <EmptyIcon sx={{ fontSize: '200px', width: "200px", height: "131px" }} />
      <Box sx={{
        fontSize: "18px", lineHeight: "22px", fontWeight: 700, color: "inuse.inputbg", textAlign: "center", mt: "16px"
      }}>{title}</Box>
    </Stack>
  </Stack>
}

type WalletChoiceProps = {
  connector: Connector,
  isMetaMask?: boolean,
  onClick: (connector: Connector) => void,
}

export const WalletChoice: FC<WalletChoiceProps> = ({ connector, onClick, isMetaMask }) => {
  return <Button
    sx={{
      color: "#262626",
      textTransform: "unset",
      fontWeight: 400,
      lineHeight: "24px",
      bgcolor: "inuse.text",
      border: "1px solid #ECEBF0",
      "&:hover": { bgcolor: "inuse.formbg" },
      p: "18px"
    }}
    variant="contained"
    disableElevation
    onClick={() => onClick(connector)}
  >
    <Box sx={{
      display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      width: "100%",
    }}>
      <Box sx={{
        color: "inuse.blacktext", fontWeight: 700, fontSize: "14px", lineHeight: "18px",
      }}>{getConnectionName(getConnection(connector).type, isMetaMask)}</Box>
      {getConnectionIcon(getConnection(connector).type)}
    </Box>
  </Button>
}