import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from '@renderer/theme'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ToastContainer } from 'react-toastify'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Outlet />
      <TanStackRouterDevtools />
      <ToastContainer
        autoClose={750}
        stacked
        pauseOnFocusLoss={false}
        limit={3}
        position="bottom-left"
      />
    </ThemeProvider>
  )
})
