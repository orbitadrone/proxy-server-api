const express = require('express');
const fs = require('fs'); // Importar el módulo fs
const cors = require('cors');
const { point, booleanPointInPolygon } = require('@turf/turf'); // Importar turf para la lógica de geolocalización

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Para parsear el body JSON

let enaireZonesData = null; // Variable para almacenar los datos de las zonas ENAIRE

// Cargar los datos de las zonas ENAIRE al iniciar el servidor
try {
  const filePath = './assets/enaire_zones/Zonas_UAS_URBANO_nacional.json'; // Ruta relativa al directorio del proxy-server
  const rawData = fs.readFileSync(filePath);
  enaireZonesData = JSON.parse(rawData);
  console.log('Zonas ENAIRE cargadas exitosamente desde el archivo.');
} catch (error) {
  console.error('Error al cargar las zonas ENAIRE desde el archivo:', error);
  // Si el archivo no se encuentra o hay un error de parseo, el servidor no podrá funcionar correctamente
  process.exit(1); // Salir del proceso si no se pueden cargar los datos críticos
}

app.post('/api/enaire-zones', async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).send({ error: 'Missing latitude or longitude parameters in request body' });
  }

  const queryPoint = point([longitude, latitude]);
  const intersectingZones = [];

  if (enaireZonesData && enaireZonesData.features) {
    for (const feature of enaireZonesData.features) {
      // Asegurarse de que la geometría es un polígono o multipolígono
      if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        if (booleanPointInPolygon(queryPoint, feature)) {
          intersectingZones.push(feature.properties.TIPO); // O cualquier otra propiedad relevante
        }
      }
    }
  }

  if (intersectingZones.length > 0) {
    res.json({ messages: [`Punto dentro de las siguientes zonas ENAIRE: ${intersectingZones.join(', ')}`] });
  } else {
    res.json({ messages: ["No se encontraron zonas ENAIRE en este punto."] });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});