import axios from 'axios';
import Papa from 'papaparse';

const GoogleSheetsService = {
  async fetchChartData() {
    const url =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSde4l6DpjFKKuGFJ54jziiC9flPCdg726BLuHubS-xteC_Lf0IqmFmT0Ck8tw-UdV9JwoXNlYYEtcd/pub?gid=0&single=true&output=csv';
    const chartData = {};

    try {
      const response = await axios.get(url);
      if (response.status === 200) {
        const csvData = Papa.parse(response.data, {
          skipEmptyLines: true,
          header: false,
        }).data;

        // Skip header row
        for (const row of csvData.slice(1)) {
          const sensorName = row[0]?.toString();
          const date = row[1]?.toString();
          const time = row[2]?.toString();
          const value = row[3]?.toString();

          if (!sensorName || !date || !time || !value) continue;

          // Parse date (DD/MM/YYYY) and time (HH:MM:SS) into Date
          const [day, month, year] = date.split('/');
          const dateTime = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`);
          
          // Convert to hour of the day (e.g., 00:17:30 → 0.29)
          const hour = dateTime.getHours() + dateTime.getMinutes() /60 ;

          // Parse sensor value to number
          const numericValue = parseFloat(value.replace(',', '.')) || 0.0;

          // Add data to chartData
          if (!chartData[sensorName]) {
            chartData[sensorName] = [];
          }
          chartData[sensorName].push({ x: hour, y: numericValue });
        }
      } else {
        throw new Error('Failed to load chart data');
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }

    return chartData;
  },
};

export default GoogleSheetsService;