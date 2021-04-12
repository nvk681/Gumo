var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json'));
var Crawler = require(config.crawler);
var cheerio = require('cheerio');
var elasticsearch = require('elasticsearch');
const EventEmitter = require('events');
var eventEmitter = new EventEmitter();
var md5 = require('md5');
var sanitize = require("sanitize-filename");

// this function finds the every occurance of the 'find',in 'str' and replaces it with 'replace'
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}
var client = new elasticsearch.Client({
    hosts: [
        config.elastic
    ]
});

//this creates index for insertion in elasticsearch
client.indices.create({
    index: config.index
}, function(err, resp, status) {
    if (err) {
        console.log(err);
    } else {
        console.log("create", resp);
    }
});


config.shouldCrawlLinksFrom = function(url) {
    if (url.indexOf(config.url) !== -1) {
        return true
    } else {
        return false
    }
};

eventEmitter.on('readPage', (msg) => {

    client.index({
        id: msg.hash,
        index: config.index,
        type: 'pages',
        body: JSON.stringify(msg)
    }, function(err, resp, status) {
        console.log(resp);
    });

});

var a = 1;
new Crawler().configure(config)
    .crawl(config.url, function onSuccess(page) {

        var $ = cheerio.load(page.content);
        var title = $('meta[name="title"]').attr("content") || $("title").text();
        var des = $('meta[name="description"]').attr('content');
        var key = $('meta[name="key-words"]').attr('content');
        var ref = page.referer;


        var o = {}; // empty Object
        o[title] = [];

        o['des'] = [];
        o['des'].push({ 'description': des, 'keywords': key });
        var txt = $('body').text();
        // As there is the occurance of multiple '\n' in the output text I have replaced it with nothing but a space
        txt = replaceAll(txt, '\n', ' ');
        //This line of code replaces all the spaces that may be duplicated, it repaces multiple spaces with a single space so it will be more useful
        txt = txt.replace(/\s+/g, ' ').trim();

        const allowedHost = (new URL(config.url)).hostname;
        const currentHost = (new URL(page.url)).hostname;

        if (currentHost == allowedHost) {
            var hash = md5(page.url);

            var obj = { 'title': title, 'link': page.url, 'parent': ref, 'dump': txt, 'meta': o['des'], 'hash': hash };

            var fname = sanitize(title);
            fs.writeFile('output/html/' + fname + '.html', page.url + (page.content), function(err) {
                if (err) throw err;
            });


            fs.writeFile('output/json/' + fname + '.json', JSON.stringify(obj), function(err) {
                if (err) throw err;
            });

            a = a + 1;

            //Throwing the event once page is read
            eventEmitter.emit('readPage', obj);
        }
    });