const weatherapiKey = "28dc457030ec4e69bfe131408250107";
const owmApiKey = "ac1a9ad688dee52dfd615f7f65f230cf"; // Replace with your OpenWeatherMap API key
const lat = 29.1911; // Anupgarh latitude
const lon = 73.2086; // Anupgarh longitude

// Fetch historical data for a specific date
async function getHistoricalData(date) {
    const url = `http://api.weatherapi.com/v1/history.json?key=${weatherapiKey}&q=${lat},${lon}&dt=${date}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!data.error) {
            return data.forecast.forecastday[0].hour;
        } else {
            console.error(`Error fetching historical data for ${date}: ${data.error.message}`);
            return [];
        }
    } catch (e) {
        console.error(`Error fetching historical data for ${date}: ${e}`);
        return [];
    }
}

// Fetch current weather
async function getCurrentWeather() {
    const url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${owmApiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.cod === 200) {
            return data;
        } else {
            console.error(`Error fetching current weather: ${data.message}`);
            return null;
        }
    } catch (e) {
        console.error(`Error fetching current weather: ${e}`);
        return null;
    }
}

// Fetch 2-day forecast
async function getForecastData() {
    const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${owmApiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.cod === "200") {
            return data.list.slice(0, 16); // 48 hours, 3-hour intervals
        } else {
            console.error(`Error fetching forecast: ${data.message}`);
            return [];
        }
    } catch (e) {
        console.error(`Error fetching forecast: ${e}`);
        return [];
    }
}

// Display current weather
function displayCurrentWeather(data) {
    if (!data) return;
    const time = new Date(data.dt * 1000).toLocaleString();
    document.getElementById("current-time").innerText = `Time: ${time}`;
    document.getElementById("current-temp").innerText = `Temperature: ${data.main.temp}°C`;
    document.getElementById("current-humidity").innerText = `Humidity: ${data.main.humidity}%`;
    document.getElementById("current-weather").innerText = `Weather: ${data.weather[0].description}`;
    document.getElementById("current-rain").innerText = `Rain Chance: ${data.rain ? data.rain["1h"] || 0 : 0} mm`;
    document.getElementById("current-wind").innerText = `Wind Speed: ${data.wind.speed} m/s`;
}

// Display historical data
function displayHistoricalData(data) {
    const tbody = document.getElementById("historical-body");
    data.forEach(hour => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${hour.time}</td>
            <td>${hour.temp_c}</td>
            <td>${hour.humidity}</td>
            <td>${hour.condition.text}</td>
            <td>${hour.chance_of_rain || 0}</td>
            <td>${(hour.wind_kph / 3.6).toFixed(1)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Display forecast data
function displayForecastData(data) {
    const tbody = document.getElementById("forecast-body");
    data.forEach(forecast => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${forecast.dt_txt}</td>
            <td>${forecast.main.temp}</td>
            <td>${forecast.main.humidity}</td>
            <td>${forecast.weather[0].description}</td>
            <td>${(forecast.pop * 100).toFixed(0)}</td>
            <td>${forecast.wind.speed.toFixed(1)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Create graphs
function createGraphs(historical, forecast) {
    const times = historical.map(h => h.time).concat(forecast.map(f => f.dt_txt));
    const temps = historical.map(h => h.temp_c).concat(forecast.map(f => f.main.temp));
    const humidities = historical.map(h => h.humidity).concat(forecast.map(f => f.main.humidity));
    const winds = historical.map(h => h.wind_kph / 3.6).concat(forecast.map(f => f.wind.speed));

    new Chart(document.getElementById("temp-chart"), {
        type: "line",
        data: {
            labels: times,
            datasets: [{
                label: "Temperature (°C)",
                data: temps,
                borderColor: "#4CAF50",
                fill: false
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Time" } },
                y: { title: { display: true, text: "Temperature (°C)" } }
            }
        }
    });

    new Chart(document.getElementById("humidity-chart"), {
        type: "line",
        data: {
            labels: times,
            datasets: [{
                label: "Humidity (%)",
                data: humidities,
                borderColor: "#2196F3",
                fill: false
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Time" } },
                y: { title: { display: true, text: "Humidity (%)" } }
            }
        }
    });

    new Chart(document.getElementById("wind-chart"), {
        type: "line",
        data: {
            labels: times,
            datasets: [{
                label: "Wind Speed (m/s)",
                data: winds,
                borderColor: "#FF9800",
                fill: false
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Time" } },
                y: { title: { display: true, text: "Wind Speed (m/s)" } }
            }
        }
    });
}

// Fetch and display all data with dynamic dates
async function init() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const historicalDates = [];

    // Calculate previous 3 days
    for (let i = 3; i > 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        historicalDates.push(date.toISOString().split("T")[0]);
    }

    // Update date range in HTML
    const startDate = historicalDates[0];
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 2);
    document.getElementById("date-range").innerText = `Historical (${startDate} to ${historicalDates[2]}), Current (${todayStr}), and Forecast (${todayStr} to ${endDate.toISOString().split("T")[0]})`;
    document.getElementsByTagName("h2")[0].innerText = `Current Weather (${todayStr})`;
    document.getElementsByTagName("h2")[1].innerText = `Historical Weather (${startDate} to ${historicalDates[2]})`;
    document.getElementsByTagName("h2")[2].innerText = `Forecast (${todayStr} to ${endDate.toISOString().split("T")[0]})`;

    // Fetch historical data
    const historical = [];
    for (const date of historicalDates) {
        const data = await getHistoricalData(date);
        historical.push(...data);
    }

    // Fetch current and forecast data
    const current = await getCurrentWeather();
    const forecast = await getForecastData();

    // Display data
    displayCurrentWeather(current);
    displayHistoricalData(historical);
    displayForecastData(forecast);

    // Create graphs
    createGraphs(historical, forecast);
}

init();
