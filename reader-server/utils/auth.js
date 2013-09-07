var config = require('../config/config.js');

function addBasicAuth(headersHash) {
    if (config.apiLocalUser && config.auth) {
        var pass = config.auth[config.apiLocalUser];
        if (pass != null) {
            var passEncoded = new Buffer(config.apiLocalUser + ":" + pass).toString('base64');
            headersHash['Authorization'] = 'Basic ' + passEncoded;

        } else{
            console.warn("No password found for user " + config.apiLocalUser);
        }
    }
}

exports.addBasicAuth = addBasicAuth;