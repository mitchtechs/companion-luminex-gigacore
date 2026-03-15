# Luminex GigaCore

Control Luminex GigaCore network switches over their REST API.

## Configuration

- **Host**: IP address of the GigaCore switch
- **Password**: Device password (leave blank if auth is not enabled)
- **Device Generation**: Select Gen1 or Gen2 to match your hardware
- **Poll Interval**: How often to refresh device state (default: 5s)

## Supported Devices

### Gen2 (WebSocket + REST)
GigaCore 10i, 10t, 16i, 16t, 18t, 20t, 30i (firmware 1.2.0+)

Gen2 devices use WebSocket for real-time state updates with HTTP polling as a fallback.

### Gen1 (REST only)
GigaCore 10, 12, 14R, 16Xt, 16RFO, 26i (firmware 3.0.2+)

Gen1 devices use HTTP polling only. The poll interval setting controls how frequently state is refreshed.

## Supported Features

- Recall and save configuration profiles
- Enable/disable ports
- Assign ports to groups or trunks
- Toggle PoE on supported models
- Identify device (LED blink)
- Reboot device
