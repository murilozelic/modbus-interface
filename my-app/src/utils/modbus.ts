export function parseId(id: string) {
  const [host, p, u] = id.split(':')
  return { host, port: Number(p || 502), unitId: Number(u || 1) }
}

export function addrLabel(base: number, offset: number) {
  return `${base + offset}`
}

