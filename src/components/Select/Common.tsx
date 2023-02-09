import { Trans } from "@lingui/macro"
import { Box, Button, Menu, MenuItem, Stack } from "@mui/material"
import { FC, useCallback, useMemo, useState } from "react"
import ClipLoader from "react-spinners/ClipLoader"
import { CustomSelect, CustomSelectOption } from "."
import { currentChainId } from "../../constants/chains"
import { getSelectTokenName, SelectToken, SelectTokenIcon } from "../../constants/token"
import { useAppSelector } from "../../state/hooks"
import { FINDCoinIcon, KeyboardArrowDownIcon, KeyboardArrowUpIcon } from "../Icons"


export type TokenNameProps = {
  options: string[]
  value: string
  disabled?: boolean
  loading?: boolean
  existedTokenName?: Record<string, string>
  logo?: string
  onChange: (value: string) => void
}

export const TokenNameSelect: FC<TokenNameProps> = ({ options, value, disabled, loading, existedTokenName, logo, onChange }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const handleChange = useCallback((v: string) => {
    // setValue(v)
    onChange(v)
  }, [onChange])
  const logoIcon = useMemo(() => {
    if (logo) {
      return <img
        style={{
          borderRadius: "10px",
        }}
        src={logo}
        alt=""
        width={26}
        height={26}
      />
    }
    return <FINDCoinIcon />
  }, [logo])
  const selected = useCallback((option?: any) => {
    if (options.length === 0 || !option) return <Stack direction={"row"} alignItems={"center"} spacing={"8px"} >
      {loading ? <ClipLoader size={18} loading color="#444A9E" /> : logoIcon}
      <Box sx={{
        fontWeight: "500 !important", fontSize: "14px"
      }}><Trans>Please enter Github URL first</Trans></Box>
    </Stack>
    const { value } = option
    return <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} sx={{ width: "100%" }}>
      <Stack direction={"row"} alignItems={"center"} spacing={"8px"} >
        {logoIcon}
        <Box sx={{
          fontWeight: "500 !important", fontSize: "14px", color: "inuse.blacktext"
        }}>{value}</Box>
      </Stack>
      {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
    </Stack>
  }, [isOpen, loading, logoIcon, options.length])
  return (
    <>
      <CustomSelect
        disabled={disabled || false}
        value={value || (options.length > 0 ? options[0] : "")}
        onChange={handleChange}
        renderValue={selected}
        onListboxOpenChange={setIsOpen}
        componentsProps={{
          root: {
            style: {
              width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            },
          },
        }}
      >
        {options.length > 0 ? options.map((value, index) => (
          <CustomSelectOption value={value} key={index}>
            <Stack direction={"row"} alignItems={"center"} spacing={"8px"} >
              {logoIcon}
              <Box sx={{
                fontWeight: "500 !important", fontSize: "14px", color: "inuse.blacktext"
              }}>{value}</Box>
            </Stack>
          </CustomSelectOption>
        )) : <CustomSelectOption value="">
          <Stack direction={"row"} alignItems={"center"} spacing={"8px"} >
              {loading ? <ClipLoader size={18} loading color="#444A9E" /> : logoIcon}
            <Box sx={{
              fontWeight: "500 !important", fontSize: "14px"
            }}><Trans>Please enter Github URL first</Trans></Box>
          </Stack>
        </CustomSelectOption>}
      </CustomSelect>
      {(existedTokenName && !!existedTokenName[value]) && <Box sx={{ fontSize: "12px", color: "inuse.secondary", mt: "8px", fontWeight: 500, lineHeight: "18px" }}>
        <Trans>The same token name already exists, would you consider replacing it?</Trans>
      </Box>}
    </>
  );
};

export type TokenNameInputProps = {
  value: string
  loading?: boolean
  disabled?: boolean
  existedTokenName?: Record<string, string>
  logo?: string
}

