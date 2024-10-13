import path from 'path';
import { fileURLToPath } from 'url';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  const sharedConfig = (entryName, bundleName) => ({
    entry: entryName,
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    plugins:
      env && env.useBundleAnalyzer
        ? [
            new BundleAnalyzerPlugin({
              analyzerPort: 8000 + Math.round(Math.random() * 1000),
            }),
          ]
        : [],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    optimization: {
      minimize: !isDevelopment,
      splitChunks: {
        chunks: 'all',
        name: (module, chunks, cacheGroupKey) => {
          const allChunksNames = chunks.map((chunk) => chunk.name).join('~');
          return `${cacheGroupKey}-${allChunksNames}`;
        },
      },
    },
    output: {
      filename: (pathData) => {
        return pathData.chunk.name === 'main' ? bundleName : '[name].js';
      },
      path: path.resolve(__dirname, 'js'),
    },
  });

  const contentScriptConfig = sharedConfig(
    './ts/Chrome/ChromeContentScriptStarter.ts',
    'content-script.js',
  );

  const popupConfig = sharedConfig(
    './ts/Chrome/ChromePopupStarter.ts',
    'popup.js',
  );

  const backgroundPageConfig = sharedConfig(
    './ts/Chrome/ChromeBackgroundPageStarter.ts',
    'background-page.js',
  );

  const pageScriptConfig = sharedConfig(
    './ts/PageScript/PageScriptStarter.ts',
    'page-script.js',
  );

  const customEntries = globSync(path.resolve(__dirname, 'ts/Custom/*.ts'));
  const customConfigs = customEntries.map((customTsFile) =>
    sharedConfig(
      customTsFile,
      `custom/${path.basename(customTsFile, '.ts')}.js`,
    ),
  );

  return [
    contentScriptConfig,
    popupConfig,
    backgroundPageConfig,
    pageScriptConfig,
    ...customConfigs,
  ];
};
