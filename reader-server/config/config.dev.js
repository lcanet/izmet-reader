
module.exports = {
    serverPort: 8080,
    apiUrl: 'http://localhost:8080',
    apiLocalUrl: 'http://localhost:8080',
    pgUrl: 'postgres://reader:reader@192.168.0.2/reader',
    database: 'reader',
    dbUser: 'reader',
    dbPass: 'reader',
    dbHost: '192.168.0.2',
    dbPort: 5432,

    maxFeedsPerPoll: 10,
    pollerEnabled: false,

    mode: 'development',
    isDev: true,

    twitter: {
        key: '',
        secret: ''
    }
};