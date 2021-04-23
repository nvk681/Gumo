const fs = require('fs')
const config = JSON.parse(fs.readFileSync('config.json'))
const Crawler = require(config.crawler)
const cheerio = require('cheerio')
const elasticsearch = require('elasticsearch')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter()
const md5 = require('md5')
const sanitize = require('sanitize-filename')


// this function finds the every occurrence of the 'find',in 'str' and replaces it with 'replace'
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace)
}

let elasticSearchClient = null;

config.shouldCrawlLinksFrom = function(url) {
    if (url.indexOf(config.url) !== -1) {
        return true
    } else {
        return false
    }
}

eventEmitter.on('readPage', (msg) => {
    elasticSearchClient.index({
        id: msg.hash,
        index: config.index,
        type: 'pages',
        body: JSON.stringify(msg)
    }, function(err, resp, status) {
        console.log(resp)
    })
})

function gumo() {

}

gumo.prototype.configure = function(params) {

    if(params && typeof params === 'object'){
        if(params.neo4j && typeof params.neo4j === 'object'){
            config.neo4j.url = (params.neo4j.url)? params.neo4j.url : config.neo4j.url
            config.neo4j.auth.user = (params.neo4j.user)? params.neo4j.user : config.neo4j.auth.user
            config.neo4j.auth.password = (params.neo4j.password)? params.neo4j.password : config.neo4j.auth.password
        }
        if(params.elastic && typeof params.elastic === 'object'){
            config.elastic = (params.elastic.url)? params.elastic.url : config.elastic
            config.index = (params.elastic.index)? params.elastic.index : config.index
        }
    }
    
    const graphHandler = require('./libs/graphHandler.js')(
        config,
        eventEmitter
    )

    elasticSearchClient = new elasticsearch.Client({
        hosts: [
            config.elastic
        ]
    })

    // this creates index for insertion in elasticsearch

    elasticSearchClient.indices.create({
        index: config.index
    }, function(err, resp, status) {
        if (err) {
            console.log(err)
        } else {
            console.log('create', resp)
        }
    })
}

gumo.prototype.insert = function() {
    new Crawler().configure(config)
        .crawl(config.url, function onSuccess(page) {
            const $ = cheerio.load(page.content)
            const title = $('meta[name="title"]').attr('content') || $('title').text()
            const des = $('meta[name="description"]').attr('content')
            const key = $('meta[name="key-words"]').attr('content')
            const ref = page.referer
            const o = {} // empty Object
            o[title] = []

            o.des = []
            o.des.push({ description: des, keywords: key })
            let txt = $('body').text()
                // As there is the occurrence of multiple '\n' in the output text I have replaced it with nothing but a space
            txt = replaceAll(txt, '\n', ' ')
                // This line of code replaces all the spaces that may be duplicated, it replaces multiple spaces with a single space so it will be more useful
            txt = txt.replace(/\s+/g, ' ').trim()

            const allowedHost = (new URL(config.url)).hostname
            const currentHost = (new URL(page.url)).hostname

            if (currentHost === allowedHost) {
                const hash = md5(page.url)
                const obj = { title: title, link: page.url, parent: ref, dump: txt, meta: o.des, hash: hash }
                const fname = sanitize(title)
                if (config.saveOutputAsHtml === 'Yes') {
                    fs.writeFile('output/html/' + fname + '.html', page.url + (page.content), function(err) {
                        if (err) throw err
                    })
                }
                if (config.saveOutputAsJson === 'Yes') {
                    fs.writeFile('output/json/' + fname + '.json', JSON.stringify(obj), function(err) {
                        if (err) throw err
                    })
                }
                // Throwing the event once page is read
                eventEmitter.emit('readPage', obj)
            }
        })
}


module.exports = gumo