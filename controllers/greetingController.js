import axios from 'axios';
import jwt from 'jsonwebtoken';

const getGeoLocation = async (ip) => {
  const response = await axios.post(
    `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.GOOGLE_API_KEY}`,
    { considerIp: true },
  );
  return response.data.location;
};

const getState = async (lat, lon) => {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.GOOGLE_API_KEY}`,
  );
  const state = response.data.results[0].address_components.find((component) =>
    component.types.includes('administrative_area_level_1'),
  ).long_name;
  return state;
};

const getWeather = async (lat, lon) => {
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHERMAP_API_KEY}`,
  );
  return response.data.main.temp;
};

// greet user
const greetUser = async (req, res) => {
  const visitorName = req.query.visitor_name || 'stranger';
  const clientIp = req.ip;

  try {
    const { lat, lng } = await getGeoLocation(clientIp);
    const state = await getState(lat, lng);
    const temp = await getWeather(lat, lng);

    res.status(200).json({
      client_ip: clientIp,
      location: state,
      greeting: `Hello, ${visitorName}!, the temperature is ${temp} degrees Celsius in ${state}`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export { greetUser };
