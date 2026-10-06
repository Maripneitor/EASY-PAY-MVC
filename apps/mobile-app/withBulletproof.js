const { withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withBulletproof(config) {
  // Escudo contra Clases Duplicadas
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('pickFirst')) {
      config.modResults.contents = config.modResults.contents.replace(
        /android\s*\{/,
        "android {\n    packagingOptions {\n        pickFirst '**/*.so'\n        pickFirst 'META-INF/*'\n        pickFirst 'META-INF/INDEX.LIST'\n        pickFirst 'META-INF/DEPENDENCIES'\n    }\n"
      );
    }
    return config;
  });

  // Escudo contra Errores de ProGuard/R8
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardPath = path.join(config.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      fs.writeFileSync(proguardPath, '\n-ignorewarnings\n-dontwarn **\n', { flag: 'a' });
      return config;
    },
  ]);

  return config;
};
