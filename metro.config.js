const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle the Slider import issue
config.resolver.alias = {
  // Alias react-native Slider to @react-native-community/slider
  'react-native/Libraries/Components/Slider/Slider': '@react-native-community/slider',
  // Also handle direct import from react-native
  'react-native/Slider': '@react-native-community/slider',
};

// Add extra node modules to ensure proper resolution
config.resolver.nodeModules = [
  ...(config.resolver.nodeModules || []),
  '@react-native-community/slider',
];

// Add custom resolver to handle module resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle the specific case of react-native-color-picker importing Slider
  if (moduleName === 'react-native/Libraries/Components/Slider/Slider' ||
      moduleName === 'react-native/Slider') {
    return context.resolveRequest(context, '@react-native-community/slider', platform);
  }
  
  // Default behavior for all other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;