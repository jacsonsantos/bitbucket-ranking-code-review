// Entry point for the app

// // Express is the underlying web framework: https://expressjs.com
import express from 'express';

// https://expressjs.com/en/guide/using-middleware.html
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import morgan from 'morgan';

// atlassian-connect-express also provides a middleware
import ace from 'atlassian-connect-express';

// Use Handlebars as view engine:
// https://npmjs.org/package/express-hbs
// http://handlebarsjs.com
import hbs from 'express-hbs';

// We also need a few stock Node modules
import http from 'http';
import path from 'path';
import os from 'os';

// Routes live here; this is the C in MVC
import routes from './routes';

// Bootstrap Express and atlassian-connect-express
const app = express();
const addon = ace(app,{
    config: {
        descriptorTransformer: (descriptor, config) => {
            // make descriptor transformations here
            return descriptor;
        }
    }
});

// See config.json
const port = addon.config.port();
app.set('port', port);

// Static expiry middleware to help serve static resources efficiently
process.env.PWD = process.env.PWD || process.cwd(); // Fix expiry on Windows :(
import expiry from 'static-expiry';


// Configure Handlebars
const viewsDir = __dirname + '/views';
app.engine('hbs', hbs.express4({partialsDir: viewsDir}));
app.set('view engine', 'hbs');
app.set('views', viewsDir);

// Log requests, using an appropriate formatter by env
const devEnv = app.get('env') == 'development';
app.use(morgan(devEnv ? 'dev' : 'combined'));

// Include request parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// Gzip responses when appropriate
app.use(compression());

// Use api.bitbucket.org instead of the deprecated bitbucket.org/api
app.post('/installed', (req, res, next) => {
  req.body.baseUrl = req.body.baseApiUrl;
  next();
});

// Include atlassian-connect-express middleware
app.use(addon.middleware());

// Mount the static files directory
// Anything in ./public is served up as static content
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));
// Enable static resource fingerprinting for far future expires caching in production
app.use(expiry(app, {dir: staticDir, debug: devEnv}));
// Add an hbs helper to fingerprint static resource urls
hbs.registerHelper('furl', function(url){ return app.locals.furl(url); });
hbs.registerHelper('plusOne', function(number){ return number + 1; });
// Show nicer errors in dev mode
if (devEnv) app.use(errorHandler());

// Wire up routes
routes(app, addon);

// Boot the HTTP server
http.createServer(app).listen(port, () => {
  console.log('App server running at ' + addon.config.localBaseUrl());
});
