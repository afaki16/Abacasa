// Expo config plugin (yalnızca Windows): Android native build'i daha yeni bir CMake'e yönlendirir.
//
// Neden: AGP varsayılanı CMake 3.22.1 (ninja 1.10) Windows'ta 260 karakter yol sınırını
// aşamıyor; reanimated/worklets/keyboard-controller'ın C++ obje yolları bu sınırı geçiyor
// ("ninja: error: mkdir(...): No such file or directory"). 3.31.x ile gelen ninja 1.12
// uzun yolları destekler. Kayıt defterinde LongPathsEnabled=1 de açık olmalı.
//
// Nasıl: android/local.properties'e `cmake.dir` yazar — sürüm belirtmeyen TÜM modüller
// (app + kütüphaneler) bu CMake'i kullanır. SDK'da yoksa uyarır ve dokunmaz:
//   sdkmanager "cmake;3.31.6"   (veya Android Studio → SDK Manager → SDK Tools → CMake)
// macOS/Linux'ta hiçbir şey yapmaz.

const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const CMAKE_VERSION = '3.31.6';

function findSdkDir() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
  ].filter(Boolean);
  return candidates.find((dir) => fs.existsSync(dir));
}

module.exports = function withAndroidCmakeVersion(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      if (process.platform !== 'win32') return cfg;

      const sdkDir = findSdkDir();
      const cmakeDir = sdkDir && path.join(sdkDir, 'cmake', CMAKE_VERSION);
      if (!cmakeDir || !fs.existsSync(cmakeDir)) {
        console.warn(
          `[withAndroidCmakeVersion] CMake ${CMAKE_VERSION} bulunamadı; uzun yol hatası alabilirsin. ` +
            `Kur: sdkmanager "cmake;${CMAKE_VERSION}"`,
        );
        return cfg;
      }

      const file = path.join(cfg.modRequest.platformProjectRoot, 'local.properties');
      const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      // .properties biçimi: ters bölü kaçırılır.
      const line = `cmake.dir=${cmakeDir.replace(/\\/g, '\\\\')}`;
      const lines = existing.split(/\r?\n/).filter((l) => l && !l.startsWith('cmake.dir='));
      fs.writeFileSync(file, [...lines, line].join('\n') + '\n');
      return cfg;
    },
  ]);
};
