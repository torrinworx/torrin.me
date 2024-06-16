import express from 'express';
import path from 'path';
import webpack from 'webpack';
import { config } from 'dotenv';
// import apiRoutes from './ApiRoutes.js'; // make sure to add .js extension for the imported file

// In development, use Webpack and Webpack Dev Middleware
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpackConfig from '../webpack.config.js';

config();
const app = express();

// Handle JSON
app.use(express.json());

// Helper functions to replace __dirname and __filename
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Check node environment
if (process.env.NODE_ENV === 'production') {
  // In production, serve static files from the React app's build folder
  app.use(express.static(path.join(__dirname, '../build')));
  // The "catchall" handler: for any request that doesn't match one above,
  // send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
} else {

  const compiler = webpack(webpackConfig);

  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: webpackConfig.output.publicPath,
    })
  );

  app.use(webpackHotMiddleware(compiler));

  app.get('*', (req, res, next) => {
    const filename = path.join(compiler.outputPath, 'index.html');
    compiler.outputFileSystem.readFile(filename, (err, result) => {
      if (err) {
        return next(err);
      }
      res.set('content-type', 'text/html');
      res.send(result);
      res.end();
    });
  });
}

// Use API routes
// app.use('/api', apiRoutes);

const port = process.env.PORT || process.env.BACKEND_PORT || 5000;
app.listen(port, () => console.log(`Serving on port ${port}`));
