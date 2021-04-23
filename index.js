const gumo = require('./gumo.js')

let cron = new gumo()
cron.configure({
    'neo4j': {
        'url' : 'neo4j://localhost',
        'user' : 'neo4j',
        'password' : 'gumo123'
    }
});
cron.insert()