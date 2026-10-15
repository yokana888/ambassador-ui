importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
importScripts('./firebase-config.js');

firebase.initializeApp(self.firebaseMessagingConfig.firebaseConfig);

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
  var notification = payload.notification || {};
  var data = payload.data || {};
  var notificationTitle = notification.title || data.title;

  if (!notificationTitle) {
    return;
  }

  return self.registration.showNotification(notificationTitle, {
    body: notification.body || data.body || '',
    icon: notification.icon || data.icon,
    data: { url: data.url || '/' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  var targetUrl = new URL(event.notification.data.url || '/', self.location.origin);
  if (targetUrl.origin !== self.location.origin) {
    targetUrl = new URL('/', self.location.origin);
  }

  event.waitUntil(self.clients.openWindow(targetUrl.href));
});