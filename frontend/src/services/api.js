const BASE_URL = 'http://localhost:8080/api/v1';

export async function getOLTs() {
  try {
    const response = await fetch(`${BASE_URL}/olt`);
    if (!response.ok) throw new Error('Failed to fetch OLTs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching OLTs:', error);
    throw error;
  }
}

export async function getOltDetails(ip) {
  try {
    const response = await fetch(`${BASE_URL}/olt/${ip}`);
    if (!response.ok) throw new Error('Failed to fetch OLT details');
    return await response.json();
  } catch (error) {
    console.error('Error fetching OLT details:', error);
    throw error;
  }
}

export async function getGponTraffic(ip, initDate, endDate) {
  try {
    // Both dates expected in RFC3339 format, we encode them to safely transport '+' and ':'
    const response = await fetch(`${BASE_URL}/traffic/${ip}?initDate=${encodeURIComponent(initDate)}&endDate=${encodeURIComponent(endDate)}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch GPON traffic');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching GPON traffic:', error);
    throw error;
  }
}

export async function getDetailedOntTraffic(ip, gponIdx, initDate, endDate) {
  try {
    // Both dates expected in RFC3339 format
    const response = await fetch(`${BASE_URL}/traffic/${ip}/${gponIdx}?initDate=${encodeURIComponent(initDate)}&endDate=${encodeURIComponent(endDate)}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch detailed ONT traffic');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching detailed traffic for GPON ${gponIdx}:`, error);
    throw error;
  }
}
