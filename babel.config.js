module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // NativeWind plugin MUST come first for proper transformation
      'nativewind/babel',
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};