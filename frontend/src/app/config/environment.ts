// Configuración de ambiente

export const environment = {
  production: true,
  useMockData: false,
  // Ruta relativa para Byethost (mismo dominio, sin CORS)
  apiUrl: '/api'
};

// Cuando tengas el backend PHP listo en Byethost:
// 1. Cambia useMockData a false
// 2. Actualiza apiUrl con tu dominio real
// 3. Descomenta provideHttpClient() en app.config.ts
// 4. Los servicios automáticamente usarán la API real
