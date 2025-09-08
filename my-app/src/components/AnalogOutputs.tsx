import { useEffect, useState } from 'react'
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { addrLabel, parseId } from '../utils/modbus'
import { keyframes } from '@emotion/react'

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function AnalogOutputs({ deviceId, auto, rateMs, onError }: { deviceId: string; auto: boolean; rateMs: number; onError: (msg: string | null) => void }) {
  const [aoAddress, setAoAddress] = useState('0')
  const [aoLength, setAoLength] = useState('4')
  const [aos, setAos] = useState<number[] | null>(null)
  const [aoEdits, setAoEdits] = useState<string[] | null>(null)
  const [pollingAO, setPollingAO] = useState(false)

  const pollAO = async () => {
    const api = (window as any).api as Window['api'] | undefined
    if (!api) return
    const addr = Math.max(0, parseInt(aoAddress || '0', 10))
    const len = Math.min(125, Math.max(1, parseInt(aoLength || '1', 10)))
    try {
      setPollingAO(true)
      const params = parseId(deviceId)
      const data = await api.readHoldingRegisters({ ...params, address: addr, length: len })
      setAos(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      onError(`Failed to poll holding registers: ${msg}`)
    } finally {
      setPollingAO(false)
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
        const addr = Math.max(0, parseInt(aoAddress || '0', 10))
        const len = Math.min(125, Math.max(0, parseInt(aoLength || '0', 10)))
        if (len > 0) {
          try {
            const data = await api.readHoldingRegisters({ ...params, address: addr, length: len })
            if (alive) setAos(data)
          } catch {}
        }
      } finally {
        running = false
      }
    }

    const interval = setInterval(run, Math.max(200, rateMs))
    run()
    return () => { alive = false; clearInterval(interval) }
  }, [deviceId, auto, rateMs, aoAddress, aoLength])

  return (
    <Box sx={{ mt: 3, animation: `${fadeUp} 380ms ease-out` }}>
      <Typography variant="subtitle2" gutterBottom>
        Poll Analog Outputs (Holding Registers)
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <TextField
          label="Address"
          value={aoAddress}
          onChange={(e) => setAoAddress(e.target.value.replace(/[^0-9]/g, ''))}
          size="small"
          sx={{ width: 120 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
        <TextField
          label="Length"
          value={aoLength}
          onChange={(e) => setAoLength(e.target.value.replace(/[^0-9]/g, ''))}
          size="small"
          sx={{ width: 120 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
        {!auto && (
          <Button variant="contained" onClick={pollAO} disabled={pollingAO}>
            {pollingAO ? 'Polling...' : 'Poll Analog Outputs'}
          </Button>
        )}
      </Stack>
      {aos && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {aos.map((v, i) => (
              <Box key={i} sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'grey.200', fontFamily: 'monospace', boxShadow: 1, transition: 'transform .15s ease, box-shadow .15s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
                {addrLabel(parseInt(aoAddress || '0', 10), i)}: {v}
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1 }}>
            {aos.map((v, i) => {
              const base = Math.max(0, parseInt(aoAddress || '0', 10))
              const addr = base + i
              const val = aoEdits?.[i] ?? String(v)
              return (
                <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ transition: 'transform .15s ease', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <TextField
                    label={`AO ${addr}`}
                    value={val}
                    size="small"
                    onChange={(e) => {
                      const s = e.target.value.replace(/[^0-9]/g, '')
                      setAoEdits((prev) => {
                        const next = prev ? [...prev] : []
                        next[i] = s
                        return next
                      })
                    }}
                    sx={{ width: 120 }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  />
                  <IconButton aria-label="save" color="primary" sx={{ boxShadow: 1, transition: 'transform .15s ease, box-shadow .15s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }} onClick={async () => {
                    const api = (window as any).api as Window['api'] | undefined
                    if (!api) return
                    const n = parseInt((aoEdits?.[i] ?? String(v)) || '0', 10)
                    const safe = Math.max(0, Math.min(0xffff, isNaN(n) ? 0 : n))
                    try {
                      const params = parseId(deviceId)
                      await api.writeRegister({ ...params, address: addr, value: safe })
                      setAos((prev) => {
                        if (!prev) return prev
                        const next = [...prev]
                        next[i] = safe
                        return next
                      })
                      setAoEdits((prev) => {
                        const next = prev ? [...prev] : []
                        next[i] = String(safe)
                        return next
                      })
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : String(e)
                      onError(`Failed to write register: ${msg}`)
                    }
                  }}>
                    <SaveIcon />
                  </IconButton>
                </Stack>
              )
            })}
          </Box>
        </>
      )}
    </Box>
  )
}
