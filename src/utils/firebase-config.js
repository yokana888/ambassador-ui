var firebaseMessagingConfig = {
    firebaseConfig: {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    },
    vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseMessagingConfig;
}

if (typeof self !== 'undefined') {
    self.firebaseMessagingConfig = firebaseMessagingConfig;
}