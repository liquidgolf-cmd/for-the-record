importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyCtMBMQkCuBLQa3mSp0ozsUw6xB2qxH6bk",
  authDomain:        "for-the-record-64573.firebaseapp.com",
  projectId:         "for-the-record-64573",
  storageBucket:     "for-the-record-64573.firebasestorage.app",
  messagingSenderId: "32558805197",
  appId:             "1:32558805197:web:8903b611de0329e59b7984",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  if (title) {
    self.registration.showNotification(title, { body: body ?? "" });
  }
});
