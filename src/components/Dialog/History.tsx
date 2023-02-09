import { Trans } from "@lingui/macro";
import { Box, Link, Stack } from "@mui/material";
import { FC, useCallback } from "react";
import { FixedSizeList } from 'react-window';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { EmptyRow } from "../Box/Common";
import { CustomDialog, CustomDialogTitle } from ".";

export type History = {
  text: string;
  link: string;
  timestamps: string;
}

type HistoryDialogProps = {
  open: boolean;
  onClose: () => void;
  histories: History[];
}

export const MortgageHistoryDialog: FC<HistoryDialogProps> = ({ open, onClose, histories }) => {
  const HistoryItem = useCallback(({ index, style }) => {
    const history: History = histories[index]
    return <Stack key={index} direction={"row"} alignItems={"center"} justifyContent="space-between" sx={{
      p: "0 27px 0 27px",
    }} style={style}>
      <Link sx={{
        display: "flex", flexDirection: "row", alignItems: "center",
        color: "inuse.secondary", fontWeight: 500, fontSize: "16px",
        cursor: "pointer",
      }} underline="hover" href={history.link} target="_blank">
        <span>{history.text} <CallMadeIcon sx={{ fontSize: "16px", ml: "6px" }} /></span>
      </Link>
      <CheckCircleOutlineOutlinedIcon sx={{ fontSize: "16px", color: "inuse.primary" }} />
    </Stack>
  }, [histories])
  return <CustomDialog
    open={open}
    onClose={onClose}
  >
    <CustomDialogTitle onClose={onClose} >
      <Trans>History</Trans>
    </CustomDialogTitle>
    {histories.length === 0 && <Box sx={{
      minHeight: '300px'
    }}>
      <EmptyRow title={<Trans>There is no history</Trans>} />
    </Box>}
    {(histories.length > 0 && histories.length <= 100) && <Stack direction={"column"} spacing="12px" sx={{
      mt: "10px", mb: "28px"
    }}>
      {histories.map((_, index) => (HistoryItem({ index, style: {} })))}
    </Stack>}
    {histories.length > 100 && <FixedSizeList
      height={216}
      width={'100%'}
      itemSize={36}
      itemCount={histories.length}
      overscanCount={3}
      style={{
        marginTop: "10px",
        marginBottom: "28px"
      }}
    >
      {HistoryItem}
    </FixedSizeList>}
  </CustomDialog>
}

export const CollectFeeHistoryDialog: FC<HistoryDialogProps> = ({ open, onClose, histories }) => {
  const HistoryItem = useCallback(({ index, style }) => {
    const history: History = histories[index]
    return <Stack key={index} direction={"row"} alignItems={"center"} justifyContent="space-between" sx={{
      p: "0 27px 0 27px",
    }} style={style}>
      <Link sx={{
        display: "flex", flexDirection: "row", alignItems: "center",
        color: "inuse.secondary", fontWeight: 500, fontSize: "16px", lineHeight: "24px",
        cursor: "pointer",
      }} underline="hover" href={history.link} target="_blank">
        <span>{history.text} <CallMadeIcon sx={{ fontSize: "16px", ml: "6px" }} /></span>
      </Link>
      <CheckCircleOutlineOutlinedIcon sx={{ fontSize: "16px", color: "inuse.primary" }} />
    </Stack>
  }, [histories])
  return <CustomDialog
    open={open}
    onClose={onClose}
  >
    <CustomDialogTitle onClose={onClose} >
      <Trans>History</Trans>
    </CustomDialogTitle>
    {histories.length === 0 && <Box sx={{
      minHeight: '300px', mt: "60px"
    }}>
      <EmptyRow title={<Trans>There is no history</Trans>} />
    </Box>}
    {(histories.length > 0 && histories.length <= 6) && <Stack direction={"column"} spacing="12px" sx={{
      mt: "10px", mb: "28px"
    }}>
      {histories.map((_, index) => (HistoryItem({ index, style: {} })))}
    </Stack>}
    {histories.length > 6 && <FixedSizeList
      height={216}
      width={'100%'}
      itemSize={36}
      itemCount={histories.length}
      overscanCount={3}
      style={{
        marginTop: "10px",
        marginBottom: "28px"
      }}
    >
      {HistoryItem}
    </FixedSizeList>}
  </CustomDialog>
}
