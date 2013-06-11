var configDev = require('./config.dev.js'),
    configProd = require('./config.prod.js');

if (process.env.NODE_ENV == 'development') {
    module.exports = configDev;
} else {
    module.exports = configProd;
}

