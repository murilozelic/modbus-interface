import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#26a69a'
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff'
    }
  },
  shape: {
    borderRadius: 10
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 2 },
      styleOverrides: {
        root: {
          transition: 'box-shadow .2s ease, transform .2s ease',
          willChange: 'transform, box-shadow'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: 280
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          fontWeight: 600,
          paddingLeft: 16,
          paddingRight: 16,
          transition: 'transform .2s ease, box-shadow .2s ease, background-color .2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,.08)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 20px rgba(0,0,0,.12)'
          }
        },
        contained: {
          boxShadow: '0 4px 12px rgba(25,118,210,.28)'
        },
        outlined: {
          borderWidth: 1.5
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'background-color .2s ease, transform .2s ease, box-shadow .2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 16px rgba(0,0,0,.08)'
          }
        }
      }
    }
  }
})

export default theme
