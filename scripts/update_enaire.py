import requests
import os
import zipfile

# **IMPORTANTE: DEBES CONFIRMAR ESTA URL BASE**
# Esta es una suposición común para archivos GeoJSON.
# Si la URL es diferente, por favor, corrígela.
JSON_FILES = [
    "ZGUAS_AERO.zip",
    "ZGUAS_URBANO.zip",
    "ZGUAS_INFRAESTRUCTURAS.zip"
]

# Ruta donde se guardarán los archivos en tu proyecto
DOWNLOAD_DIR = r"C:\Users\ton69\orbitadrone\assets\enaire_zones"

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

        # Descomprimir el archivo
        if destination_path.endswith('.zip'):
            print(f"Descomprimiendo {destination_path}...")
            with zipfile.ZipFile(destination_path, 'r') as zip_ref:
                zip_ref.extractall(os.path.dirname(destination_path))
            print(f"Descompresión completada.")
            os.remove(destination_path) # Eliminar el archivo .zip después de descomprimir
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar {url}: {e}")

def update_enaire_json_files():
    """Actualiza los archivos JSON de ENAIRE."""
    print("Iniciando actualización de archivos JSON de ENAIRE...")
    os.makedirs(DOWNLOAD_DIR, exist_ok=True) # Asegura que el directorio exista

    for filename in JSON_FILES:
        url = f"https://aip.enaire.es/AIP/docs/{filename}"
        destination_path = os.path.join(DOWNLOAD_DIR, filename)
        download_file(url, destination_path)
    print("Actualización de archivos JSON de ENAIRE finalizada.")

if __name__ == "__main__":
    update_enaire_json_files()
