var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json'));
var Crawler = require(config.crawler);
var cheerio = require('cheerio');
var elasticsearch = require('elasticsearch');
const EventEmitter = require('events');
var eventEmitter = new EventEmitter();
var md5 = require('md5');

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
    // console.log(msg);
    console.log("Read the page boi");
});

var a = 1;
new Crawler().configure(config)
    .crawl(config.url, function onSuccess(page) {
        console.log(page.url);
        //console.log(page.content);

        var hir = page.url.replace(config.url, '');

        //un comment the below line to know the stripped string from url
        // console.log(hir);
        var $ = cheerio.load(page.content);
        var title = $('meta[name="title"]').attr('content');
        console.log(title);


        var intent = $('meta[name="intent"]').attr('content');
        if (typeof intent == 'undefined') {
            intent = 'navigate';
        }
        var des = $('meta[name="description"]').attr('content');
        var key = $('meta[name="key-words"]').attr('content');
        var intentseq = intent.split(" ");
        console.log(intent);

        var o = {}; // empty Object
        o[title] = [];

        o['des'] = [];
        o['des'].push({ 'description': des, 'keywords': key });
        var txt = $('body').text();
        // As there is the occurance of multiple '\n' in the output text I have replaced it with nothing but a space
        txt = replaceAll(txt, '\n', ' ');
        //This line of code replaces all the spaces that may be duplicated, it repaces multiple spaces with a single space so it will be more useful
        txt = txt.replace(/\s+/g, ' ').trim();
        var data = {
            'intent': intent,
            'text': txt
        };

        intentseq.forEach(function(item) {
            // console.log(item);
            var init_code = $('meta[name=' + item + ']').attr('content');
            o[title].push({ 'intent': item, 'init': init_code });


        });
        //console.log(o[title]);

        console.log(o['des']);


        if (page.url.indexOf(config.url) !== -1) {
            var obj = { 'title': title, 'link': hir, 'intent_pool': o[title], 'dump': txt, 'meta': o['des'] };
        } else {
            var site = hir.split(".")[1]
            var temp = hir.split(".")[2]
            if (temp != null)
                var uname = (temp.split("/")[1])
            var hash = md5(hir);
            var obj = { 'title': site + " " + uname, 'link': hir, 'meta': o['des'], 'hash':hash };
        }
        // o[title].push(data);
        // console.log(obj);
        //  console.log($('body').text());
        //console.log(body);
        client.index({
            index: config.index,
            type: 'pages',
            body: JSON.stringify(obj)
        }, function(err, resp, status) {
            console.log(resp);
        });

        fs.writeFile('output/html/' + title + '.html', hir + (page.content), function(err) {

            if (err) throw err;
            console.log('Saved html!');
        });


        fs.writeFile('output/json/' + title + '.json', JSON.stringify(obj), function(err) {

            if (err) throw err;
            console.log('Saved json!');
        });

        a = a + 1;

        //Throwing the event once page is read
        eventEmitter.emit('readPage', obj);
    });