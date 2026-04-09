const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const rootModules = path.resolve(workspaceRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  rootModules,
];

// The `firebase` umbrella package does not have a `react-native` export condition
// for firebase/auth, firebase/app, etc. Metro falls through to the `default`
// (browser ESM) builds. Meanwhile @firebase/auth uses its own `react-native`
// field. This creates two separate ComponentContainer instances → auth component
// registered in one, app created in another → "Component auth has not been
// registered yet".
//
// Fix: redirect firebase/* imports to the @firebase/* React Native / CJS builds,
// and force @firebase/component to always use CJS (same single registry).
const firebaseRedirects = {
  'firebase/app': path.resolve(rootModules, '@firebase/app/dist/index.cjs.js'),
  'firebase/auth': path.resolve(rootModules, '@firebase/auth/dist/rn/index.js'),
  'firebase/firestore': path.resolve(rootModules, '@firebase/firestore/dist/index.rn.js'),
  'firebase/storage': path.resolve(rootModules, '@firebase/storage/dist/index.node.js'),
  '@firebase/app': path.resolve(rootModules, '@firebase/app/dist/index.cjs.js'),
  '@firebase/component': path.resolve(rootModules, '@firebase/component/dist/index.cjs.js'),
  '@firebase/logger': path.resolve(rootModules, '@firebase/logger/dist/index.cjs.js'),
  '@firebase/util': path.resolve(rootModules, '@firebase/util/dist/index.cjs.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (firebaseRedirects[moduleName]) {
    return { filePath: firebaseRedirects[moduleName], type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
