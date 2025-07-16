const express = require('express');
const fs = require('fs'); // Importar el módulo fs
const cors = require('cors');
const { point, booleanPointInPolygon } = require('@turf/turf'); // Importar turf para la lógica de geolocalización

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Para parsear el body JSON

let enaireZonesData = {
  type: "FeatureCollection",
  features: []
};

// Cargar y combinar los datos de las zonas ENAIRE al iniciar el servidor
try {
  const zoneFiles = [
    './assets/enaire_zones/ZGUAS_Aero.json',
    './assets/enaire_zones/ZGUAS_Infra.json',
    './assets/enaire_zones/ZGUAS_Urbano.json'
  ];

  zoneFiles.forEach(filePath => {
    const rawData = fs.readFileSync(filePath);
    const jsonData = JSON.parse(rawData);
    if (jsonData.features) {
      enaireZonesData.features.push(...jsonData.features);
    }
  });

  console.log('Todas las zonas ENAIRE cargadas y combinadas exitosamente.');
} catch (error) {
  console.error('Error al cargar o combinar las zonas ENAIRE desde los archivos:', error);
  process.exit(1);
}

app.post('/api/enaire-zones', async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).send({ error: 'Missing latitude or longitude parameters in request body' });
  }

  const queryPoint = point([longitude, latitude]);
  const intersectingFeatures = [];
  const messages = []; // Usaremos este array para los mensajes individuales

  if (enaireZonesData && enaireZonesData.features) {
    for (const feature of enaireZonesData.features) {
      if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        // Mantenemos la exclusión de zonas TPM
        if (feature.properties.UASZone && feature.properties.UASZone.type === 'TPM') {
          continue;
        }

        if (booleanPointInPolygon(queryPoint, feature)) {
          intersectingFeatures.push(feature);
          const zoneProps = feature.properties.UASZone;
          // Construir un mensaje más fiable y directo
          const message = `Tipo de zona: ${zoneProps.type}, Identificador: ${zoneProps.identifier}`;
          messages.push(message);
        }
      }
    }
  }

  console.log(`Se encontraron ${messages.length} zonas intersectadas.`);

  if (intersectingFeatures.length > 0) {
    res.json({
      messages: messages, // Devolver el array de mensajes detallados
      features: intersectingFeatures
    });
  } else {
    res.json({ messages: ["No se encontraron zonas ENAIRE en este punto."], features: [] });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});