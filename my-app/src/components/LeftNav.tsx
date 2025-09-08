import { useState } from 'react'
import { Drawer, List, ListItemButton, ListItemText, Collapse, Box, Typography, ListItemIcon, Tooltip } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DevicesIcon from '@mui/icons-material/Devices'

type Device = { id: string; name?: string }

export const drawerWidth = 280
const collapsedWidth = 72

export default function LeftNav({ devices, onSelect }: { devices: Device[]; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(true)

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={(theme) => ({
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.standard
        }),
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          top: { xs: 56, sm: 64 },
          bottom: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard
          }),
          background: `linear-gradient(180deg, ${theme.palette.primary.light}0A, ${theme.palette.primary.main}08)`,
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[2]
        }
      })}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flexShrink: 0 }}>
          <List>
            <Tooltip title="Devices" placement="right" disableHoverListener={open}>
            <ListItemButton onClick={() => setOpen(!open)} sx={{ justifyContent: open ? 'initial' : 'center', px: 2, borderRadius: 2, mx: 1, my: 1 }}>
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 0, justifyContent: 'center' }}>
                <DevicesIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Devices" primaryTypographyProps={{ noWrap: true }} />}
              {open ? <ChevronLeftIcon /> : null}
            </ListItemButton>
            </Tooltip>
          </List>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {devices.map((d) => {
                const [host, port] = d.id.split(':')
                const shortId = `${host}:${port}`
                return (
                  <ListItemButton key={d.id} sx={{ pl: 4, borderRadius: 2, mx: 1, my: 0.5, transition: 'transform .15s ease, box-shadow .15s ease, background-color .2s ease', '&:hover': { transform: 'translateY(-1px)', boxShadow: 2, backgroundColor: 'action.hover' } }} onClick={() => onSelect(d.id)}>
                    <ListItemText primary={d.name || 'Unnamed'} secondary={shortId} />
                  </ListItemButton>
                )
              })}
              {devices.length === 0 && (
                <Box sx={{ px: 4, py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No devices yet
                  </Typography>
                </Box>
              )}
            </List>
          </Collapse>
        </Box>
      </Box>
    </Drawer>
  )
}
