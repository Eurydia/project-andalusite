import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@renderer/theme";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ToastContainer } from "react-toastify";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Outlet />
      <ToastContainer
        autoClose={750}
        stacked
        pauseOnFocusLoss={false}
        limit={3}
      />
    </ThemeProvider>
  ),
});
