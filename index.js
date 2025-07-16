const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const turf = require('@turf/turf');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const enaireZonesPath = path.join(__dirname, '..', 'assets', 'enaire_zones');
let allEnaireZones = { type: 'FeatureCollection', features: [] };

// Cargar los archivos GeoJSON al iniciar el servidor
const loadEnaireZones = () => {
    try {
        console.log('Cargando zonas de ENAIRE en el servidor...');
        const aeroJson = JSON.parse(fs.readFileSync(path.join(enaireZonesPath, 'Zonas_UAS_AERO_nacional.json'), 'utf8'));
        const urbanoJson = JSON.parse(fs.readFileSync(path.join(enaireZonesPath, 'Zonas_UAS_URBANO_nacional.json'), 'utf8'));
        const infraJson = JSON.parse(fs.readFileSync(path.join(enaireZonesPath, 'Zonas_UAS_INFRAESTRUCTURAS_nacional.json'), 'utf8'));

        allEnaireZones.features = [
            ...aeroJson.features,
            ...urbanoJson.features,
            ...infraJson.features,
        ];
        console.log(`Zonas de ENAIRE cargadas en el servidor: ${allEnaireZones.features.length} features.`);
    } catch (error) {
        console.error('Error cargando zonas de ENAIRE en el servidor:', error);
    }
};

loadEnaireZones();

// Endpoint para obtener zonas de ENAIRE por coordenada
app.post('/api/enaire-zones', (req, res) => {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Coordenadas inválidas. Se esperan números para latitude y longitude.' });
    }

    const clickedPoint = turf.point([longitude, latitude]);
    const overlappingZones = allEnaireZones.features.filter(zone => {
        try {
            // Asegurarse de que la geometría es válida para turf.booleanPointInPolygon
            return turf.booleanPointInPolygon(clickedPoint, zone.geometry);
        } catch (e) {
            console.error('Error al verificar punto en polígono:', e);
            return false;
        }
    });

    const messages = overlappingZones.map(zone => zone.properties.UASZone?.message || "No hay información de alerta disponible para esta zona.");
    res.json({ messages });
});

app.listen(PORT, () => {
    console.log(`Servidor proxy de ENAIRE escuchando en http://localhost:${PORT}`);
});