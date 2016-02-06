package main

import (
    "github.com/qmsk/e2/discovery"
    "fmt"
)

type Discover struct {
    DiscoveryOptions        discovery.Options
}

func init() {
    parser.AddCommand("discover", "Discover available E2 systems", "", &Discover{})
}

func (cmd *Discover) Execute(args []string) error {
    if discovery, err := cmd.DiscoveryOptions.Discovery(); err != nil {
        return err
    } else {
        for packet := range discovery.Run() {
            fmt.Printf("%v\n", packet.IP)
        }
    }

    return nil
}