import { useEffect, useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import { addrLabel, parseId } from '../utils/modbus'

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function PollDiscreteInputs({ deviceId, auto, rateMs, onError }: { deviceId: string; auto: boolean; rateMs: number; onError: (msg: string | null) => void }) {
  const [pollAddress, setPollAddress] = useState('0')
  const [pollLength, setPollLength] = useState('8')
  const [inputs, setInputs] = useState<number[] | null>(null)
  const [polling, setPolling] = useState(false)

  const pollInputs = async () => {
    const api = (window as any).api as Window['api'] | undefined
    if (!api) {
      onError('Polling unavailable in browser tab. Please run inside Electron (npm run dev).')
      return
    }
    const addr = Math.max(0, parseInt(pollAddress || '0', 10))
    const len = Math.min(200, Math.max(1, parseInt(pollLength || '1', 10)))
    try {
      setPolling(true)
      const params = parseId(deviceId)
      const data = await api.readDiscreteInputs({ ...params, address: addr, length: len })
      setInputs(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      onError(`Failed to poll inputs: ${msg}`)
    } finally {
      setPolling(false)
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
        const addr = Math.max(0, parseInt(pollAddress || '0', 10))
        const len = Math.min(200, Math.max(0, parseInt(pollLength || '0', 10)))
        if (len > 0) {
          try {
            const data = await api.readDiscreteInputs({ ...params, address: addr, length: len })
            if (alive) setInputs(data)
          } catch {}
        }
      } finally {
        running = false
      }
    }

    const interval = setInterval(run, Math.max(200, rateMs))
    run()
    return () => { alive = false; clearInterval(interval) }
  }, [deviceId, auto, rateMs, pollAddress, pollLength])

  return (
    <Box sx={{ mt: 2, animation: `${fadeUp} 300ms ease-out` }}>
      <Typography variant="subtitle2" gutterBottom>
        Poll Discrete Inputs
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <TextField
          label="Address"
          value={pollAddress}
          onChange={(e) => setPollAddress(e.target.value.replace(/[^0-9]/g, ''))}
          size="small"
          sx={{ width: 120 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
        <TextField
          label="Length"
          value={pollLength}
          onChange={(e) => setPollLength(e.target.value.replace(/[^0-9]/g, ''))}
          size="small"
          sx={{ width: 120 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
        {!auto && (
          <Button variant="contained" onClick={pollInputs} disabled={polling}>
            {polling ? 'Polling...' : 'Poll Inputs'}
          </Button>
        )}
      </Stack>
      {inputs && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {inputs.map((v, i) => (
            <Box key={i} sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: v ? 'success.light' : 'grey.200', color: v ? 'success.contrastText' : 'text.primary', fontFamily: 'monospace', boxShadow: 1, transition: 'transform .15s ease, box-shadow .15s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
              {addrLabel(parseInt(pollAddress || '0', 10), i)}: {v}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
