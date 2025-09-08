import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline, Container } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import theme from './theme'

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={qc}>
        <Container maxWidth={false} disableGutters>
          <App />
        </Container>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
)

