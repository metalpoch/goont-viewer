package utils

import (
	"goont-viewer/model"
	"log"
	"sort"
	"strconv"
	"time"
)

func ProcessGponData(rawData model.GponResponse) (model.ProcessedGponData, error) {
	tableData := []model.GponTableRow{}
	globalChartTrafficMap := make(map[string]struct{ bpsIn, bpsOut float64 })
	globalChartVolumeMap := make(map[string]struct{ vIn, vOut uint64 })

	var globalTotalBytesIn, globalTotalBytesOut uint64
	var globalAvgBpsInSum, globalAvgBpsOutSum float64

	for gponIdx, measurements := range rawData {
		if len(measurements) == 0 {
			continue
		}

		interfaceName := measurements[0].GponInterface

		dailyBlocks := make(map[string]struct {
			bpsInSum, bpsOutSum float64
			count               int
			volumeIn, volumeOut *uint64
		})

		for _, m := range measurements {
			t := m.Time
			timeStr := t.Format(time.RFC3339)
			hourStr := timeStr[11:13]

			hours, err := strconv.Atoi(hourStr)
			if err != nil {
				log.Println("error al intentar pasar la hora de texto a entero:", hourStr)
			}

			dateOnlyStr := timeStr[:10]
			isMidnight := hours == 0

			blockDate, err := time.Parse("2006-01-02T15:04:05Z", dateOnlyStr+"T12:00:00Z")
			if err != nil {
				continue
			}
			if isMidnight {
				blockDate = blockDate.AddDate(0, 0, -1)
			}
			dateStr := blockDate.Format("2006-01-02")

			if _, exists := dailyBlocks[dateStr]; !exists {
				dailyBlocks[dateStr] = struct {
					bpsInSum, bpsOutSum float64
					count               int
					volumeIn, volumeOut *uint64
				}{}
			}
			block := dailyBlocks[dateStr]

			bpsInVal := m.TotalBpsIn
			bpsOutVal := m.TotalBpsOut

			if bpsInVal > 2.5e9 || bpsOutVal > 2.5e9 {
				continue
			}

			if hours >= 19 && hours <= 23 {
				block.bpsInSum += bpsInVal
				block.bpsOutSum += bpsOutVal
				block.count++
			}

			if hours == 0 {
				volumeIn := m.TotalBytesIn
				volumeOut := m.TotalBytesOut
				block.volumeIn = &volumeIn
				block.volumeOut = &volumeOut
			}

			dailyBlocks[dateStr] = block
		}

		var gponTotalVolumeIn, gponTotalVolumeOut uint64
		var gponSumOfAvgBpsIn, gponSumOfAvgBpsOut float64
		var validDaysCount, validVolumeDaysCount int

		for dateStr, block := range dailyBlocks {
			if block.count > 0 {
				dayAvgBpsIn := block.bpsInSum / float64(block.count)
				dayAvgBpsOut := block.bpsOutSum / float64(block.count)

				gponSumOfAvgBpsIn += dayAvgBpsIn
				gponSumOfAvgBpsOut += dayAvgBpsOut
				validDaysCount++

				if _, exists := globalChartTrafficMap[dateStr]; !exists {
					globalChartTrafficMap[dateStr] = struct{ bpsIn, bpsOut float64 }{}
				}
				gTraffic := globalChartTrafficMap[dateStr]
				gTraffic.bpsIn += dayAvgBpsIn
				gTraffic.bpsOut += dayAvgBpsOut
				globalChartTrafficMap[dateStr] = gTraffic
			}

			if block.volumeIn != nil {
				gponTotalVolumeIn += *block.volumeIn
				gponTotalVolumeOut += *block.volumeOut
				validVolumeDaysCount++

				if _, exists := globalChartVolumeMap[dateStr]; !exists {
					globalChartVolumeMap[dateStr] = struct{ vIn, vOut uint64 }{}
				}
				gVolume := globalChartVolumeMap[dateStr]
				gVolume.vIn += *block.volumeIn
				gVolume.vOut += *block.volumeOut
				globalChartVolumeMap[dateStr] = gVolume
			}
		}

		avgBpsIn := 0.0
		avgBpsOut := 0.0
		if validDaysCount > 0 {
			avgBpsIn = gponSumOfAvgBpsIn / float64(validDaysCount)
			avgBpsOut = gponSumOfAvgBpsOut / float64(validDaysCount)
		}

		avgVolumeIn := 0.0
		avgVolumeOut := 0.0
		if validVolumeDaysCount > 0 {
			avgVolumeIn = float64(gponTotalVolumeIn) / float64(validVolumeDaysCount)
			avgVolumeOut = float64(gponTotalVolumeOut) / float64(validVolumeDaysCount)
		}

		tableData = append(tableData, model.GponTableRow{
			GponIdx:       gponIdx,
			InterfaceName: interfaceName,
			AvgBpsIn:      avgBpsIn,
			AvgBpsOut:     avgBpsOut,
			AvgBytesIn:    avgVolumeIn,
			AvgBytesOut:   avgVolumeOut,
			TotalBytesIn:  gponTotalVolumeIn,
			TotalBytesOut: gponTotalVolumeOut,
		})

		globalTotalBytesIn += gponTotalVolumeIn
		globalTotalBytesOut += gponTotalVolumeOut
		globalAvgBpsInSum += avgBpsIn
		globalAvgBpsOutSum += avgBpsOut
	}

	globalSummary := model.GlobalSummary{
		AvgBpsIn:      globalAvgBpsInSum,
		AvgBpsOut:     globalAvgBpsOutSum,
		TotalBytesIn:  globalTotalBytesIn,
		TotalBytesOut: globalTotalBytesOut,
	}

	chartTrafficKeys := make([]string, 0, len(globalChartTrafficMap))
	for k := range globalChartTrafficMap {
		chartTrafficKeys = append(chartTrafficKeys, k)
	}
	sort.Strings(chartTrafficKeys)

	chartTraffic := make([]model.ChartDataPoint, 0, len(chartTrafficKeys))
	for _, date := range chartTrafficKeys {
		traffic := globalChartTrafficMap[date]
		chartTraffic = append(chartTraffic, model.ChartDataPoint{
			Date:     date,
			ValueIn:  traffic.bpsIn,
			ValueOut: traffic.bpsOut,
		})
	}

	chartVolumeKeys := make([]string, 0, len(globalChartVolumeMap))
	for k := range globalChartVolumeMap {
		chartVolumeKeys = append(chartVolumeKeys, k)
	}
	sort.Strings(chartVolumeKeys)

	chartVolume := make([]model.ChartDataPoint, 0, len(chartVolumeKeys))
	for _, date := range chartVolumeKeys {
		volume := globalChartVolumeMap[date]
		chartVolume = append(chartVolume, model.ChartDataPoint{
			Date:     date,
			ValueIn:  float64(volume.vIn),
			ValueOut: float64(volume.vOut),
		})
	}

	return model.ProcessedGponData{
		TableData:          tableData,
		GlobalSummary:      globalSummary,
		GlobalChartTraffic: chartTraffic,
		GlobalChartVolume:  chartVolume,
		RawData:            rawData,
	}, nil
}

