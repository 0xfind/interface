import { t, Trans } from "@lingui/macro";
import { Avatar, Box, DialogContent, Divider, InputBase, ListItem, ListItemButton, ListItemText, Stack } from "@mui/material";
import { FC, useCallback, useMemo, useState } from "react";
import { FixedSizeList } from 'react-window';
import { CustomDialog, CustomDialogTitle } from ".";
import { TokenData } from "../../hooks/useTokens";
import { EmptyRow } from "../Box/Common";


export type Asset = {
  token: TokenData,
  logo: string
  valueUSD: number
  priceUSD: number
  amount: number
}

type SelectTokenDialogProps = {
  open: boolean;
  onClose: () => void;
  assets: Asset[];
  onClick: (i: number) => void;
}

const SelectTokenDialog: FC<SelectTokenDialogProps> = ({ open, onClose, assets, onClick }) => {
  const [searchKeyword, setSearchKeyword] = useState<string>()
  const filteredAssets = useMemo(() => assets.filter(asset => {
    if (!searchKeyword) return true
    return asset.token.token?.symbol?.toLowerCase().includes(searchKeyword.toLowerCase()) || asset.token.token?.name?.toLowerCase().includes(searchKeyword.toLowerCase()) || asset.token.token?.address?.toLowerCase().includes(searchKeyword.toLowerCase())
  }), [assets, searchKeyword])
  const SelectTokenItem = useCallback(({ index, style }) => {
    const asset: Asset = filteredAssets[index]
    return <ListItem style={style} key={index} component="div" disablePadding >
      <ListItemButton sx={{
        height: "100%", display: "flex", flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", p: "7px 20px",
        "&:hover": {
          bgcolor: "inuse.secondarytext",
        }
      }} disabled={asset.token.symbol === "FIND"} onClick={() => onClick(index)} >
        <Stack direction={"row"} alignItems={"center"} sx={{ maxWidth: "350px" }}>
          <Avatar src={asset.logo} sx={{ width: 24, height: 24 }} />
          <ListItemText
            primary={asset.token.symbol}
            secondary={asset.token.github?.replace("https://", "")}
            sx={{
              ml: "9px",
              "& .MuiListItemText-primary": {
                fontSize: "1rem", fontWeight: 500, lineHeight: "24px", color: "inuse.blacktext", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%"
              },
              "& .MuiListItemText-secondary": {
                fontSize: "12px", fontWeight: 500, lineHeight: "18px", color: "inuse.greytext", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%"
              }
            }}
          />
        </Stack>
      </ListItemButton>
    </ListItem>
  }, [filteredAssets, onClick])
  return <CustomDialog
    open={open}
    onClose={onClose}
  >
    <CustomDialogTitle onClose={onClose} >
      <Trans>Select token</Trans>
    </CustomDialogTitle>
    <DialogContent>
      <InputBase sx={{
        position: "relative",
        display: "flex",
        p: "10px 12px",
        alignItems: "center",
        width: "100%",
        whiteSpace: "nowrap",
        background: "none",
        outline: "none",
        borderRadius: "20px",
        color: "inuse.blacktext",
        border: "1px solid #F4F5F9",
        appearance: "none",
        fontSize: "18px",
        transition: "border 100ms ease 0s",
        "&:focus": {
          border: "1px solid #9F9F9D",
          outline: "none",
        },
      }} onChange={(e) => setSearchKeyword(e.target.value)} placeholder={t`Search name or paste address`} />
    </DialogContent>
    <Divider sx={{
      borderColor: 'inuse.secondarytext'
    }} />
    {filteredAssets.length > 0 ? <FixedSizeList
      height={336}
      width={'100%'}
      itemSize={56}
      itemCount={filteredAssets.length}
      overscanCount={5}
      style={{
        marginTop: "18px",
        marginBottom: "65px"
      }}
    >
      {SelectTokenItem}
    </FixedSizeList> : <Box sx={{ minHeight: '336px', pt: '80px' }}>
      <EmptyRow title={<Trans>There is no token</Trans>} />
    </Box>}
  </CustomDialog>
}

export default SelectTokenDialog;