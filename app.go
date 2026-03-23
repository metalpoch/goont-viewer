package main

import (
	"context"
	"fmt"
	"log"

	"goont-viewer/model"
	"goont-viewer/utils"
)

const BASE_URL string = "http://localhost:8080"

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

	// Convert single ONT array to OntResponse format
	ontResponse := make(model.OntResponse)
	ontResponse[ontIdx] = rawData

	processedData := utils.ProcessDetailedOntData(ontResponse)
	return processedData, nil
}
