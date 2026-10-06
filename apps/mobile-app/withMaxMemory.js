const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withMaxMemory(config) {
  return withGradleProperties(config, (config) => {
    // Limpiamos variables conflictivas
    config.modResults = config.modResults.filter(p => !['org.gradle.jvmargs', 'org.gradle.workers.max', 'org.gradle.parallel', 'org.gradle.vfs.watch'].includes(p.key));
    
    // 5GB para Java (El equilibrio perfecto)
    config.modResults.push({ type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx5g -XX:MaxMetaspaceSize=512m -XX:+UseG1GC' });
    
    // Estrangular la concurrencia: máximo 2 trabajadores
    config.modResults.push({ type: 'property', key: 'org.gradle.workers.max', value: '2' });
    
    // Apagar procesos paralelos y monitor de archivos para ahorrar RAM
    config.modResults.push({ type: 'property', key: 'org.gradle.parallel', value: 'false' });
    config.modResults.push({ type: 'property', key: 'org.gradle.vfs.watch', value: 'false' });
    
    return config;
  });
};
