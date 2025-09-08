import { useEffect, useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import { addrLabel, parseId } from '../utils/modbus'

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function AnalogInputs({ deviceId, auto, rateMs, onError }: { deviceId: string; auto: boolean; rateMs: number; onError: (msg: string | null) => void }) {
  const [aiAddress, setAiAddress] = useState('0')
  const [aiLength, setAiLength] = useState('4')
  const [ais, setAis] = useState<number[] | null>(null)
  const [pollingAI, setPollingAI] = useState(false)

  const pollAI = async () => {
    const api = (window as any).api as Window['api'] | undefined
    if (!api) return
    const addr = Math.max(0, parseInt(aiAddress || '0', 10))
    const len = Math.min(125, Math.max(1, parseInt(aiLength || '1', 10)))
    try {
      setPollingAI(true)
      const params = parseId(deviceId)
      const data = await api.readInputRegisters({ ...params, address: addr, length: len })
      setAis(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      onError(`Failed to poll input registers: ${msg}`)
    } finally {
      setPollingAI(false)
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
        const addr = Math.max(0, parseInt(aiAddress || '0', 10))
        const len = Math.min(125, Math.max(0, parseInt(aiLength || '0', 10)))
        if (len > 0) {
          try {
            const data = await api.readInputRegisters({ ...params, address: addr, length: len })
            if (alive) setAis(data)
          } catch {}
        }
      } finally {
        running = false
      }
    }

    const interval = setInterval(run, Math.max(200, rateMs))
    run()
    return () => { alive = false; clearInterval(interval) }
  }, [deviceId, auto, rateMs, aiAddress, aiLength])

  return (
    <Box sx={{ mt: 3, animation: `${fadeUp} 360ms ease-out` }}>
      <Typography variant="subtitle2" gutterBottom>
        Poll Analog Inputs (Input Registers)
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <TextField
          label="Address"
          value={aiAddress}
          onChange={(e) => setAiAddress(e.target.value.replace(/[^0-9]/g, ''))}
          size="small"
          sx={{ width: 120 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
        <TextField
          label="Length"
          value={aiLength}
          onChange={(e) => setAiLength(e.target.value.replace(/[^0-9]/g, ''))}
          size="small"
          sx={{ width: 120 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
        {!auto && (
          <Button variant="contained" onClick={pollAI} disabled={pollingAI}>
            {pollingAI ? 'Polling...' : 'Poll Analog Inputs'}
          </Button>
        )}
      </Stack>
      {ais && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {ais.map((v, i) => (
            <Box key={i} sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'grey.200', fontFamily: 'monospace', boxShadow: 1, transition: 'transform .15s ease, box-shadow .15s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
              {addrLabel(parseInt(aiAddress || '0', 10), i)}: {v}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
