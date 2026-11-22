/* Service worker: ให้เกมเปิดและเล่นได้แม้ออฟไลน์
 * ค่า VERSION ด้านล่างถูกแทนด้วยแฮชของ index.html ตอน build ทุกครั้งที่แก้เกม แอปจะอัปเดตเอง */
var VERSION = 'd9bd3af589';
var CACHE = 'piithai-fm-' + VERSION;
var SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('piithai-fm-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* หน้าเกม: ลองเครือข่ายก่อนจะได้เวอร์ชันล่าสุด ถ้าออฟไลน์ใช้ของที่เก็บไว้ */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', copy); }); }
      return res;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }

  /* ไฟล์อื่น (ไอคอน ข้อมูล รูป): ใช้ที่เก็บไว้ก่อน แล้วอัปเดตเบื้องหลัง */
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
