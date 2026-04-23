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
	globalChartTrafficDailyMap := make(map[string]struct{ bpsIn, bpsOut float64 })
	globalChartVolumeMap := make(map[string]struct{ vIn, vOut uint64 })

	// Mapa para almacenar bytes por fecha y GPON para calcular bps diarios
	bytesByDateAndGpon := make(map[string]map[string]struct{ bytesIn, bytesOut uint64 })

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

				// Almacenar bytes por fecha y GPON para cálculo de bps diarios
				if _, exists := bytesByDateAndGpon[dateStr]; !exists {
					bytesByDateAndGpon[dateStr] = make(map[string]struct{ bytesIn, bytesOut uint64 })
				}
				bytesByDateAndGpon[dateStr][gponIdx] = struct{ bytesIn, bytesOut uint64 }{
					bytesIn:  volumeIn,
					bytesOut: volumeOut,
				}
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

			// Los bps diarios se calcularán después con los bytes acumulados
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

	// Calcular bps diarios a partir de los bytes acumulados
	// Necesitamos ordenar las fechas para calcular diferencias entre días consecutivos
	allDates := make([]string, 0, len(bytesByDateAndGpon))
	for date := range bytesByDateAndGpon {
		allDates = append(allDates, date)
	}
	sort.Strings(allDates)

	// Calcular bps diarios para cada fecha (excepto la primera)
	for i := 1; i < len(allDates); i++ {
		currentDate := allDates[i]
		prevDate := allDates[i-1]

		var totalBpsIn, totalBpsOut float64

		// Sumar las diferencias de bytes de todos los GPONs
		for gponIdx, currentBytes := range bytesByDateAndGpon[currentDate] {
			if prevBytes, exists := bytesByDateAndGpon[prevDate][gponIdx]; exists {
				// Calcular diferencia de bytes entre días
				bytesDiffIn := float64(currentBytes.bytesIn - prevBytes.bytesIn)
				bytesDiffOut := float64(currentBytes.bytesOut - prevBytes.bytesOut)

				// Convertir a bps (bits por segundo en 24 horas)
				// 1 byte = 8 bits, 24 horas = 86400 segundos
				bpsIn := (bytesDiffIn * 8.0) / 86400.0
				bpsOut := (bytesDiffOut * 8.0) / 86400.0

				totalBpsIn += bpsIn
				totalBpsOut += bpsOut
			}
		}

		// Solo agregar al mapa si hay datos calculados
		if totalBpsIn > 0 || totalBpsOut > 0 {
			globalChartTrafficDailyMap[currentDate] = struct{ bpsIn, bpsOut float64 }{
				bpsIn:  totalBpsIn,
				bpsOut: totalBpsOut,
			}
		}
	}

	chartTrafficDailyKeys := make([]string, 0, len(globalChartTrafficDailyMap))
	for k := range globalChartTrafficDailyMap {
		chartTrafficDailyKeys = append(chartTrafficDailyKeys, k)
	}
	sort.Strings(chartTrafficDailyKeys)

	chartTrafficDaily := make([]model.ChartDataPoint, 0, len(chartTrafficDailyKeys))
	for _, date := range chartTrafficDailyKeys {
		traffic := globalChartTrafficDailyMap[date]
		chartTrafficDaily = append(chartTrafficDaily, model.ChartDataPoint{
			Date:     date,
			ValueIn:  traffic.bpsIn,
			ValueOut: traffic.bpsOut,
		})
	}

	return model.ProcessedGponData{
		TableData:               tableData,
		GlobalSummary:           globalSummary,
		GlobalChartTraffic:      chartTraffic,
		GlobalChartTrafficDaily: chartTrafficDaily,
		GlobalChartVolume:       chartVolume,
		RawData:                 rawData,
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
	chartTrafficDailyMap := make(map[string]struct{ in, out float64 })
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
		// Los bps diarios se calcularán después con los bytes acumulados
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

	// Para ProcessDetailedOntData, necesitamos calcular bps diarios
	// Primero, extraer bytes por fecha desde timeMap
	bytesByDate := make(map[string]struct{ bytesIn, bytesOut uint64 })
	for timeStr, m := range timeMap {
		hourStr := timeStr[11:13]
		hours, err := strconv.Atoi(hourStr)
		if err != nil {
			continue
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

		if hours == 0 {
			bytesByDate[dateStr] = struct{ bytesIn, bytesOut uint64 }{
				bytesIn:  m.bytes_in,
				bytesOut: m.bytes_out,
			}
		}
	}

	// Calcular bps diarios
	allDates := make([]string, 0, len(bytesByDate))
	for date := range bytesByDate {
		allDates = append(allDates, date)
	}
	sort.Strings(allDates)

	for i := 1; i < len(allDates); i++ {
		currentDate := allDates[i]
		prevDate := allDates[i-1]

		currentBytes := bytesByDate[currentDate]
		prevBytes := bytesByDate[prevDate]

		// Calcular diferencia de bytes
		bytesDiffIn := float64(currentBytes.bytesIn - prevBytes.bytesIn)
		bytesDiffOut := float64(currentBytes.bytesOut - prevBytes.bytesOut)

		// Convertir a bps (bits por segundo en 24 horas)
		// 1 byte = 8 bits, 24 horas = 86400 segundos
		bpsIn := (bytesDiffIn * 8.0) / 86400.0
		bpsOut := (bytesDiffOut * 8.0) / 86400.0

		chartTrafficDailyMap[currentDate] = struct{ in, out float64 }{
			in:  bpsIn,
			out: bpsOut,
		}
	}

	chartTrafficDailyKeys := make([]string, 0, len(chartTrafficDailyMap))
	for k := range chartTrafficDailyMap {
		chartTrafficDailyKeys = append(chartTrafficDailyKeys, k)
	}
	sort.Strings(chartTrafficDailyKeys)

	chartTrafficDaily := make([]model.ChartDataPoint, 0, len(chartTrafficDailyKeys))
	for _, date := range chartTrafficDailyKeys {
		traffic := chartTrafficDailyMap[date]
		chartTrafficDaily = append(chartTrafficDaily, model.ChartDataPoint{
			Date:     date,
			ValueIn:  traffic.in,
			ValueOut: traffic.out,
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
		TableData:         ontTableData,
		Summary:           model.GlobalSummary{AvgBpsIn: avgBpsIn, AvgBpsOut: avgBpsOut, TotalBytesIn: totalBytesIn, TotalBytesOut: totalBytesOut},
		ChartTraffic:      chartTraffic,
		ChartTrafficDaily: chartTrafficDaily,
		ChartVolume:       chartVolume,
		RawData:           rawData,
	}
}
