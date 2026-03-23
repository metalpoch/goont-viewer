package model

import "time"

type OntMeasurement struct {
	Time         time.Time `json:"time"`
	Status       int8      `json:"status"`
	Temperature  int8      `json:"temperature"`
	OltDistance  int16     `json:"olt_distance"`
	TxPower      float64   `json:"tx_power"`
	RxPower      float64   `json:"rx_power"`
	BpsIn        float64   `json:"bps_in"`
	BpsOut       float64   `json:"bps_out"`
	BytesIn      uint64    `json:"bytes_in"`
	BytesOut     uint64    `json:"bytes_out"`
	Desp         string    `json:"desp"`
	SerialNumber string    `json:"serial_number"`
	Plan         string    `json:"plan"`
}

type OntResponse map[string][]OntMeasurement
