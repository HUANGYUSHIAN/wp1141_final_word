"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4255ff", // Quizlet 的藍色
      light: "#5b6dff",
      dark: "#2d3fe6",
    },
    secondary: {
      main: "#ffcd1f", // Quizlet 的黃色
      light: "#ffd74d",
      dark: "#f5b800",
    },
    background: {
      default: "#1e1e1e", // 深色背景
      paper: "#2d2d2d", // 卡片背景
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
  },
  typography: {
    fontFamily: '"Inter", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#2d2d2d",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#2d2d2d",
        },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

