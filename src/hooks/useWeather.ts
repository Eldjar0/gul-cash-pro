import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  loading: boolean;
  error: string | null;
}

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Coordinates for Jumet, Belgium
        const latitude = 50.4333;
        const longitude = 4.4333;
        
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=Europe/Brussels`
        );
        
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          loading: false,
          error: null,
        });
      } catch (error) {
        setWeather({
          temperature: 0,
          loading: false,
          error: 'Erreur météo',
        });
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return weather;
};
