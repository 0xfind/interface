import { t, Trans } from "@lingui/macro";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Stack,
} from "@mui/material";
import { FC, useCallback, useEffect, useState } from "react";

import { Languages } from "../../constants/locale";
import { Community } from "../../constants/navbar";

type MobileMenuProps = {
  onClose: () => void;
};

const MobileMenu: FC<MobileMenuProps> = ({ onClose }) => {
  const [mobileMenuSubOpen, setMobileMenuSubOpen] = useState<
    Record<string, boolean>
  >({});
  const handleMobileMenuSub = useCallback((key: string) => {
    setMobileMenuSubOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const [currentSelectedLanguage, setCurrentSelectedLanguage] = useState("en");

  useEffect(() => {
    setCurrentSelectedLanguage(localStorage.getItem("lang") || "en");
  }, []);
  const pageHeight = document.documentElement.clientHeight;

  const setLanguage = useCallback((newLanguage: string) => {
    setCurrentSelectedLanguage(newLanguage);
    localStorage.setItem("lang", newLanguage);
    window.location.reload();
  }, []);

  const renderLanguageOption = useCallback(
    (lang: string) => {
      return (
        <ListItemButton
          sx={{ pl: 4 }}
          onClick={() => setLanguage(lang)}
          key={lang}
        >
          <ListItemText primary={Languages[lang].long} />
        </ListItemButton>
      );
    },
    [setLanguage]
  );

  const handleHref = useCallback((href: string) => {
    window.open(href, "_blank");
  }, []);

  return (
    <List
      sx={{ width: "100%", height: `${pageHeight}px`, bgcolor: "#FFFFFF" }}
      component="nav"
      aria-labelledby="nested-list-subheader"
      subheader={
        <ListSubheader
          component="div"
          id="nested-list-subheader"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#FFFFFF",
          }}
        >
          <Box>
            <Trans>Menu</Trans>
          </Box>
          <IconButton aria-label="close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </ListSubheader>
      }
    >
      <ListItemButton>
        <ListItemText
          primary={t`Swarm Invest`}
          primaryTypographyProps={{
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        />
      </ListItemButton>
      <ListItemButton onClick={() => handleMobileMenuSub("cm")}>
        <ListItemText
          primary={t`Community`}
          primaryTypographyProps={{
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        />
        {mobileMenuSubOpen["cm"] ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={mobileMenuSubOpen["cm"]} timeout="auto" unmountOnExit>
        <List
          component="div"
          disablePadding
          sx={{
            bgcolor: "#ECEBF0",
          }}
        >
          {Object.keys(Community).map((key) => (
            <ListItemButton
              sx={{ pl: 4 }}
              onClick={() => handleHref(Community[key])}
              key={key}
            >
              <ListItemText primary={key} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
      <ListItemButton>
        <ListItemText
          primary={t`Doc`}
          primaryTypographyProps={{
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        />
      </ListItemButton>
      <ListItemButton onClick={() => handleMobileMenuSub("lg")}>
        <ListItemText
          primary={
            <Stack
              direction={"row"}
              spacing={0.75}
              sx={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box>{Languages[currentSelectedLanguage]?.long ?? "English"}</Box>
              <LanguageOutlinedIcon />
            </Stack>
          }
          primaryTypographyProps={{
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        />
        {mobileMenuSubOpen["lg"] ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={mobileMenuSubOpen["lg"]} timeout="auto" unmountOnExit>
        <List
          component="div"
          disablePadding
          sx={{
            bgcolor: "#ECEBF0",
          }}
        >
          {Object.keys(Languages).map(renderLanguageOption)}
        </List>
      </Collapse>
    </List>
  );
};

export default MobileMenu;
