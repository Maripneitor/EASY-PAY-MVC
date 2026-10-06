const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  '@easy-pay/domain': path.resolve(workspaceRoot, 'packages/domain'),
  '@easy-pay/ui': path.resolve(workspaceRoot, 'packages/ui'),
};

module.exports = withNativeWind(config, {
  input: path.resolve(projectRoot, 'global.css'),
  projectRoot,
});
