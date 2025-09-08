import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import os from 'node:os'
import net from 'node:net'
import { z } from 'zod'
import { ModbusManager } from './services/modbus'

const isDev = !!process.env.ELECTRON_RENDERER_URL

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Modbus Remote IO',
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.cjs'),
      sandbox: false
    }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    const indexPath = path.join(__dirname, '../../dist/index.html')
    mainWindow.loadFile(indexPath)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// --- IPC & Services ---
const modbus = new ModbusManager()

const ConnectSchema = z.object({ host: z.string(), port: z.number().default(502), unitId: z.number().min(1).max(247).default(1) })
ipcMain.handle('modbus:connect', async (_e, payload) => {
  const p = ConnectSchema.parse(payload)
  return modbus.connect(p)
})

const ReadSchema = z.object({ host: z.string(), port: z.number().default(502), unitId: z.number().default(1), address: z.number().nonnegative(), length: z.number().positive().max(200) })
ipcMain.handle('modbus:readCoils', async (_e, payload) => {
  const p = ReadSchema.parse(payload)
  return modbus.readCoils(p)
})
ipcMain.handle('modbus:readDiscreteInputs', async (_e, payload) => {
  const p = ReadSchema.parse(payload)
  return modbus.readDiscreteInputs(p)
})
ipcMain.handle('modbus:readHoldingRegisters', async (_e, payload) => {
  const p = ReadSchema.parse(payload)
  return modbus.readHoldingRegisters(p)
})
ipcMain.handle('modbus:readInputRegisters', async (_e, payload) => {
  const p = ReadSchema.parse(payload)
  return modbus.readInputRegisters(p)
})

const WriteCoilSchema = z.object({ host: z.string(), port: z.number().default(502), unitId: z.number().default(1), address: z.number().nonnegative(), state: z.boolean() })
ipcMain.handle('modbus:writeCoil', async (_e, payload) => {
  const p = WriteCoilSchema.parse(payload)
  return modbus.writeCoil(p)
})

const WriteRegSchema = z.object({ host: z.string(), port: z.number().default(502), unitId: z.number().default(1), address: z.number().nonnegative(), value: z.number().int().min(0).max(0xffff) })
ipcMain.handle('modbus:writeRegister', async (_e, payload) => {
  const p = WriteRegSchema.parse(payload)
  return modbus.writeRegister(p)
})

// Simple network discovery: scan local IPv4 subnets for hosts with TCP/502 open
const DiscoverySchema = z.object({ timeoutMs: z.number().min(100).max(5000).default(500) })
ipcMain.handle('discovery:scan', async (_e, payload) => {
  const { timeoutMs } = DiscoverySchema.parse(payload ?? {})
  const interfaces = os.networkInterfaces()
  const subnets = new Set<string>()
  for (const ifaces of Object.values(interfaces)) {
    if (!ifaces) continue
    for (const i of ifaces) {
      if (i.family === 'IPv4' && !i.internal) {
        const parts = i.address.split('.')
        // Assume /24 for simplicity
        subnets.add(`${parts[0]}.${parts[1]}.${parts[2]}`)
      }
    }
  }
  const results: { host: string; port: number }[] = []
  const tryConnect = (host: string) => new Promise<boolean>((resolve) => {
    const socket = new net.Socket()
    let resolved = false
    const done = (ok: boolean) => {
      if (!resolved) {
        resolved = true
        socket.destroy()
        resolve(ok)
      }
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
    socket.connect(502, host)
  })

  const hosts: string[] = []
  for (const base of subnets) {
    for (let i = 1; i <= 254; i++) hosts.push(`${base}.${i}`)
  }

  const limit = 128
  let index = 0
  async function worker() {
    while (index < hosts.length) {
      const host = hosts[index++]
      const ok = await tryConnect(host)
      if (ok) results.push({ host, port: 502 })
    }
  }
  await Promise.all(new Array(limit).fill(0).map(() => worker()))
  console.log(`[discovery] scanned ${hosts.length} hosts across ${subnets.size} subnet(s); found ${results.length} device(s) on port 502`)
  return results
})
