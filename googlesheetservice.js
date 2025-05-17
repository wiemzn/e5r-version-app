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

          const [day, month, year] = date.split('/');
          const dateTime = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`);

          const numericValue = parseFloat(value.replace(',', '.')) || 0.0;

          if (!chartData[sensorName]) {
            chartData[sensorName] = [];
          }

          chartData[sensorName].push({
            x: dateTime,
            y: numericValue,
          });
        }
      } else {
        throw new Error('Failed to load chart data');
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }

    return chartData;
  },

  // Filter function to get data from the last X period
  filterDataByRange(chartData, range = 'day') {
    const now = new Date();
    let cutoffDate;

    switch (range) {
      case 'week':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'day':
      default:
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
    }

    const filteredData = {};

    for (const sensor in chartData) {
      filteredData[sensor] = chartData[sensor].filter(
        (point) => point.x >= cutoffDate
      );
    }

    return filteredData;
  },
};

export default GoogleSheetsService;
