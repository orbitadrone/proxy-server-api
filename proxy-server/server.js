const express = require('express');
const fs = require('fs'); // Importar el módulo fs
const cors = require('cors');
const { point, booleanPointInPolygon } = require('@turf/turf'); // Importar turf para la lógica de geolocalización

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Para parsear el body JSON

app.post('/api/enaire-zones', async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).send({ error: 'Missing latitude or longitude parameters in request body' });
  }

  const queryPoint = point([longitude, latitude]);
  const intersectingFeatures = [];
  const messages = [];

  const zoneFiles = [
    './assets/enaire_zones/ZGUAS_Aero.json',
    // './assets/enaire_zones/ZGUAS_Infra.json', // Excluido temporalmente para pruebas de memoria
    './assets/enaire_zones/ZGUAS_Urbano.json'
  ];

  for (const filePath of zoneFiles) {
    try {
      const rawData = fs.readFileSync(filePath);
      const enaireZonesData = JSON.parse(rawData);

      if (enaireZonesData && enaireZonesData.features) {
        for (const feature of enaireZonesData.features) {
          if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
            if (feature.properties.UASZone && (feature.properties.UASZone.type === 'TPM' || feature.properties.UASZone.type === 'TMA' || feature.properties.UASZone.identifier === 'NPLONA' || feature.properties.UASZone.identifier === 'NPDRID')) {
              continue;
            }

            if (booleanPointInPolygon(queryPoint, feature)) {
              intersectingFeatures.push(feature);
              // Usar el mensaje completo de la zona
              if (feature.properties.UASZone && feature.properties.UASZone.message) {
                messages.push(feature.properties.UASZone.message);
              } else {
                // Fallback si no hay mensaje específico
                const zoneProps = feature.properties.UASZone;
                messages.push(`Tipo de zona: ${zoneProps.type}, Identificador: ${zoneProps.identifier}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error al cargar o parsear el archivo ${filePath}:`, error);
      // Continuar con los otros archivos aunque uno falle
    }
  }

  console.log(`Se encontraron ${messages.length} zonas intersectadas.`);

  if (intersectingFeatures.length > 0) {
    res.json({
      messages: messages,
      features: intersectingFeatures
    });
  } else {
    res.json({ messages: ["No se encontraron zonas ENAIRE en este punto."], features: [] });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});