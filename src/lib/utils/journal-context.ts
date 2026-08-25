// This module runs in the browser (geolocation + fetch from a client-side dialog), so it
// cannot import the canonical logger — that logger lives under `$lib/server/` specifically so
// SvelteKit's server-only import guard keeps it (and the Sentry SDK it pulls in) out of client
// bundles. A plain console.error is the deliberate exception to the "no console.*" convention.
const weatherMap: Record<number, { label: string; icon: string }> = {
	0: { label: 'Clear sky', icon: '☀️' },
	1: { label: 'Mainly clear', icon: '🌤️' },
	2: { label: 'Partly cloudy', icon: '⛅' },
	3: { label: 'Overcast', icon: '☁️' },
	45: { label: 'Fog', icon: '🌫️' },
	48: { label: 'Depositing rime fog', icon: '🌫️' },
	51: { label: 'Light drizzle', icon: '🌦️' },
	61: { label: 'Slight rain', icon: '🌧️' },
	63: { label: 'Moderate rain', icon: '🌧️' },
	65: { label: 'Heavy rain', icon: '🌧️' },
	71: { label: 'Slight snow', icon: '❄️' },
	95: { label: 'Thunderstorm', icon: '⛈️' }
	// Add more codes as needed from WMO standards
};

type CurrentWeatherResponse = {
	current_weather?: {
		temperature?: number;
		weathercode?: number;
	};
};

type JournalWeather = {
	temperature: number;
	condition: string;
};

function getCurrentPosition(): Promise<GeolocationPosition> {
	if (typeof navigator === 'undefined' || !navigator.geolocation) {
		throw new TypeError('Geolocation is not supported by your browser.');
	}

	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(resolve, reject);
	});
}

export async function getCurrentWeather(): Promise<JournalWeather> {
	try {
		const position = await getCurrentPosition();
		const { latitude, longitude } = position.coords;

		const weatherResponse = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
		);

		if (!weatherResponse.ok) {
			throw new TypeError('Unable to retrieve weather information.');
		}

		const weatherData = (await weatherResponse.json()) as CurrentWeatherResponse;
		const temperature = weatherData.current_weather?.temperature;
		const weatherCode = weatherData.current_weather?.weathercode;

		if (typeof temperature !== 'number' || typeof weatherCode !== 'number') {
			throw new TypeError('Unable to retrieve weather information.');
		}

		const weatherEntry = weatherMap[weatherCode];
		const condition = weatherEntry ? `${weatherEntry.label} ${weatherEntry.icon}` : 'Unknown';

		return {
			temperature,
			condition
		};
	} catch (error) {
		console.error('Failed to get weather', error);
		throw new TypeError('Unable to retrieve your location for weather information.');
	}
}
