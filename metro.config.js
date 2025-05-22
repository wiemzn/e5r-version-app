const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter l'extension '.cjs' si elle n'est pas déjà présente
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// Désactiver la résolution stricte des exports
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
