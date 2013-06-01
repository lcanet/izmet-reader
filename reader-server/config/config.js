var configDev = require('./config.dev.js'),
    configProd = require('./config.prod.js');

console.log("Environment: " + process.env.NODE_ENV);

if (process.env.NODE_ENV == 'production') {
    module.exports = configProd;
} else {
    module.exports = configDev;
}

