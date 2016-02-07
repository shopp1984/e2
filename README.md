# qmsk-e2
E2 Client + Web Manager + REST API

## Server

    go get github.com/qmsk/e2/cmd/server

Follow E2 status, providing a REST + WebSocket API, and a web UI:

    ./bin/server --discovery-interface=eth0 --http-listen=:8284 --http-static=./src/github.com/qmsk/e2/static

### API

TODO: examples

#### *GET* `/api/`
#### *GET* `/api/sources`
#### *GET* `/api/sources/:id`
#### *GET* `/api/screens`
#### *GET* `/api/screens/`
#### *GET* `/api/screens/:id`
#### *GET* `/api/auxes`
#### *GET* `/api/auxes/:id`

### Events

TODO: examples

#### `ws://.../events`

### Usage
    server [OPTIONS]

    Application Options:
          --http-listen=[HOST]:PORT
          --http-static=PATH

    E2 Discovery:
          --discovery-address=
          --discovery-interface=
          --discovery-interval=

    E2 JSON-RPC:
          --e2-address=HOST
          --e2-jsonrpc-port=PORT
          --e2-xml-port=PORT
          --e2-timeout=

## Client
    
    go get github.com/qmsk/e2/cmd/client

Useful for testing the client library:

    ./bin/client --e2-address=192.168.0.100 listen

### Usage:

    client [OPTIONS] <command>

    E2 JSON-RPC:
          --e2-address=HOST
          --e2-jsonrpc-port=PORT
          --e2-xml-port=PORT
          --e2-timeout=

    Help Options:
      -h, --help                    Show this help message

    Available commands:
      aux-list           List Aux destinations
      discover           Discover available E2 systems
      list-destinations  List destinations
      listen             Listen XML packets
      preset-list        List presets
      preset-show        Show preset destinations
      screen-list        List Screen destinations
      screen-show        Show screen content
      source-list        List sources

## Legacy

Python implementation; supports loading settings from the HTTP config backup, and using the telnet API to load presets and transition.

The web UI broken, TODO to remove the client/server implementation once re-implemented.

    PYTHONPATH=../qmsk-dmx ./opt/bin/python3 ./qmsk-e2-web \
        --e2-host 192.168.0.201 \
        --e2-presets-xml etc/xml/ \
        --e2-presets-db var/e2.db \
        -v --debug-module qmsk.net.e2.presets
