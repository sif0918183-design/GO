const CACHE_NAME = 'terhal-sudan-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/init.html',
  '/css/style.css',
  '/js/supabase-config.js',
  '/js/initialize-jsonbin.js',
  '/js/init-system.js',
  '/js/geolocation.js'
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// استراتيجية Network First: جلب الأحدث من الإنترنت، وإذا فشل استخدم التخزين
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
