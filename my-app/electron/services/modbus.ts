import ModbusRTU from 'modbus-serial'

type ConnKey = string
function keyOf(host: string, port: number, unitId: number) {
  return `${host}:${port}:${unitId}`
}

export class ModbusManager {
  private clients = new Map<ConnKey, ModbusRTU>()

  async connect({ host, port = 502, unitId = 1 }: { host: string; port?: number; unitId?: number }) {
    const key = keyOf(host, port, unitId)
    let client = this.clients.get(key)
    if (!client) {
      client = new ModbusRTU()
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          try {
            // @ts-ignore close may exist depending on transport
            client?.close?.()
          } catch {}
          reject(new Error('Connection timeout'))
        }, 4000)
        client!.connectTCP(host, { port }, (err: unknown) => {
          clearTimeout(timer)
          if (err) reject(err)
          else resolve()
        })
      })
      client.setID(unitId)
      this.clients.set(key, client)
    }
    return { ok: true, device: key }
  }

  private getClient({ host, port = 502, unitId = 1 }: { host: string; port?: number; unitId?: number }) {
    const key = keyOf(host, port, unitId)
    const c = this.clients.get(key)
    if (!c) throw new Error('Not connected')
    return c
  }

  async readCoils(p: { host: string; port?: number; unitId?: number; address: number; length: number }) {
    const c = this.getClient(p)
    const r = await c.readCoils(p.address, p.length)
    return r.data.map((b) => (b ? 1 : 0))
  }
  async readDiscreteInputs(p: { host: string; port?: number; unitId?: number; address: number; length: number }) {
    const c = this.getClient(p)
    const r = await c.readDiscreteInputs(p.address, p.length)
    return r.data.map((b) => (b ? 1 : 0))
  }
  async readHoldingRegisters(p: { host: string; port?: number; unitId?: number; address: number; length: number }) {
    const c = this.getClient(p)
    const r = await c.readHoldingRegisters(p.address, p.length)
    return r.data
  }
  async readInputRegisters(p: { host: string; port?: number; unitId?: number; address: number; length: number }) {
    const c = this.getClient(p)
    const r = await c.readInputRegisters(p.address, p.length)
    return r.data
  }
  async writeCoil(p: { host: string; port?: number; unitId?: number; address: number; state: boolean }) {
    const c = this.getClient(p)
    await c.writeCoil(p.address, p.state)
    return true
  }
  async writeRegister(p: { host: string; port?: number; unitId?: number; address: number; value: number }) {
    const c = this.getClient(p)
    await c.writeRegister(p.address, p.value)
    return true
  }
}
