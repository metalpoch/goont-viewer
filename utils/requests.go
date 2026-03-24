package utils

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

type HTTPError struct {
	StatusCode int
	Status     string
	Body       string
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("HTTP %d: %s - %s", e.StatusCode, e.Status, e.Body)
}

func Requests(ctx context.Context, url string, result any) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Accept", "application/json")

	tlsConfig := &tls.Config{InsecureSkipVerify: true}
	transport := &http.Transport{TLSClientConfig: tlsConfig}
	client := &http.Client{Transport: transport}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error executing request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error reading response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &HTTPError{
			StatusCode: resp.StatusCode,
			Status:     resp.Status,
			Body:       string(body),
		}
	}

	if err := json.Unmarshal(body, result); err != nil {
		log.Printf("[DEBUG] JSON parsing error: %v", err)
		log.Printf("[DEBUG] Response body (first 500 chars): %s", string(body[:min(500, len(body))]))
		return fmt.Errorf("error parsing JSON: %w, body: %s", err, string(body[:min(500, len(body))]))
	}

	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
