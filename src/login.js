import { Aurelia, inject } from 'aurelia-framework';
import { AuthService } from "aurelia-authentication";
import { Config } from "aurelia-api";
import '../styles/signin.css';
import JSEncrypt from 'jsencrypt';
import { PasswordValidator } from './utils/password-validator';
import firebase from './utils/firebase-messaging';
import firebaseMessagingConfig from './utils/firebase-config';

@inject(AuthService, Config)
export class Login {
    // username = "dev";
    // password = "Standar123";

    username="";
    password="";

    usernameError = "";
    passwordError = "";
    generalError = "";

    error = false;
    disabledButton = false;
    
    constructor(authService, config) {
        this.authService = authService;
        this.authEndpoint = config.getEndpoint('auth');
    }

    login() {
        this.error = false;

        this.usernameError = "";
        this.passwordError = "";
        this.generalError = "";

        if (!this.username) {
            this.usernameError = "Username wajib diisi";
        }

        if (!this.password) {
            this.passwordError = "Password wajib diisi";
        }

        if (this.usernameError || this.passwordError) {
            return;
        }

        this.disabledButton = true;
        const PUBLIC_KEY =`-----BEGIN PUBLIC KEY-----MIIBCgKCAQEAyUDO910BLcBrwdscKorajZKQJdR9TNnR/oqNcTpL10C4Ts9JQq4djGlcxdIG09rm23x5r54/eFmthu4lpeSBEPsS9O4ai0SF0mA39n5lvfNzWJ/JNBYswXU0S2BoTKdClbme+Z1hhqwksej+y2r+AzxiUay23Tn/AvIRxmPQg/66lD6zNyTWHOHAowhdOLUF8GagwdNOeCC0BZDdjP7Iyrk0d5XYeffMAcNR2vLTDpreMcjda7fGHbDTu8khsFTpFDwub0Pg96lxbFV9i//dZ7sPl+RpIrrLV9alCuDyz4+86Sl1jVqbwyh4j4XjgYck1CcmDg5cWN5iB9MnHJZaAQIDAQAB-----END PUBLIC KEY-----`;
        
        const credentials = {
            username: this.username,
            password: this.password,
            nonce: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        };

        const encryptor = new JSEncrypt.JSEncrypt();
        encryptor.setPublicKey(PUBLIC_KEY);
        const authEncrypted = encryptor.encrypt(JSON.stringify(credentials));
        const fcmTokenPromise = getCurrentFcmToken();
        //return this.authService.login({ "username": this.username, "password": this.password })
        return this.authService.login({ authEncrypted })
            .then(response => {
                console.log("success logged " + response);

                return fcmTokenPromise.then((token) => {
                    const body = { source: 'login' };
                    if (token) body.fcmToken = token;
                    return this.authEndpoint.update('me', null, body);
                }).catch((err) => {
                    console.error('Error updating FCM token on sign in:', err);
                });
            })
            .then(() => {
                this.statusMessage = PasswordValidator.validate(this.password);
                
                if (this.statusMessage) {
                    alert(this.statusMessage);
                    this.disabledButton = false;
                    window.location.href = `#/changepass?Username=${this.username}`;
                } else {
                    // location.reload();
                }
            })
            .catch(err => {
                this.error = true;
                this.disabledButton = false;

                const defaultMsg = "Username atau password salah";

                if (err && typeof err.json === 'function') {
                    return err.json()
                        .then(d => {
                            let msg = defaultMsg;
                            try {
                                if (d) msg = d.message || d.Message || d.error || JSON.stringify(d) || msg;
                            } catch (e) {
                            }
                            this.generalError = msg;
                        })
                        .catch(() => {
                            this.generalError = err.statusText || defaultMsg;
                        });
                }

                let msg = defaultMsg;
                try {
                    if (err) {
                        if (err.response && err.response.data) {
                            const d = err.response.data;
                            msg = d.message || d.Message || d.error || JSON.stringify(d) || msg;
                        } else if (err.data) {
                            const d = err.data;
                            msg = d.message || d.Message || d.error || JSON.stringify(d) || msg;
                        } else if (err.message) {
                            msg = err.message;
                        } else if (typeof err === 'string') {
                            msg = err;
                        } else if (err.statusText) {
                            msg = err.statusText;
                        }
                    }
                } catch (e) {}

                this.generalError = msg;
                
            });
    }

}

function getCurrentFcmToken() {
    if (window.isSecureContext === false ||
        !('serviceWorker' in navigator) || !('Notification' in window)) {
        return Promise.resolve(null);
    }

    try {
        if (typeof firebase.messaging !== 'function' ||
            typeof firebase.messaging.isSupported !== 'function' ||
            !firebase.messaging.isSupported()) {
            return Promise.resolve(null);
        }

        const permissionPromise = Notification.permission === 'default'
            ? Notification.requestPermission()
            : Promise.resolve(Notification.permission);

        return permissionPromise.then((permission) => {
            if (permission !== 'granted') {
                return null;
            }

            const app = firebase.apps.length
                ? firebase.app()
                : firebase.initializeApp(firebaseMessagingConfig.firebaseConfig);
            const messaging = firebase.messaging(app);

            return navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then((registration) => messaging.getToken({
                    vapidKey: firebaseMessagingConfig.vapidKey,
                    serviceWorkerRegistration: registration
                }))
                .then((token) => {
                    if (token) console.log('Token FCM:', token);
                    return token;
                });
        }).catch((error) => {
            console.error('Gagal mendapatkan token FCM saat login:', error);
            return null;
        });
    } catch (error) {
        console.error('Gagal menyiapkan token FCM saat login:', error);
        return Promise.resolve(null);
    }
}