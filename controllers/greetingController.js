import axios from 'axios';

// Function to get client's IP address from request headers
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(/, /)[0]
    : req.connection.remoteAddress;
  return ip;
};

// Function to get geolocation based on IP address using ipinfo.io
const getGeoLocation = async (ip) => {
  const response = await axios.get(
    `https://ipinfo.io/${ip}/geo?token=${process.env.IPINFO_API_KEY}`,
  );
  const [lat, lon] = response.data.loc.split(',');
  return { lat, lon };
};

// Function to get state based on latitude and longitude
const getState = async (lat, lon) => {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.GOOGLE_API_KEY}`,
  );
  const state = response.data.results[0].address_components.find((component) =>
    component.types.includes('administrative_area_level_1'),
  ).long_name;
  return state;
};

// Function to get weather based on latitude and longitude
const getWeather = async (lat, lon) => {
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHERMAP_API_KEY}`,
  );
  return response.data.main.temp;
};

// Function to greet user
const greetUser = async (req, res) => {
  const visitorName = req.query.visitor_name || 'stranger';
  const clientIp = getClientIp(req);

  try {
    const { lat, lon } = await getGeoLocation(clientIp);
    const state = await getState(lat, lon);
    const temp = await getWeather(lat, lon);

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
