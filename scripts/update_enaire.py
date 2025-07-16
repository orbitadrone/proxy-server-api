import requests
import os

# **IMPORTANTE: DEBES CONFIRMAR ESTA URL BASE**
# Esta es una suposición común para archivos GeoJSON.
# Si la URL es diferente, por favor, corrígela.
BASE_URL = "https://aip.enaire.es/AIP/geojson/" 

JSON_FILES = [
    "ZGUAS_Aero.json",
    "ZGUAS_Urbano.json",
    "ZGUAS_Infraestructuras.json"
]

# Ruta donde se guardarán los archivos en tu proyecto
DOWNLOAD_DIR = "C:\Users\ton69\orbitadrone\assets\enaire_zones"

def download_file(url, destination_path):
    """Descarga un archivo desde una URL a una ruta de destino."""
    try:
        print(f"Descargando {url} a {destination_path}...")
        response = requests.get(url, stream=True)
        response.raise_for_status() # Lanza una excepción para errores HTTP

        with open(destination_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Descarga completada: {destination_path}")
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar {url}: {e}")

def update_enaire_json_files():
    """Actualiza los archivos JSON de ENAIRE."""
    print("Iniciando actualización de archivos JSON de ENAIRE...")
    os.makedirs(DOWNLOAD_DIR, exist_ok=True) # Asegura que el directorio exista

    for filename in JSON_FILES:
        url = f"{BASE_URL}{filename}"
        destination_path = os.path.join(DOWNLOAD_DIR, filename)
        download_file(url, destination_path)
    print("Actualización de archivos JSON de ENAIRE finalizada.")

if __name__ == "__main__":
    update_enaire_json_files()
