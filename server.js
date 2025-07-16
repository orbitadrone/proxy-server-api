const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Permite peticiones desde cualquier origen (nuestra app)

app.post('/api/enaire-zones', async (req, res) => {
  const { bbox } = req.query;

  if (!bbox) {
    return res.status(400).send({ error: 'Missing bbox parameter' });
  }

  const enaireUrl = `https://servais.enaire.es/insignia/services/NSF_SRV/SRV_UAS_ZG_V1/MapServer/0/query?where=1%3D1&outFields=*&geometryType=esriGeometryEnvelope&geometry=${bbox}&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`;

  console.log(`Fetching data for bbox: ${bbox}`);

  try {
    const response = await axios.get(enaireUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Referer': 'https://drones.enaire.es/',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from ENAIRE:', error.response ? error.response.status : error.message);
    res.status(error.response ? error.response.status : 500).send({
      error: 'Failed to fetch data from ENAIRE',
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
