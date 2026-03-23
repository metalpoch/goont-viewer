// Importar el objeto App desde el backend de Wails
import { GetOLTs, GetOltDetails, GetProcessedGponData, GetProcessedOntData, GetProcessedSpecificOntData } from '../../wailsjs/go/main/App';

export async function getOLTs() {
  try {
    return await GetOLTs();
  } catch (error) {
    console.error('Error fetching OLTs:', error);
    throw error;
  }
}

export async function getOltDetails(ip) {
  try {
    return await GetOltDetails(ip);
  } catch (error) {
    console.error('Error fetching OLT details:', error);
    throw error;
  }
}

export async function getGponTraffic(ip, initDate, endDate) {
  try {
    return await GetProcessedGponData(ip, initDate, endDate);
  } catch (error) {
    console.error('Error fetching GPON traffic:', error);
    throw error;
  }
}

export async function getDetailedOntTraffic(ip, gponIdx, initDate, endDate) {
  try {
    return await GetProcessedOntData(ip, gponIdx, initDate, endDate);
  } catch (error) {
    console.error(`Error fetching detailed traffic for GPON ${gponIdx}:`, error);
    throw error;
  }
}

export async function getSpecificOntTraffic(ip, gponIdx, ontIdx, initDate, endDate) {
  try {
    return await GetProcessedSpecificOntData(ip, gponIdx, ontIdx, initDate, endDate);
  } catch (error) {
    console.error(`Error fetching specific traffic for ONT ${ontIdx} in GPON ${gponIdx}:`, error);
    throw error;
  }
}
