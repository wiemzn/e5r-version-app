import axios from 'axios';
import Papa from 'papaparse';

const GoogleSheetsService = {
  async fetchChartData() {
    const url =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSde4l6DpjFKKuGFJ54jziiC9flPCdg726BLuHubS-xteC_Lf0IqmFmT0Ck8tw-UdV9JwoXNlYYEtcd/pub?gid=0&single=true&output=csv';
    
    const chartData = {
      daily: {},
      weekly: {}
    };

    try {
      const response = await axios.get(url);
      if (response.status === 200) {
        const csvData = Papa.parse(response.data, {
          skipEmptyLines: true,
          header: false,
        }).data;

        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get date 7 days ago at midnight
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const dailyData = {};
        const weeklyDataByDay = {};

        for (const row of csvData.slice(1)) {
          const sensorName = row[0]?.toString().toLowerCase();
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

          // Format for display
          const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          const formattedDate = `${day}/${month}`;

          // Add to daily data if it's from today
          if (dateTime >= today) {
            if (!dailyData[sensorName]) {
              dailyData[sensorName] = [];
            }
            dailyData[sensorName].push({
              x: timeInHours,
              y: numericValue,
              originalTime: formattedTime
            });
          }

          // Add to weekly data if it's from the last 7 days
          if (dateTime >= weekAgo) {
            if (!weeklyDataByDay[sensorName]) {
              weeklyDataByDay[sensorName] = {};
            }
            if (!weeklyDataByDay[sensorName][formattedDate]) {
              weeklyDataByDay[sensorName][formattedDate] = {
                sum: 0,
                count: 0,
                date: formattedDate
              };
            }
            weeklyDataByDay[sensorName][formattedDate].sum += numericValue;
            weeklyDataByDay[sensorName][formattedDate].count += 1;
          }
        }

        // Sort and process daily data
        for (const sensor in dailyData) {
          chartData.daily[sensor] = dailyData[sensor].sort((a, b) => a.x - b.x);
        }

        // Process weekly data - calculate averages
        for (const sensor in weeklyDataByDay) {
          chartData.weekly[sensor] = Object.values(weeklyDataByDay[sensor])
            .map(dayData => ({
              x: dayData.date,
              y: dayData.sum / dayData.count, // Calculate average
              originalTime: dayData.date
            }))
            .sort((a, b) => {
              // Sort by date (DD/MM format)
              const [aDay, aMonth] = a.x.split('/').map(Number);
              const [bDay, bMonth] = b.x.split('/').map(Number);
              return aMonth === bMonth ? aDay - bDay : aMonth - bMonth;
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

  filterDataByRange(chartData, range = 'day') {
    if (!chartData) return null;
    const data = range === 'day' ? chartData.daily : chartData.weekly;
    
    // Ensure we have valid data for the selected range
    if (!data) return null;
    
    return data;
  },

  formatXAxisLabel(value, range = 'day') {
    // Return the value as is since we're now handling the formatting during data processing
    return value;
  }
};

export default GoogleSheetsService;