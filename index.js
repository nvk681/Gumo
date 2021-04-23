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
        'url' : ''
    }
});
cron.insert()