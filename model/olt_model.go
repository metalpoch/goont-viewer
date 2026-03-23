package model

import "time"

type OLT struct {
	IP        string    `json:"ip"`
	Community string    `json:"community"`
	Name      string    `json:"name"`
	Location  string    `json:"location"`
	Timeout   int       `json:"timeout,omitempty"`
	Retries   int       `json:"retries,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}
