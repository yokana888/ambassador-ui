import { Aurelia, inject, computedFrom } from 'aurelia-framework';
import { AuthService } from 'aurelia-authentication';
import { AuthStep } from './utils/auth-step';
import firebase from './utils/firebase-messaging';
import firebaseMessagingConfig from './utils/firebase-config';
import routes from './routes/index';

@inject(AuthService)
export class App {
  constructor(authService) {
    this.authService = authService;
  }

  configureRouter(config, router) {
    config.title = 'Aurelia';
    config.addPipelineStep('authorize', AuthStep);
    config.map(routes);
    this.router = router;
  }

  @computedFrom('authService.authenticated')
  get isAuthenticated() {
    return this.authService.authenticated;
  }

  attached() {
    //prevent right click
    //document.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("keydown", (e) => {
      if (e.key === "F12") e.preventDefault();

      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
        e.preventDefault();
      }

      if (e.ctrlKey && e.key.toUpperCase() === "U") {
        e.preventDefault();
      }
    });

    history.pushState(null, "", location.href);
    window.addEventListener("popstate", function () {
        history.pushState(null, "", location.href);
    });

    this.initFirebaseFCM();
  }

  initFirebaseFCM() {
    if (!('serviceWorker' in navigator) || !('Notification' in window) ||
      typeof firebase.messaging !== 'function' ||
      typeof firebase.messaging.isSupported !== 'function' ||
      !firebase.messaging.isSupported()) {
      return;
    }

    const app = firebase.apps.length
      ? firebase.app()
      : firebase.initializeApp(firebaseMessagingConfig.firebaseConfig);
    this.messaging = firebase.messaging(app);

    this.serviceWorkerRegistrationPromise = navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        this.serviceWorkerRegistration = registration;
        this.messaging.onMessage((payload) => {
          window.dispatchEvent(new CustomEvent('fcm-message', { detail: payload }));
        });

        return registration;
      })
      .catch((error) => {
        console.error('Gagal menyiapkan Firebase Messaging:', error);
        return null;
      });
  }

}
