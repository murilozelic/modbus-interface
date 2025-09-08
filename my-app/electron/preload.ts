import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  connect: (opts: { host: string; port?: number; unitId?: number }) => ipcRenderer.invoke('modbus:connect', opts),
  readCoils: (p: { host: string; port?: number; unitId?: number; address: number; length: number }) => ipcRenderer.invoke('modbus:readCoils', p),
  readDiscreteInputs: (p: { host: string; port?: number; unitId?: number; address: number; length: number }) => ipcRenderer.invoke('modbus:readDiscreteInputs', p),
  readHoldingRegisters: (p: { host: string; port?: number; unitId?: number; address: number; length: number }) => ipcRenderer.invoke('modbus:readHoldingRegisters', p),
  readInputRegisters: (p: { host: string; port?: number; unitId?: number; address: number; length: number }) => ipcRenderer.invoke('modbus:readInputRegisters', p),
  writeCoil: (p: { host: string; port?: number; unitId?: number; address: number; state: boolean }) => ipcRenderer.invoke('modbus:writeCoil', p),
  writeRegister: (p: { host: string; port?: number; unitId?: number; address: number; value: number }) => ipcRenderer.invoke('modbus:writeRegister', p),
  scan: (opts?: { timeoutMs?: number }) => ipcRenderer.invoke('discovery:scan', opts ?? {})
})

declare global {
  interface Window {
    api: {
      connect: (opts: { host: string; port?: number; unitId?: number }) => Promise<{ ok: boolean; device?: string }>
      readCoils: (p: { host: string; port?: number; unitId?: number; address: number; length: number }) => Promise<number[]>
      readDiscreteInputs: (p: { host: string; port?: number; unitId?: number; address: number; length: number }) => Promise<number[]>
      readHoldingRegisters: (p: { host: string; port?: number; unitId?: number; address: number; length: number }) => Promise<number[]>
      readInputRegisters: (p: { host: string; port?: number; unitId?: number; address: number; length: number }) => Promise<number[]>
      writeCoil: (p: { host: string; port?: number; unitId?: number; address: number; state: boolean }) => Promise<boolean>
      writeRegister: (p: { host: string; port?: number; unitId?: number; address: number; value: number }) => Promise<boolean>
      scan: (opts?: { timeoutMs?: number }) => Promise<{ host: string; port: number }[]>
    }
  }
}

