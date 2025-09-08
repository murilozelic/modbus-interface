Modbus Remote IO – Electron (Portable)
======================================

Cross‑platform Electron app (Windows/Linux) for Modbus TCP remote I/O with a left navigation, device list, connect input, and a discovery scan. Packaged as portable: Windows Portable .exe and Linux AppImage.

Scripts
-------

- Dev (hot reload): `npm run dev`
- Build (all): `npm run build`
- Build portable (Windows + Linux): `npm run build:portable`
- Windows only: `npm run build:portable:win`
- Linux only: `npm run build:portable:linux`

Portable Outputs
----------------

- Windows Portable: `release/Modbus Remote IO-<version>-win-<arch>-portable.exe`
- Linux AppImage: `release/Modbus Remote IO-<version>-linux-<arch>.AppImage`

Notes
-----

- Discovery scans local IPv4 subnets for hosts with TCP/502 open (heuristic, /24 assumption).
- Modbus operations are provided through a simple IPC API surface (`window.api`).
- UI uses React + MUI; left drawer lists devices; main panel supports entering an IP, connecting, and triggering discovery.

