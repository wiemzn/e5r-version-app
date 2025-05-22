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

        for (const row of csvData.slice(1)) {
          const sensorName = row[0]?.toString();
          const date = row[1]?.toString(); // Format: DD/MM/YYYY
          const time = row[2]?.toString(); // Format: HH:MM:SS
          const value = row[3]?.toString();

          if (!sensorName || !date || !time || !value) continue;

          // Parse date and time into Date object
          const [day, month, year] = date.split('/');
          const dateTime = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`);
          
          // Get the exact time in decimal hours for precise plotting
          const hours = dateTime.getHours();
          const minutes = dateTime.getMinutes();
          const timeInHours = hours + (minutes / 60);
          
          // Parse sensor value to number (handle comma decimal separator)
          const numericValue = parseFloat(value.replace(',', '.'));

          if (!chartData[sensorName]) {
            chartData[sensorName] = [];
          }

          chartData[sensorName].push({
            x: timeInHours,
            y: numericValue,
            originalTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
          });
        }

        // Sort data points by time for each sensor
        for (const sensor in chartData) {
          chartData[sensor].sort((a, b) => a.x - b.x);
        }
      } else {
        throw new Error('Failed to load chart data');
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }

    return chartData;
  },

  filterDataByRange(chartData, range = 'day') {
    return chartData;
  },

  formatXAxisLabel(timeInHours) {
    // Convert decimal hours back to HH:MM format
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
};

export default GoogleSheetsService;