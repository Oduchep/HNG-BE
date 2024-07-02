import axios from 'axios';

// Function to get geolocation based on IP address (consider free IP geolocation API)

const getGeoLocation = async () => {
  try {
    const response = await axios.get(
      `https://ipinfo.io/?token=${process.env.IPINFO_API_KEY}`,
    );

    if (!response.data) {
      throw new Error('Invalid response from IP geolocation service');
    }

    const coordinates = response.data.loc.split(',');
    const latitude = parseFloat(coordinates[0]);
    const longitude = parseFloat(coordinates[1]);

    const data = {
      ip: response.data.ip,
      city: response.data.city,
      region: response.data.region,
      country: response.data.country,
      latitude: latitude,
      longitude: longitude,
      org: response.data.org,
      timezone: response.data.timezone,
    };

    // console.log({ data });

    return data;
  } catch (error) {
    throw new Error(`Error fetching geolocation: ${error.message}`);
  }
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

  try {
    const locationData = await getGeoLocation();
    const temp = await getWeather(
      locationData.latitude,
      locationData.longitude,
    );

    res.status(200).json({
      client_ip: locationData?.ip,
      location: locationData?.city,
      greeting: `Hello, ${visitorName}!, the temperature is ${temp} degrees Celsius in ${locationData?.city}`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export { greetUser };
