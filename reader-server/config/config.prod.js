
module.exports = {
    serverPort: 8080,
    apiUrl: 'http://reader.tekila.org',
    apiLocalUrl: 'http://localhost:8080',

    db: {
        database: 'reader',
        user: 'reader',
        pass: 'reader42',
        host: 'localhost',
        port: 5432
    },

    maxFeedsPerPoll: 10,
    pollerEnabled: true,


    mode: 'production',
    isDev: false,
    twitter: {
        key: '',
        secret: ''
    }


};