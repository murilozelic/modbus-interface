import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Divider, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import LanIcon from '@mui/icons-material/Lan'
import { keyframes } from '@emotion/react'
import PollDiscreteInputs from '../components/PollDiscreteInputs'
import PollCoils from '../components/PollCoils'
import AnalogInputs from '../components/AnalogInputs'
import AnalogOutputs from '../components/AnalogOutputs'
import { parseId } from '../utils/modbus'

type Device = { id: string; name?: string }

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function DeviceScreen({
  device,
  auto,
  rateMs,
  online,
  onChangeAuto,
  onChangeRateMs,
  onSaveName,
  onUpdateOnline,
  onError
}: {
  device: Device
  auto: boolean
  rateMs: number
  online: boolean
  onChangeAuto: (v: boolean) => void
  onChangeRateMs: (ms: number) => void
  onSaveName: (name: string) => void
  onUpdateOnline: (v: boolean) => void
  onError: (msg: string | null) => void
}) {
  const [nameDraft, setNameDraft] = useState(device.name ?? '')
  const [pollingRateInput, setPollingRateInput] = useState(String(rateMs ?? 1000))
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    setNameDraft(device.name ?? '')
  }, [device.id])

  useEffect(() => {
    setPollingRateInput(String(rateMs))
  }, [device.id, rateMs])

  const hostPort = useMemo(() => {
    const { host, port } = parseId(device.id)
    return `${host}:${port}`
  }, [device.id])

  const connectSelected = async () => {
    const api = (window as any).api as Window['api'] | undefined
    if (!api) {
      onError('Cannot connect in browser tab. Please run inside Electron (npm run dev).')
      return
    }
    try {
      setConnecting(true)
      onError(null)
      await api.connect(parseId(device.id))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      onError(`Failed to connect: ${msg}`)
    } finally {
      setConnecting(false)
    }
  }

  // Lightweight online check while auto polling
  useEffect(() => {
    if (!auto) return
    let alive = true
    let running = false
    const run = async () => {
      if (!alive || running) return
      running = true
      try {
        const api = (window as any).api as Window['api'] | undefined
        if (!api) return
        const params = parseId(device.id)
        try { await api.connect(params) } catch {}
        try {
          const data = await api.readHoldingRegisters({ ...params, address: 0, length: 1 })
          onUpdateOnline(Array.isArray(data) && data.length > 0)
        } catch {
          onUpdateOnline(false)
        }
      } finally {
        running = false
      }
    }
    const interval = setInterval(run, Math.max(200, rateMs))
    run()
    return () => { alive = false; clearInterval(interval) }
  }, [device.id, auto, rateMs])

  return (
    <Paper sx={{ p: 2, boxShadow: 3, borderRadius: 2, animation: `${fadeUp} 320ms ease-out` }}>
      <Typography variant="subtitle1">Selected Device</Typography>
      <Divider sx={{ my: 1 }} />
      <Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 1 }}>
          <TextField
            label="Device Name"
            value={nameDraft}
            placeholder="Unnamed"
            onChange={(e) => setNameDraft(e.target.value)}
            size="small"
            sx={{ maxWidth: 280 }}
          />
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {hostPort}
          </Typography>
          <Button variant="contained" startIcon={<LanIcon />} onClick={connectSelected} disabled={connecting} color={auto ? (online ? 'success' as any : 'error' as any) : 'primary'} sx={{ boxShadow: 1 }}>
            {connecting ? 'Connecting...' : auto ? (online ? 'Connected' : 'Disconnected') : 'Connect'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => onSaveName(nameDraft.trim() || undefined as any)}
          >
            Save Name
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 2 }}>
          <TextField
            label="Polling Rate (ms)"
            value={pollingRateInput}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '')
              setPollingRateInput(v)
              const n = parseInt(v || '0', 10)
              onChangeRateMs(isNaN(n) || n <= 0 ? 1000 : n)
            }}
            size="small"
            sx={{ width: 180 }}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={auto}
                onChange={(_, v) => onChangeAuto(v)}
              />
            }
            label="Auto Poll"
          />
        </Stack>

        <PollDiscreteInputs deviceId={device.id} auto={auto} rateMs={rateMs} onError={onError} />
        <PollCoils deviceId={device.id} auto={auto} rateMs={rateMs} onError={onError} />
        <AnalogInputs deviceId={device.id} auto={auto} rateMs={rateMs} onError={onError} />
        <AnalogOutputs deviceId={device.id} auto={auto} rateMs={rateMs} onError={onError} />
      </Box>
    </Paper>
  )
}
