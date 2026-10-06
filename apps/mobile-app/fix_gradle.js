const fs = require('fs');

// 1. Forzar Gradle 8.8
fs.mkdirSync('android/gradle/wrapper', { recursive: true });
const wrapperContent = `distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-8.8-bin.zip`;
fs.writeFileSync('android/gradle/wrapper/gradle-wrapper.properties', wrapperContent);

// 2. Inyectar Kotlin/KSP en gradle.properties
const props = `\nexpo.kotlinVersion=2.0.20\nkspVersion=2.0.20-1.0.24\n`;
fs.appendFileSync('android/gradle.properties', props);

console.log('✅ Gradle forced to 8.8 and Kotlin config injected perfectly!');
