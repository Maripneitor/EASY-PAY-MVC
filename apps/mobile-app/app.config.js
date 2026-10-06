export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    gradleCommand: ":app:assembleRelease",
  },
  hooks: {
    postPublish: [
      {
        file: "expo-router/plugin",
        config: {}
      }
    ]
  }
});
