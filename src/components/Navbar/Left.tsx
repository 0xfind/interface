import { Box, Stack } from "@mui/material";
import { useCallback } from "react";

import { Community } from "../../constants/navbar";
import CustomMenu, { CustomMenuItem } from "../Menu";
import Logo from "./Logo";
import { t } from "@lingui/macro";
import { useNavigate } from "react-router-dom";
import { useLocalsInfo } from "../../hooks/useLocales";

const Left = () => {
  const navigate = useNavigate();

  const handleClick = useCallback((name: string) => {
    navigate(name, { replace: true });
  }, [navigate])

  const handleHrefClick = useCallback((link?: string) => {
    window.open(link, '_blank');
  }, [])

  const { whitepaperURL, tutorialURL } = useLocalsInfo()

  return (
    <Stack
      sx={{ whiteSpace: "nowrap", alignItems: "center" }}
      direction="row"
      spacing={6}
    >
      <Box>
        <a href="/" style={{ display: "inline-block", marginTop: "5.5px" }}>
          {<Logo />}
        </a>
      </Box>
      <Stack
        direction="row"
        spacing={3.25}
        sx={{
          fontWeight: 700,
          display: {
            xs: "none",
            sm: "none",
            md: "flex",
          },
        }}
      >
        <CustomMenu key={"sp"} content={t`Assets`} onClick={() => handleClick("assets")} />
        <CustomMenu key={"cm"} content={t`Community`}>
          {Object.keys(Community).map((key) => (
            <CustomMenuItem key={key} onClick={() => handleHrefClick(Community[key])}>
              {key}
            </CustomMenuItem>
          ))}
        </CustomMenu>
        <CustomMenu key={"doc"} content={t`Doc`} >
          <CustomMenuItem key={'whitepaper'} onClick={() => handleHrefClick(whitepaperURL)}>
            <Stack direction={"row"} alignItems={"center"} justifyContent={"center"} sx={{ width: "70px" }}>
              {t`White Paper`}
            </Stack>
          </CustomMenuItem>
          <CustomMenuItem key={'tutorial'} onClick={() => handleHrefClick(tutorialURL)}>
            <Stack direction={"row"} alignItems={"center"} justifyContent={"center"} sx={{ width: "70px" }}>
              {t`Tutorial`}
            </Stack>
          </CustomMenuItem>
        </CustomMenu>
      </Stack>
    </Stack>
  );
};

export default Left;
