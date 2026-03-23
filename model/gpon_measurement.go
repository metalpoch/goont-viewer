package model

import "time"

type GponMeasurement struct {
	Time          time.Time `json:"time"`
	GponInterface string    `json:"gpon_interface"`
	TotalBytesIn  uint64    `json:"total_bytes_in"`
	TotalBytesOut uint64    `json:"total_bytes_out"`
	TotalBpsIn    float64   `json:"total_bps_in"`
	TotalBpsOut   float64   `json:"total_bps_out"`
	CountActive   int       `json:"count_active"`
	CountInactive int       `json:"count_inactive"`
	CountError    int       `json:"count_error"`
}

type GponResponse map[string][]GponMeasurement
