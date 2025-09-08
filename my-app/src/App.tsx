import { useMemo, useState } from 'react'
import { AppBar, Box, Toolbar, Button, Typography, Alert } from '@mui/material'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import LeftNav from './components/LeftNav'
import DiscoveryDialog from './components/DiscoveryDialog'
import DeviceScreen from './screens/DeviceScreen'

type Device = { id: string; name?: string }

export default function App() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const [discovered, setDiscovered] = useState<{ host: string; port: number }[]>([])
  const [autoPollById, setAutoPollById] = useState<Record<string, boolean>>({})
  const [pollingRateById, setPollingRateById] = useState<Record<string, number>>({})
  const [onlineById, setOnlineById] = useState<Record<string, boolean>>({})

  const scan = async () => {
    const api = (window as any).api as Window['api'] | undefined
    if (!api) {
      setError('Discovery is unavailable in a browser tab. Please run inside Electron (npm run dev).')
      return
    }
    setError(null)
    setDiscoveryOpen(true)
    setScanning(true)
    setDiscovered([])
    try {
      const hosts = await api.scan({ timeoutMs: 400 })
      setDiscovered(hosts)
    } finally {
      setScanning(false)
    }
  }

  const addDiscovered = (host: { host: string; port: number }) => {
    const id = `${host.host}:${host.port}:1`
    setDevices((old) => (old.some((d) => d.id === id) ? old : [...old, { id }]))
  }

  const selected = useMemo(() => devices.find((d) => d.id === selectedId) || null, [devices, selectedId])
  const auto = selected ? !!autoPollById[selected.id] : false
  const rateMs = selected ? (pollingRateById[selected.id] ?? 1000) : 1000
  const online = selected ? !!onlineById[selected.id] : false

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" color="primary" elevation={3} sx={(theme) => ({
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        backdropFilter: 'saturate(180%) blur(8px)',
        boxShadow: '0 10px 30px rgba(0,0,0,.12)'
      })}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ color: 'primary.contrastText' }}>
            Remote I/O Dashboard
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" variant="outlined" startIcon={<TravelExploreIcon />} onClick={scan} disabled={scanning} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.4)' }}>
            Discovery Scan
          </Button>
        </Toolbar>
      </AppBar>
      <LeftNav devices={devices} onSelect={setSelectedId} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {error && (
          <Alert severity="warning" sx={{ mb: 2, boxShadow: 1 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {selected ? (
          <DeviceScreen
            device={selected}
            auto={auto}
            rateMs={rateMs}
            online={online}
            onChangeAuto={(v) => selected && setAutoPollById((m) => ({ ...m, [selected.id]: v }))}
            onChangeRateMs={(ms) => selected && setPollingRateById((m) => ({ ...m, [selected.id]: ms }))}
            onSaveName={(name) => selected && setDevices((arr) => arr.map((d) => (d.id === selected.id ? { ...d, name } : d)))}
            onUpdateOnline={(v) => selected && setOnlineById((m) => ({ ...m, [selected.id]: v }))}
            onError={setError}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Choose a device from the left.
          </Typography>
        )}
      </Box>

      <DiscoveryDialog
        open={discoveryOpen}
        onClose={() => setDiscoveryOpen(false)}
        scanning={scanning}
        onRescan={scan}
        discovered={discovered}
        devices={devices}
        onAdd={addDiscovered}
      />
    </Box>
  )
}
