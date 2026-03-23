package model

type ProcessedGponData struct {
	TableData          []GponTableRow   `json:"tableData"`
	GlobalSummary      GlobalSummary    `json:"globalSummary"`
	GlobalChartTraffic []ChartDataPoint `json:"globalChartTraffic"`
	GlobalChartVolume  []ChartDataPoint `json:"globalChartVolume"`
	RawData            GponResponse     `json:"rawData,omitempty"`
}

type GponTableRow struct {
	GponIdx       string  `json:"gponIdx"`
	InterfaceName string  `json:"interfaceName"`
	AvgBpsIn      float64 `json:"avgBpsIn"`
	AvgBpsOut     float64 `json:"avgBpsOut"`
	AvgBytesIn    float64 `json:"avgBytesIn"`
	AvgBytesOut   float64 `json:"avgBytesOut"`
	TotalBytesIn  uint64  `json:"totalBytesIn"`
	TotalBytesOut uint64  `json:"totalBytesOut"`
}

type GlobalSummary struct {
	AvgBpsIn      float64 `json:"avgBpsIn"`
	AvgBpsOut     float64 `json:"avgBpsOut"`
	TotalBytesIn  uint64  `json:"totalBytesIn"`
	TotalBytesOut uint64  `json:"totalBytesOut"`
}

type ChartDataPoint struct {
	Date     string  `json:"date"`
	ValueIn  float64 `json:"valueIn"`
	ValueOut float64 `json:"valueOut"`
}

type ProcessedOntData struct {
	TableData    []OntTableRow    `json:"tableData"`
	Summary      GlobalSummary    `json:"summary"`
	ChartTraffic []ChartDataPoint `json:"chartTraffic"`
	ChartVolume  []ChartDataPoint `json:"chartVolume"`
	RawData      OntResponse      `json:"rawData,omitempty"`
}

type OntTableRow struct {
	OntIdx        string  `json:"ontIdx"`
	Desp          string  `json:"desp"`
	Sn            string  `json:"sn"`
	Plan          string  `json:"plan"`
	Distance      int16   `json:"distance"`
	Status        int8    `json:"status"`
	AvgBpsIn      float64 `json:"avgBpsIn"`
	AvgBpsOut     float64 `json:"avgBpsOut"`
	AvgBytesIn    float64 `json:"avgBytesIn"`
	AvgBytesOut   float64 `json:"avgBytesOut"`
	TotalBytesIn  uint64  `json:"totalBytesIn"`
	TotalBytesOut uint64  `json:"totalBytesOut"`
}
