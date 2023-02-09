import {
  Box,
  CssBaseline,
  PaletteMode,
  responsiveFontSizes,
  ThemeProvider,
  unstable_createMuiStrictModeTheme,
  experimental_sx as sx,
} from "@mui/material";
import { SnackbarProvider } from "notistack";
import React, { createContext, useMemo, useState } from "react";
import { HashRouter } from "react-router-dom";
import NoticeContent from "./components/Box/NoticeContent";
import Navbar from "./components/Navbar";
import Router from "./Router";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const ColorModeContext = createContext({ toggleColorMode: () => { } });

interface inuse {
  secondarytext: React.CSSProperties['color'];
  error: React.CSSProperties['color'];
  success: React.CSSProperties['color'];
  primary: React.CSSProperties['color'];
  barbg: React.CSSProperties['color'];
  secondary: React.CSSProperties['color'];
  thirdary: React.CSSProperties['color'];
  hoverbg: React.CSSProperties['color'];
  text: React.CSSProperties['color'];
  bg: React.CSSProperties['color'];
  formbg: React.CSSProperties['color'];
  inputbg: React.CSSProperties['color'];
  graytext: React.CSSProperties['color'];
  blacktext: React.CSSProperties['color'];
  linktext: React.CSSProperties['color'];
  scrollbg: React.CSSProperties['color'];
  homebg: React.CSSProperties['color'];
}

declare module '@mui/material/styles' {
  interface Palette {
    inuse: inuse
  }

  // allow configuration using `createTheme`
  interface PaletteOptions {
    inuse?: inuse
  }
}

function App() {
  const [mode, setMode] = useState<PaletteMode>("light");
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );
  const theme = useMemo(
    () =>
      responsiveFontSizes(
        unstable_createMuiStrictModeTheme({
          palette: {
            mode,
            ...(mode === "light"
              ? {
                background: { default: "#FFFFFF", paper: "#EDEFFC" },
                primary: {
                  main: "#476A30",
                },
                inuse: {
                  secondarytext: '#F4F5F9',
                  error: '#B32F3D',
                  hoverbg: '#C9C7CE',
                  success: '#1AAB9B',
                  primary: '#476A30',
                  barbg: '#59774E',
                  secondary: '#D9BA2E',
                  thirdary: '#F77923',
                  text: '#FFFFFF',
                  bg: '#EDEFFC',
                  formbg: '#ECEBF0',
                  inputbg: '#D6D5DA',
                  graytext: '#9F9F9D',
                  blacktext: '#2C272D',
                  linktext: '#444A9E',
                  scrollbg: "#D9D9D9",
                  homebg: "rgba(71, 106, 48, .97)"
                }
              }
              : {}),
          },

          typography: {
            fontFamily: [
              '"Helvetica Neue"',
              "monospace",
              "-apple-system",
              "BlinkMacSystemFont",
              '"Segoe UI"',
              "Roboto",
              "Oxygen",
              "sans-serif",
              '"Apple Color Emoji"',
              '"Segoe UI Emoji"',
              '"Segoe UI Symbol"',
              "Sansation",
            ].join(","),
          },
          components: {
            MuiButton: {
              styleOverrides: {
                root: sx({
                  borderRadius: "10px",
                  textTransform: "capitalize",
                })
              },
              variants: [
                {
                  props: { variant: "contained" },
                  style: {
                    fontWeight: "bold",
                  }
                }
              ]
            },
            MuiDialog: {
              styleOverrides: {
                root: sx({
                  borderRadius: "10px"
                })
              }
            }
          },
        })
      ),
    [mode]
  );

  return (
    <HashRouter>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} content={(key, message) => <NoticeContent id={key} message={message} />} autoHideDuration={7000}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                bgcolor: "background.default",
                fontFamily: "default",
              }}
            >
              <Navbar />
              <Box>
                <Router />
              </Box>
            </Box>
          </SnackbarProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </HashRouter>
  );
}

export default App;