func ProcessDetailedOntData(rawData model.OntResponse) model.ProcessedOntData {
	timeMap := make(map[string]struct {
		bps_in, bps_out     float64
		bytes_in, bytes_out uint64
	})

	for _, measurements := range rawData {
		if measurements == nil {
			continue
		}
		for _, m := range measurements {
			t := m.Time
			timeStr := t.Format(time.RFC3339)

			bpsInVal := m.BpsIn
			bpsOutVal := m.BpsOut

			if bpsInVal > 2.5e9 || bpsOutVal > 2.5e9 {
				continue
			}

			if _, exists := timeMap[timeStr]; !exists {
				timeMap[timeStr] = struct {
					bps_in, bps_out     float64
					bytes_in, bytes_out uint64
				}{}
			}
			timeEntry := timeMap[timeStr]
			timeEntry.bps_in += bpsInVal
			timeEntry.bps_out += bpsOutVal
			timeEntry.bytes_in += m.BytesIn
			timeEntry.bytes_out += m.BytesOut
			timeMap[timeStr] = timeEntry
		}
	}

	dailyBlocks := make(map[string]struct {
		bpsInSum, bpsOutSum float64
		count               int
		volumeIn, volumeOut *uint64
	})

	var totalBytesIn, totalBytesOut uint64
	var sumAvgBpsIn, sumAvgBpsOut float64
	var validDaysCount int

	for timeStr, m := range timeMap {
		hourStr := timeStr[11:13]
		hours, err := strconv.Atoi(hourStr)
		if err != nil {
			log.Println("error al intentar pasar la hora de texto a entero:", hourStr)
		}

		dateOnlyStr := timeStr[:10]
		isMidnight := hours == 0

		blockDate, err := time.Parse("2006-01-02T15:04:05Z", dateOnlyStr+"T12:00:00Z")
		if err != nil {
			continue
		}
		if isMidnight {
			blockDate = blockDate.AddDate(0, 0, -1)
		}
		dateStr := blockDate.Format("2006-01-02")

		if _, exists := dailyBlocks[dateStr]; !exists {
			dailyBlocks[dateStr] = struct {
				bpsInSum, bpsOutSum float64
				count               int
				volumeIn, volumeOut *uint64
			}{}
		}
		block := dailyBlocks[dateStr]

		if hours >= 19 && hours <= 23 {
			block.bpsInSum += m.bps_in
			block.bpsOutSum += m.bps_out
			block.count++
		}

		if hours == 0 {
			volumeIn := m.bytes_in
			volumeOut := m.bytes_out
			block.volumeIn = &volumeIn
			block.volumeOut = &volumeOut
		}

		dailyBlocks[dateStr] = block
	}

	chartTrafficMap := make(map[string]struct{ in, out float64 })
	chartVolumeMap := make(map[string]struct{ in, out uint64 })

	for dateStr, block := range dailyBlocks {
		if block.count > 0 {
			dayAvgIn := block.bpsInSum / float64(block.count)
			dayAvgOut := block.bpsOutSum / float64(block.count)
			chartTrafficMap[dateStr] = struct{ in, out float64 }{in: dayAvgIn, out: dayAvgOut}
			sumAvgBpsIn += dayAvgIn
			sumAvgBpsOut += dayAvgOut
			validDaysCount++
		}
		if block.volumeIn != nil {
			totalBytesIn += *block.volumeIn
			totalBytesOut += *block.volumeOut
			chartVolumeMap[dateStr] = struct{ in, out uint64 }{in: *block.volumeIn, out: *block.volumeOut}
		}
	}

	chartTrafficKeys := make([]string, 0, len(chartTrafficMap))
	for k := range chartTrafficMap {
		chartTrafficKeys = append(chartTrafficKeys, k)
	}
	sort.Strings(chartTrafficKeys)

	chartTraffic := make([]model.ChartDataPoint, 0, len(chartTrafficKeys))
	for _, date := range chartTrafficKeys {
		traffic := chartTrafficMap[date]
		chartTraffic = append(chartTraffic, model.ChartDataPoint{
			Date:     date,
			ValueIn:  traffic.in,
			ValueOut: traffic.out,
		})
	}

	chartVolumeKeys := make([]string, 0, len(chartVolumeMap))
	for k := range chartVolumeMap {
		chartVolumeKeys = append(chartVolumeKeys, k)
	}
	sort.Strings(chartVolumeKeys)

	chartVolume := make([]model.ChartDataPoint, 0, len(chartVolumeKeys))
	for _, date := range chartVolumeKeys {
		volume := chartVolumeMap[date]
		chartVolume = append(chartVolume, model.ChartDataPoint{
			Date:     date,
			ValueIn:  float64(volume.in),
			ValueOut: float64(volume.out),
		})
	}

	avgBpsIn := 0.0
	avgBpsOut := 0.0
	if validDaysCount > 0 {
		avgBpsIn = sumAvgBpsIn / float64(validDaysCount)
		avgBpsOut = sumAvgBpsOut / float64(validDaysCount)
	}

	ontTableData := []model.OntTableRow{}

	for ontIdx, measurements := range rawData {
		if len(measurements) == 0 {
			continue
		}

		infoPoint := measurements[len(measurements)-1]
		status := infoPoint.Status
		desp := infoPoint.Desp
		if desp == "" {
			desp = "ONT " + ontIdx
		}
		sn := infoPoint.SerialNumber
		plan := infoPoint.Plan
		distance := infoPoint.OltDistance

		dailyBlocks := make(map[string]struct {
			bpsInSum, bpsOutSum float64
			count               int
			volumeIn, volumeOut *uint64
		})

		for _, m := range measurements {
			t := m.Time
			timeStr := t.Format(time.RFC3339)
			bpsInVal := m.BpsIn
			bpsOutVal := m.BpsOut

			if bpsInVal > 2.5e9 || bpsOutVal > 2.5e9 {
				continue
			}

			hourStr := timeStr[11:13]
			hours, err := strconv.Atoi(hourStr)
			if err != nil {
				log.Println("error al intentar pasar la hora de texto a entero:", hourStr)
			}
			dateOnlyStr := timeStr[:10]
			isMidnight := hours == 0

			blockDate, err := time.Parse("2006-01-02T15:04:05Z", dateOnlyStr+"T12:00:00Z")
			if err != nil {
				continue
			}
			if isMidnight {
				blockDate = blockDate.AddDate(0, 0, -1)
			}
			dateStr := blockDate.Format("2006-01-02")

			if _, exists := dailyBlocks[dateStr]; !exists {
				dailyBlocks[dateStr] = struct {
					bpsInSum, bpsOutSum float64
					count               int
					volumeIn, volumeOut *uint64
				}{}
			}
			block := dailyBlocks[dateStr]

			if hours >= 19 && hours <= 23 {
				block.bpsInSum += bpsInVal
				block.bpsOutSum += bpsOutVal
				block.count++
			}

			if hours == 0 {
				volumeIn := m.BytesIn
				volumeOut := m.BytesOut
				block.volumeIn = &volumeIn
				block.volumeOut = &volumeOut
			}

			dailyBlocks[dateStr] = block
		}

		var totalVolumeIn, totalVolumeOut uint64
		var pSumAvgBpsIn, pSumAvgBpsOut float64
		var pValidDaysCount, pValidVolumeDaysCount int

		for _, block := range dailyBlocks {
			if block.count > 0 {
				pSumAvgBpsIn += (block.bpsInSum / float64(block.count))
				pSumAvgBpsOut += (block.bpsOutSum / float64(block.count))
				pValidDaysCount++
			}
			if block.volumeIn != nil {
				totalVolumeIn += *block.volumeIn
				totalVolumeOut += *block.volumeOut
				pValidVolumeDaysCount++
			}
		}

		avgBpsInOnt := 0.0
		avgBpsOutOnt := 0.0
		if pValidDaysCount > 0 {
			avgBpsInOnt = pSumAvgBpsIn / float64(pValidDaysCount)
			avgBpsOutOnt = pSumAvgBpsOut / float64(pValidDaysCount)
		}

		avgBytesIn := 0.0
		avgBytesOut := 0.0
		if pValidVolumeDaysCount > 0 {
			avgBytesIn = float64(totalVolumeIn) / float64(pValidVolumeDaysCount)
			avgBytesOut = float64(totalVolumeOut) / float64(pValidVolumeDaysCount)
		}

		ontTableData = append(ontTableData, model.OntTableRow{
			OntIdx:        ontIdx,
			Desp:          desp,
			Sn:            sn,
			Plan:          plan,
			Distance:      distance,
			Status:        status,
			AvgBpsIn:      avgBpsInOnt,
			AvgBpsOut:     avgBpsOutOnt,
			AvgBytesIn:    avgBytesIn,
			AvgBytesOut:   avgBytesOut,
			TotalBytesIn:  totalVolumeIn,
			TotalBytesOut: totalVolumeOut,
		})
	}

	return model.ProcessedOntData{
		TableData:    ontTableData,
		Summary:      model.GlobalSummary{AvgBpsIn: avgBpsIn, AvgBpsOut: avgBpsOut, TotalBytesIn: totalBytesIn, TotalBytesOut: totalBytesOut},
		ChartTraffic: chartTraffic,
		ChartVolume:  chartVolume,
		RawData:      rawData,
	}
}
