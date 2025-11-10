module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // NativeWind for className-based styling
      'nativewind/babel',
      // Add module resolver plugin to handle import aliases
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            // Alias @ to src directory
            '@': './src',
            // Alias react-native Slider to @react-native-community/slider
            'react-native/Libraries/Components/Slider/Slider': '@react-native-community/slider',
          },
        },
      ],
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};