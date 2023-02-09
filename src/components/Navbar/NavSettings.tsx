import { Box, Divider, IconButton, Menu, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SupportedCurrency } from "../../constants/currency";

import { Languages } from "../../constants/locale";
import { setCurrentCurrency } from "../../state/user/reducer";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { VerticalSettingIcon, SimpleTickIcon } from "../Icons";
import { CustomMenuItem } from "../Menu";

export default function NavSettings() {
  const [currentSelectedLanguage, setCurrentSelectedLanguage] = useState("en");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentCurrency = useAppSelector((state) => state.user.currentCurrency || SupportedCurrency.USD)
  const dispatch = useAppDispatch()
  
  useEffect(() => {
    setCurrentSelectedLanguage(localStorage.getItem("lang") || "en");
  }, []);

  const setLanguage = useCallback((newLanguage: string) => {
    setCurrentSelectedLanguage(newLanguage);
    localStorage.setItem("lang", newLanguage);
    window.location.reload();
  }, []);

  const setCurrency = useCallback((currency: string) => {
    dispatch(setCurrentCurrency(currency as SupportedCurrency))
  }, [dispatch])

  const languageMenu = useMemo(() => {
    return Object.keys(Languages).map((lang) => <CustomMenuItem
      key={lang}
      value={lang}
      onClick={() => setLanguage(lang)}
    >
      <Stack direction={"row"} alignItems={"center"} justifyContent={"center"} sx={{ width: "65px" }}>
        <Box sx={{ width: "50px" }}>{Languages[lang].long}</Box>
        {currentSelectedLanguage === lang && <SimpleTickIcon sx={{ width: "24px", height: "24px", position:"absolute", right: "10px" }} />}
      </Stack>
    </CustomMenuItem>)
  }, [currentSelectedLanguage, setLanguage])

  const currencyMenu = useMemo(() => {
    return Object.keys(SupportedCurrency).map((currency) => <CustomMenuItem
      key={currency}
      value={currency}
      onClick={() => setCurrency((SupportedCurrency as any)[currency])}
    >
      <Stack direction={"row"} alignItems={"center"} justifyContent={"center"} sx={{ width: "65px" }}>
        <Box sx={{ width: "50px" }}>{(SupportedCurrency as any)[currency].toUpperCase()}</Box>
        {currentCurrency === (SupportedCurrency as any)[currency] && <SimpleTickIcon sx={{ width: "24px", height: "24px", position: "absolute", right: "10px" }} />}
      </Stack>
    </CustomMenuItem>)
  }, [currentCurrency, setCurrency])

  return (
    <Box
      sx={{
        color: "#fff",
        lineHeight: "22px",
        flexDirection: "row",
        display: {
          xs: "none",
          sm: "none",
          md: "flex",
        },
        alignItems: "center",
      }}
    >
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget) }
        size="small"
        sx={{ 
          borderRadius: "20px",
          width: "32px",
          height: "32px",
        }}
      >
        <VerticalSettingIcon sx={{ fontSize: "24px", color: "inuse.text" }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        MenuListProps={{
          variant: "selectedMenu",
          autoFocusItem: true,
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            bgcolor: "inuse.text",
            boxShadow: "0 4px 4px rgba(141, 141, 141, 0.25)",
            borderRadius: "10px",
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'inuse.text',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {languageMenu}
        <Divider />
        {currencyMenu}
      </Menu>
    </Box>
  );
}
