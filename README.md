# Companion Module — Luminex GigaCore

Control Luminex GigaCore network switches from [Bitfocus Companion](https://bitfocus.io/companion).

Developed by **[PDA Technical Limited](https://pda-tech.com)** — Mitch Bailey.

---

## Supported Devices

All Luminex GigaCore models, including:

- GigaCore 10, 10i, 10t
- GigaCore 12, 14R
- GigaCore 16i, 16t, 16Xt, 16RFO
- GigaCore 18t, 20t, 26i, 30i

Supports both **Gen 1** (older firmware) and **Gen 2** (REST + WebSocket) devices.

---

## Features

### Actions
- Activate a profile
- Set port label
- Set port VLAN
- Enable / disable PoE on a port (PoE-capable models)
- Reboot device

### Feedbacks
- Active profile indicator
- Port link status (up/down)
- PoE port status

### Variables
- Device name, model, firmware version
- Active profile name
- Per-port link status, speed, label

### Presets
- Pre-built buttons for common profile switching and port monitoring

---

## Configuration

| Field | Description |
|-------|-------------|
| Host | IP address of the GigaCore switch |
| Gen 1 | Enable for older Gen 1 hardware |
| Poll Interval | How often to refresh state (ms) |

---

## Connection

The module connects via:
- **REST API** — for configuration and control
- **WebSocket** — for real-time state updates (Gen 2 only)

---

## License

MIT — © PDA Technical Limited
