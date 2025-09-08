/// <reference types="vite/client" />

export {}

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

