const gumo = require('./gumo.js')

let cron = new gumo()
cron.configure({
    'neo4j': {
        'url' : 'neo4j://localhost',
        'user' : 'neo4j',
        'password' : 'gumo123'
    },
    'elastic': {
        'url' : 'http://localhost:9200',
        'index' : 'myIndex'
    },
    'crawler': {
        'url': '',
        'saveOutputAsHtml': 'No',
        'saveOutputAsJson': 'No',
        'maxRequestsPerSecond': 500,
        'maxConcurrentRequests': 500,
        'depth': 2,
        'whiteList': [],
        'blackList': [],
    }
});
cron.insert()