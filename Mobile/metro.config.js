// Metro yapılandırması. Sentry'nin Expo sarmalayıcısı, varsayılan Expo yapılandırmasının
// üstüne kaynak haritaları için debug ID ekler (Sentry kapalıyken de zararsızdır).
// https://docs.expo.dev/guides/using-sentry/
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
