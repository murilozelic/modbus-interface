import { Dialog, DialogTitle, DialogContent, Stack, CircularProgress, Typography, List, ListItem, ListItemText, IconButton, DialogActions, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'

type Device = { id: string; name?: string }

export default function DiscoveryDialog({
  open,
  onClose,
  scanning,
  onRescan,
  discovered,
  devices,
  onAdd
}: {
  open: boolean
  onClose: () => void
  scanning: boolean
  onRescan: () => void
  discovered: { host: string; port: number }[]
  devices: Device[]
  onAdd: (host: { host: string; port: number }) => void
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Network Discovery</DialogTitle>
      <DialogContent dividers>
        {scanning && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Scanning your network...</Typography>
          </Stack>
        )}
        {!scanning && discovered.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No devices discovered. Try scanning again.
          </Typography>
        )}
        <List>
          {discovered.map((h) => {
            const id = `${h.host}:${h.port}:1`
            const alreadyAdded = devices.some((d) => d.id === id)
            return (
              <ListItem key={id} divider sx={{ borderRadius: 2, my: 0.5, transition: 'transform .15s ease, box-shadow .15s ease, background-color .2s ease', '&:hover': { transform: 'translateY(-1px)', boxShadow: 2, bgcolor: 'action.hover' } }} secondaryAction={
                <IconButton edge="end" aria-label="add" onClick={() => onAdd(h)} disabled={alreadyAdded}>
                  <AddIcon />
                </IconButton>
              }>
                <ListItemText primary={h.host} />
              </ListItem>
            )
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={onRescan} disabled={scanning} variant="contained" startIcon={<RefreshIcon />}>Rescan</Button>
      </DialogActions>
    </Dialog>
  )
}
