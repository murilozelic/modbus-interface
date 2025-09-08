import { useReducer, useMemo } from 'react'

export type Device = {
  id: string
  name?: string
  auto: boolean
  rateMs: number
  online: boolean
}

type DeviceState = {
  devices: Device[]
  selectedId: string | null
}

type Action =
  | { type: 'ADD_DEVICE'; payload: { id: string } }
  | { type: 'SET_DEVICES'; payload: Device[] }
  | { type: 'SELECT_DEVICE'; payload: string | null }
  | { type: 'UPDATE_DEVICE'; payload: { id: string; data: Partial<Omit<Device, 'id'>> } }

const initialState: DeviceState = {
  devices: [],
  selectedId: null,
}

function deviceReducer(state: DeviceState, action: Action): DeviceState {
  switch (action.type) {
    case 'ADD_DEVICE': {
      if (state.devices.some((d) => d.id === action.payload.id)) {
        return state // Device already exists
      }
      const newDevice: Device = {
        id: action.payload.id,
        auto: false,
        rateMs: 1000,
        online: false,
      }
      return { ...state, devices: [...state.devices, newDevice] }
    }
    case 'SELECT_DEVICE':
      return { ...state, selectedId: action.payload }
    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload.data } : d
        ),
      }
    default:
      return state
  }
}

export function useDeviceManager() {
  const [state, dispatch] = useReducer(deviceReducer, initialState)

  const selectedDevice = useMemo(
    () => state.devices.find((d) => d.id === state.selectedId) || null,
    [state.devices, state.selectedId]
  )

  const addDevice = (id: string) => {
    dispatch({ type: 'ADD_DEVICE', payload: { id } })
  }

  const selectDevice = (id: string | null) => {
    dispatch({ type: 'SELECT_DEVICE', payload: id })
  }

  const updateDevice = (id: string, data: Partial<Omit<Device, 'id'>>) => {
    dispatch({ type: 'UPDATE_DEVICE', payload: { id, data } })
  }

  return {
    devices: state.devices,
    selectedId: state.selectedId,
    selectedDevice,
    addDevice,
    selectDevice,
    updateDevice,
  }
}