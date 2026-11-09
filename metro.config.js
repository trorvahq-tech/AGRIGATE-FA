const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];
config.resolver.sourceExts.push("mjs");
if (!config.resolver.assetExts.includes("tflite")) {
    config.resolver.assetExts.push("tflite");
}

const finalConfig = withNativeWind(config, { input: "./global.css" });

const defaultResolveRequest = finalConfig.resolver.resolveRequest;
finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
    const currentPlatform = platform || context.platform;
    if (currentPlatform === 'web' && (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/'))) {
        return {
            filePath: path.resolve(__dirname, 'shims/react-native-maps.web.js'),
            type: 'sourceFile',
        };
    }
    return defaultResolveRequest
        ? defaultResolveRequest(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;

