const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add the following to resolve firebase/firestore, firebase/auth, etc.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'firebase/firestore': require.resolve('firebase/firestore'),
  'firebase/auth': require.resolve('firebase/auth'),
  'firebase/storage': require.resolve('firebase/storage'),
};

module.exports = config;