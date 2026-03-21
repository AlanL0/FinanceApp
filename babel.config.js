module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: ['babel-preset-expo'],
    plugins: isTest
      ? []
      : [
          ['module:react-native-dotenv', {
            moduleName: '@env',
            path: '.env',
            safe: false,
            allowUndefined: true,
          }],
        ],
  };
};
