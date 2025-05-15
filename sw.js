const CACHE_NAME = 'hockey-app-cache-v2'; // Incrementa la versión para actualizar el caché
const URLS_TO_CACHE = [
  './', // Si tu index.html es la raíz
  'index.html',
  'manifest.json',
];

// Instalación: Cachear los assets principales
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: Instalación completa.');
        return self.skipWaiting(); // Forzar activación del nuevo SW
      })
      .catch(error => {
        console.error('Service Worker: Falló el cacheo del app shell:', error);
      })
  );
});

// Activación: Limpiar cachés viejos
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activación completa, controlando clientes.');
      return self.clients.claim(); // Tomar control inmediato de las páginas abiertas
    })
  );
});

// Fetch: Servir desde caché o red, con fallback básico
self.addEventListener('fetch', event => {
  const { request } = event;

  // Para funciones de Netlify (API calls) -> Network first, o manejo offline específico
  if (request.url.includes('/.netlify/functions/')) {
    event.respondWith(
      fetch(request)
        .catch(error => {
          console.warn(`Service Worker: Falló fetch para ${request.url}. Intentando fallback si es POST.`, error);
          // Para POST (como saveActions), lo ideal es encolar la petición con Background Sync.
          // Este es un fallback muy simple.
          if (request.method === 'POST') {
            return new Response(JSON.stringify({ 
              status: 'offline', 
              message: 'Estás offline. La acción se intentará guardar más tarde (funcionalidad no implementada en este SW básico).' 
            }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503 // Service Unavailable
            });
          }
          // Para GET, podrías devolver un JSON de error o una respuesta cacheada si tiene sentido.
          return new Response(JSON.stringify({ status: 'offline', message: 'No se pudo obtener la información. Revisa tu conexión.' }), {
             headers: { 'Content-Type': 'application/json' },
             status: 503
          });
        })
    );
    return;
  }

  // Para otros requests (app shell, assets estáticos) -> Cache first
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // console.log('Service Worker: Sirviendo desde caché:', request.url);
          return cachedResponse;
        }
        // console.log('Service Worker: Trayendo desde la red:', request.url);
        return fetch(request).then(networkResponse => {
          // Opcional: Cachear nuevos recursos dinámicamente
          if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
             // No cachear todo indiscriminadamente. Solo lo que sabes que es seguro y estático.
             // Por ejemplo, si CDN de Tailwind no está en URLS_TO_CACHE inicialmente.
             if (request.url === 'https://cdn.tailwindcss.com') {
                 const responseToCache = networkResponse.clone();
                 caches.open(CACHE_NAME).then(cache => {
                     cache.put(request, responseToCache);
                 });
             }
          }
          return networkResponse;
        });
      }).catch(error => {
        console.error('Service Worker: Error de Fetch:', error, request.url);
        // Podrías redirigir a una página offline.html genérica
        // return caches.match('/offline.html'); 
      })
  );
});