export const TokenNameInput: FC<TokenNameInputProps> = ({ value, disabled, loading, existedTokenName, logo }) => {
  const logoIcon = useMemo(() => {
    if (logo) {
      return <img
        style={{
          borderRadius: "10px",
        }}
        src={logo}
        alt=""
        width={24}
        height={24}
      />
    }
    return <FINDCoinIcon />
  }, [logo])
  return (
    <>
      <Box sx={{
        fontSize: "14px", height: "40px", width: "100%", bgcolor: "inuse.secondarytext", border: 0, borderRadius: "10px", p: "8px 10px", textAlign: "left", color: disabled ? "inuse.graytext" : "inuse.blacktext", cursor: disabled ? "not-allowed" : "default"
      }}>
        {value ? <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} sx={{ width: "100%" }}>
          <Stack direction={"row"} alignItems={"center"} spacing={"8px"} >
            {logoIcon}
            <Box sx={{
              fontWeight: "500 !important", fontSize: "14px", color: "inuse.blacktext"
            }}>{value}</Box>
          </Stack>
        </Stack> : <Stack direction={"row"} alignItems={"center"} spacing={"8px"} >
          {loading ? <ClipLoader size={18} loading color="#444A9E" /> : logoIcon}
          <Box sx={{
            fontWeight: "500 !important", fontSize: "14px"
          }}><Trans>Please enter Github URL first</Trans></Box>
        </Stack>}
      </Box>
      {(existedTokenName && !!existedTokenName[value]) && <Box sx={{ fontSize: "12px", color: "inuse.secondary", mt: "8px", fontWeight: 500, lineHeight: "18px" }}>
        <Trans>The same Token name already exists, would you consider replacing it?</Trans>
      </Box>}
    </>
  );
};

export type PairTokenProps = {
  disabledSelect?: boolean
  options: SelectToken[]
  value: SelectToken
  onSelect: (token: SelectToken) => void
}

export const PairTokenSelect: FC<PairTokenProps> = ({ disabledSelect, onSelect, options, value }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const handleOpenSelect = useCallback((event: any) => {
    setAnchorEl(event.currentTarget);
  }, []);
  const handleCloseSelect = useCallback(() => {
    setAnchorEl(null);
  }, [])
  // const [value, setValue] = useState<number>(initValue || 0)
  const handleClickSelect = useCallback((i: SelectToken) => {
    handleCloseSelect()
    onSelect(i)
  }, [handleCloseSelect, onSelect])
  const chainId = useAppSelector((state) => currentChainId(state.application.chainId));
  return <>
    <Button variant="contained" disabled={disabledSelect || false} sx={{
      borderRadius: "10px",
      boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
      bgcolor: "inuse.text",
      color: "inuse.blacktext",
      fontSize: "14px",
      lineHeight: "18px",
      fontWeight: 500,
      width: "129px",
      p: "7.2px 10px",
      "&:hover": {
        bgcolor: "inuse.text",
      },
      "&:disabled": {
        bgcolor: "inuse.text",
        boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
        color: "inuse.graytext",
      }
    }} onClick={handleOpenSelect}>
      <Box sx={{
        display: "flex", flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", width: "100%",
      }}>
        <Stack direction={"row"} alignItems={"center"} spacing={"8px"} justifyContent={"flex-start"}>
          {SelectTokenIcon[value]}
          <Box sx={{
            fontWeight: 500, fontSize: "14px"
          }}>{getSelectTokenName(chainId, value)}</Box>
        </Stack>
        {!disabledSelect && (!anchorEl ? <KeyboardArrowDownIcon sx={{ fontSize: "24px", marginLeft: "8px" }} /> : <KeyboardArrowUpIcon sx={{ fontSize: "24px", marginLeft: "8px" }} />)}
      </Box>
    </Button>
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleCloseSelect}
      PaperProps={{
        sx: {
          bgcolor: "inuse.text",
          borderRadius: "10px",
          boxShadow: "unset",
          mt: "3px"
        },
      }}
      MenuListProps={{
        variant: "selectedMenu",
        autoFocusItem: true,
        sx: {
          p: "0"
        }
      }}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      {options.map((t, index) => (<MenuItem
        sx={{ padding: "8px 10px", width: "129px" }}
        key={index}
        onClick={() => handleClickSelect(t)}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={"8px"} justifyContent={"flex-start"}>
          {SelectTokenIcon[t]}
          <Box sx={{
            fontWeight: 500, fontSize: "14px"
          }}>{getSelectTokenName(chainId, t)}</Box>
        </Stack>
      </MenuItem>))}
    </Menu>
  </>
}