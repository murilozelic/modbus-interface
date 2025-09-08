import { useEffect, useState } from 'react'
import { Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import { addrLabel, parseId } from '../utils/modbus'

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function PollCoils({ deviceId, auto, rateMs, onError }: { deviceId: string; auto: boolean; rateMs: number; onError: (msg: string | null) => void }) {
  const [coilAddress, setCoilAddress] = useState('0')
  const [coilLength, setCoilLength] = useState('8')
  const [coils, setCoils] = useState<number[] | null>(null)
  const [pollingCoils, setPollingCoils] = useState(false)

  const pollCoils = async () => {
    const api = (window as any).api as Window['api'] | undefined
    if (!api) return
    const addr = Math.max(0, parseInt(coilAddress || '0', 10))
    const len = Math.min(200, Math.max(1, parseInt(coilLength || '1', 10)))
    try {
      setPollingCoils(true)
      const params = parseId(deviceId)
      const data = await api.readCoils({ ...params, address: addr, length: len })
      setCoils(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      onError(`Failed to poll coils: ${msg}`)
    } finally {
      setPollingCoils(false)
    }
  }

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
        const params = parseId(deviceId)
        try { await api.connect(params) } catch {}
        const addr = Math.max(0, parseInt(coilAddress || '0', 10))
        const len = Math.min(200, Math.max(0, parseInt(coilLength || '0', 10)))
        if (len > 0) {
          try {
            const data = await api.readCoils({ ...params, address: addr, length: len })
            if (alive) setCoils(data)
          } catch {}
        }
      } finally {
        running = false
      }
    }

    const interval = setInterval(run, Math.max(200, rateMs))
    run()
    return () => { alive = false; clearInterval(interval) }
  }, [deviceId, auto, rateMs, coilAddress, coilLength])

  return (
    <Box sx={{ mt: 3, animation: `${fadeUp} 340ms ease-out` }}>
      <Typography variant="subtitle2" gutterBottom>
        Poll Coils (Outputs)
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <TextField
          label="Address"
          value={coilAddress}
          onChange={(e) => setCoilAddress(e.target.value.replace(/[^0-9]/g, ''))}
          size="small"
          sx={{ width: 120 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
        <TextField
          label="Length"
          value={coilLength}
          onChange={(e) => setCoilLength(e.target.value.replace(/[^0-9]/g, ''))}
          size="small"
          sx={{ width: 120 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
        {!auto && (
          <Button variant="contained" onClick={pollCoils} disabled={pollingCoils}>
            {pollingCoils ? 'Polling...' : 'Poll Outputs'}
          </Button>
        )}
      </Stack>
      {coils && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {coils.map((v, i) => (
            <Box key={i} sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: v ? 'success.light' : 'grey.200', color: v ? 'success.contrastText' : 'text.primary', fontFamily: 'monospace', boxShadow: 1, transition: 'transform .15s ease, box-shadow .15s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
              {addrLabel(parseInt(coilAddress || '0', 10), i)}: {v}
            </Box>
          ))}
        </Box>
      )}
      {coils && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          {coils.map((v, i) => (
            <FormControlLabel
              key={i}
              control={<Switch checked={!!v} onChange={async (_, checked) => {
                const api = (window as any).api as Window['api'] | undefined
                if (!api) return
                try {
                  const params = parseId(deviceId)
                  const base = Math.max(0, parseInt(coilAddress || '0', 10))
                  await api.writeCoil({ ...params, address: base + i, state: checked })
                  setCoils((prev) => {
                    if (!prev) return prev
                    const next = [...prev]
                    next[i] = checked ? 1 : 0
                    return next
                  })
                } catch (e) {
                  const msg = e instanceof Error ? e.message : String(e)
                  onError(`Failed to write coil: ${msg}`)
                }
              }} />}
              label={`Coil ${addrLabel(parseInt(coilAddress || '0', 10), i)}`}
              sx={{ m: 0 }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
