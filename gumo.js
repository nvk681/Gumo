const fs = require('fs')
const path = require('path')

// Only used when config.json is missing (e.g. require('gumo') as a dependency).
// Anyone with config.json uses their file; configure() overrides these for everyone.
const defaultConfig = {
  url: '',
  crawler: path.join(__dirname, 'crawler', 'crawler.js'),
  headers: { Cookie: '' },
  saveOutputAsHtml: 'No',
  saveOutputAsJson: 'No',
  maxRequestsPerSecond: 5000,
  maxConcurrentRequests: 5000,
  whiteList: [],
  blackList: [],
  depth: 3,
  elastic: 'http://localhost:9200',
  neo4j: { url: 'neo4j://localhost', auth: { user: 'neo4j', password: 'gumo123' } },
  index: 'gumo'
}

let config
try {
  config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'))
  if (!config.crawler) config.crawler = defaultConfig.crawler
  else if (!path.isAbsolute(config.crawler)) config.crawler = path.join(process.cwd(), config.crawler)
} catch (_err) {
  config = { ...defaultConfig }
}
const Crawler = require(config.crawler)
const cheerio = require('cheerio')
const { Client: ElasticsearchClient } = require('@elastic/elasticsearch')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter()
const md5 = require('md5')
const sanitize = require('sanitize-filename')
const { isArray } = require('util')
let isConfigured = false


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

eventEmitter.on('readPage', async (msg) => {
    try {
        const resp = await elasticSearchClient.index({
            index: config.index,
            id: msg.hash,
            document: msg
        })
        console.log(resp)
    } catch (err) {
        console.log(err)
    }
})

function gumo() {

}

gumo.prototype.configure = function(params) {

    if (params && typeof params === 'object') {
        if (params.neo4j && typeof params.neo4j === 'object') {
            config.neo4j.url = (params.neo4j.url) ? params.neo4j.url : config.neo4j.url
            config.neo4j.auth.user = (params.neo4j.user) ? params.neo4j.user : config.neo4j.auth.user
            config.neo4j.auth.password = (params.neo4j.password) ? params.neo4j.password : config.neo4j.auth.password
        }
        if (params.elastic && typeof params.elastic === 'object') {
            config.elastic = (params.elastic.url) ? params.elastic.url : config.elastic
            config.index = (params.elastic.index) ? params.elastic.index : config.index
        }
        if (params.crawler && typeof params.crawler === 'object') {
            config.url = (params.crawler.url) ? params.crawler.url : config.url
            config.saveOutputAsHtml = (params.crawler.saveOutputAsHtml) ? params.crawler.saveOutputAsHtml : config.saveOutputAsHtml
            config.saveOutputAsJson = (params.crawler.saveOutputAsJson) ? params.crawler.saveOutputAsJson : config.saveOutputAsJson
            config.maxRequestsPerSecond = (params.crawler.maxRequestsPerSecond) ? params.crawler.maxRequestsPerSecond : config.maxRequestsPerSecond
            config.maxConcurrentRequests = (params.crawler.maxConcurrentRequests) ? params.crawler.maxConcurrentRequests : config.maxConcurrentRequests
            config.depth = (params.crawler.depth) ? params.crawler.depth : config.depth
            config.whiteList = (params.crawler.whiteList && isArray(params.crawler.whiteList)) ? params.crawler.whiteList : config.whiteList
            config.blackList = (params.crawler.blackList && isArray(params.crawler.blackList)) ? params.crawler.blackList : config.blackList
            config.headers.Cookie = (params.crawler.Cookie) ? params.crawler.Cookie : config.headers.Cookie
        }
    }

    const _graphHandler = require('./libs/graphHandler.js')(
        config,
        eventEmitter
    )

    elasticSearchClient = new ElasticsearchClient({
        node: config.elastic
    })

    // Create index for insertion in Elasticsearch (idempotent)
    elasticSearchClient.indices.create({ index: config.index })
        .then((resp) => console.log('create', resp))
        .catch((err) => console.log(err))
    isConfigured = true
}

gumo.prototype.insert = function() {
    if (!isConfigured) {
        throw "Gumo is not configured to execute the insert command.";
    }
    if (typeof config.url !== 'string' || config.url.length === 0) {
        throw "crawler.url cannot be empty."
    }
    new Crawler().configure(config)
        .crawl(config, function onSuccess(page) {
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