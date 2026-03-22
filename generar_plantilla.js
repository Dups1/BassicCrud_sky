const XLSX = require('xlsx');

const data = [
  ['id_categoria', 'nombre', 'direccion', 'walkMin', 'driveMin', 'nota', 'patrocinado', 'favorito'],
  [1, 'Café Central', 'Calle Principal 123', 5, 10, 'Excelente café y ambiente', 'false', 'false'],
  [2, 'Restaurante La Hacienda', 'Avenida 5 de Mayo 456', 8, 15, 'Comida tradicional de alta calidad', 'true', 'true'],
  [3, 'Tienda de Artesanías', 'Plaza Mayor 789', 3, 8, 'Productos locales handmade', 'false', 'false']
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Lugares');
XLSX.writeFile(wb, 'plantilla_importar_lugares.xlsx');

console.log('✓ Plantilla generada: plantilla_importar_lugares.xlsx');
