
module.exports = {
    serverPort: 8080,
    apiUrl: 'http://localhost:8080',
    apiLocalUrl: 'http://localhost:8080',
    apiLocalUser: 'lc',

    db: {
        database: 'reader',
        user: 'reader',
        pass: 'reader',
        host: '192.168.0.2',
        port: 5432
    },

    maxFeedsPerPoll: 20,
    pollerEnabled: false,

    mode: 'development',
    isDev: true,

    twitter: {
       key: '',
       secret: ''
    },

    articlesByRefresh: 1000
};