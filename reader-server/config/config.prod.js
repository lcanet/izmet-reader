
module.exports = {
    serverPort: 8080,
    apiUrl: 'http://reader.tekila.org',
    apiLocalUrl: 'http://localhost:8080',
    pgUrl: 'postgres://reader:reader42@localhost/reader',

    maxFeedsPerPoll: 10,
    pollerEnabled: true,


    mode: 'production',
    isDev: false,
    twitter: {
        key: '',
        secret: ''
    }


};