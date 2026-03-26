package main

import (
	"context"
	"fmt"
	"log"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/xuri/excelize/v2"
	"goont-viewer/model"
	"goont-viewer/utils"
)

const BASE_URL string = "https://10.120.93.114/goont"

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetOLTs() ([]model.OLT, error) {
	url := BASE_URL + "/api/v1/olt"
	var olts []model.OLT
	if err := utils.Requests(a.ctx, url, &olts); err != nil {
		return nil, fmt.Errorf("error fetching OLTs: %w", err)
	}

	return olts, nil
}

func (a *App) GetOltDetails(ip string) (model.OLT, error) {
	url := fmt.Sprintf("http://%s/api/v1/olt/%s", BASE_URL, ip)
	log.Printf("[DEBUG] Fetching OLT data from URL: %s", url)

	var olt model.OLT
	if err := utils.Requests(a.ctx, url, &olt); err != nil {
		return model.OLT{}, fmt.Errorf("error fetching OLT details: %w", err)
	}

	return olt, nil
}

func (a *App) GetProcessedGponData(ip, initDate, endDate string) (model.ProcessedGponData, error) {
	url := fmt.Sprintf("%s/api/v1/traffic/%s?initDate=%s&endDate=%s", BASE_URL, ip, initDate, endDate)

	var rawData model.GponResponse
	if err := utils.Requests(a.ctx, url, &rawData); err != nil {
		return model.ProcessedGponData{}, fmt.Errorf("error fetching GPON data: %w", err)
	}

	processedData, err := utils.ProcessGponData(rawData)
	return processedData, err
}

func (a *App) GetProcessedOntData(ip, gponIdx, initDate, endDate string) (model.ProcessedOntData, error) {
	url := fmt.Sprintf("%s/api/v1/traffic/%s/%s?initDate=%s&endDate=%s", BASE_URL, ip, gponIdx, initDate, endDate)

	var rawData model.OntResponse
	if err := utils.Requests(a.ctx, url, &rawData); err != nil {
		return model.ProcessedOntData{}, fmt.Errorf("error fetching ONT data: %w", err)
	}

	processedData := utils.ProcessDetailedOntData(rawData)
	return processedData, nil
}

func (a *App) GetProcessedSpecificOntData(ip, gponIdx, ontIdx, initDate, endDate string) (model.ProcessedOntData, error) {
	url := fmt.Sprintf("%s/api/v1/traffic/%s/%s/%s?initDate=%s&endDate=%s", BASE_URL, ip, gponIdx, ontIdx, initDate, endDate)

	var rawData []model.OntMeasurement
	if err := utils.Requests(a.ctx, url, &rawData); err != nil {
		return model.ProcessedOntData{}, fmt.Errorf("error fetching specific ONT data: %w", err)
	}

	ontResponse := make(model.OntResponse)
	ontResponse[ontIdx] = rawData

	processedData := utils.ProcessDetailedOntData(ontResponse)
	return processedData, nil
}

func (a *App) OpenExternalURL(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}

func (a *App) SaveFileDialog(defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Excel Files (*.xlsx)",
				Pattern:     "*.xlsx",
			},
		},
	})
}

type ExportData struct {
	Data   []map[string]interface{} `json:"data"`
	Sheets []ExportSheet            `json:"sheets"`
}

type ExportSheet struct {
	Name string                   `json:"name"`
	Data []map[string]interface{} `json:"data"`
}

func (a *App) ExportToExcel(exportData ExportData, filename string) (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: filename + ".xlsx",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Excel Files (*.xlsx)",
				Pattern:     "*.xlsx",
			},
		},
	})

	if err != nil {
		return "", fmt.Errorf("error opening save dialog: %w", err)
	}

	if filePath == "" {
		return "", nil
	}

	f := excelize.NewFile()
	defer f.Close()

	if len(exportData.Data) > 0 {
		sheetName := "Datos"
		f.SetSheetName("Sheet1", sheetName)

		headers := make([]string, 0)
		if len(exportData.Data) > 0 {
			for key := range exportData.Data[0] {
				headers = append(headers, key)
			}
		}

		for i, header := range headers {
			cell, _ := excelize.CoordinatesToCellName(i+1, 1)
			f.SetCellValue(sheetName, cell, header)
		}

		for rowIdx, row := range exportData.Data {
			for colIdx, header := range headers {
				cell, _ := excelize.CoordinatesToCellName(colIdx+1, rowIdx+2)
				if value, ok := row[header]; ok {
					f.SetCellValue(sheetName, cell, value)
				}
			}
		}
	}

	for _, sheet := range exportData.Sheets {
		if len(sheet.Data) > 0 {
			index, _ := f.NewSheet(sheet.Name)

			headers := make([]string, 0)
			if len(sheet.Data) > 0 {
				for key := range sheet.Data[0] {
					headers = append(headers, key)
				}
			}

			for i, header := range headers {
				cell, _ := excelize.CoordinatesToCellName(i+1, 1)
				f.SetCellValue(sheet.Name, cell, header)
			}

			for rowIdx, row := range sheet.Data {
				for colIdx, header := range headers {
					cell, _ := excelize.CoordinatesToCellName(colIdx+1, rowIdx+2)
					if value, ok := row[header]; ok {
						f.SetCellValue(sheet.Name, cell, value)
					}
				}
			}

			if index == 1 {
				f.SetActiveSheet(index)
			}
		}
	}

	if err := f.SaveAs(filePath); err != nil {
		return "", fmt.Errorf("error saving Excel file: %w", err)
	}

	return filePath, nil
}
