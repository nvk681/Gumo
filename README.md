# 🕸️Gumo

*"Gumo" (蜘蛛) is Japanese for "spider".*

[![npm version](https://badge.fury.io/js/gumo.svg)](//npmjs.com/package/gumo) [![CI](https://github.com/nvk681/Gumo/actions/workflows/ci.yml/badge.svg)](https://github.com/nvk681/Gumo/actions/workflows/ci.yml) [![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://gumo.mit-license.org/)

## Overview 👓

A web-crawler (get it?) and scraper that extracts data from a family of nested dynamic webpages with added enhancements to assist in knowledge mining applications. Written in NodeJS.

## Table of Contents 📖

- [🕸️Gumo](#️gumo)
  - [Overview 👓](#overview-)
  - [Table of Contents 📖](#table-of-contents-)
  - [Features 🌟](#features-)
  - [Requirements 📋](#requirements-)
- [Installation 🏗️](#installation-️)
  - [Usage 👨‍💻](#usage-)
  - [Development 🛠️](#development-)
  - [Configuration ⚙️](#configuration-️)
  - [ElasticSearch ⚡](#elasticsearch-)
  - [GraphDB ☋](#graphdb-)
    - [Nodes](#nodes)
    - [Relationships](#relationships)
  - [Changelog](#changelog)
  - [TODO ☑️](#todo-️)

## Features 🌟

- Crawl hyperlinks present on the pages of any domain and its subdomains.
- Scrape meta-tags and body text from every page.
- Store entire sitemap in a GraphDB (currently supports Neo4J).
- Store page content in ElasticSearch for easy full-text lookup.

## Requirements 📋

- **Node.js** ≥ 24.0.0 (LTS). Pinned in `package.json` (`engines`) and `.nvmrc` for [nvm](https://github.com/nvm-sh/nvm) users.
- **Neo4j** 4.0+ when using the graph (constraint syntax requires it).

## Installation 🏗️

[![NPM](https://nodei.co/npm/gumo.png?mini=true)](https://nodei.co/npm/gumo/)

1. Use Node 24+ (e.g. `nvm use` if you have [nvm](https://github.com/nvm-sh/nvm) and the repo’s `.nvmrc`).
2. Install dependencies (uses `package-lock.json` for reproducible installs):

   ```bash
   npm install
   ```
   Or in CI: `npm ci`.

## Usage 👨‍💻

From code:

```js
// 1: import the module
const gumo = require('gumo')

// 2: instantiate the crawler
let cron = new gumo()

// 3: call the configure method and pass the configuration options
cron.configure({
    'neo4j': { // replace with your details or remove if not required
        'url' : 'neo4j://localhost',
        'user' : 'neo4j',
        'password' : 'gumo123'
    },
    'elastic': { // replace with your details or remove if not required
        'url' : 'http://localhost:9200',
        'index' : 'myIndex'
    },
    'crawler': {
        'url': 'https://www.example.com',
    }
});

// 4: start crawling
cron.insert()
```

**Note:** The config params passed to `cron.configure` above are the default values. See [Configuration](#configuration-️) for all options.

When using Gumo as a dependency (e.g. `require('gumo')` with no `config.json` in your project), in-package defaults are used so the module loads; pass your Elasticsearch, Neo4j, and crawler settings via `configure()` before calling `insert()`.

### Development 🛠️

| Script   | Description                          |
| -------- | ------------------------------------ |
| `npm run dev` | Run the crawler (`node index.js`).   |
| `npm run lint` | Run [ESLint](https://eslint.org/) on the project (see `eslint.config.js`). |
| `npm test`    | Run tests (placeholder until tests are added). |

CI runs on [GitHub Actions](https://github.com/nvk681/Gumo/actions) (Node 24, lint + test) on push/PR to `main`/`master`.

## Configuration ⚙️

The behavior of the crawler can be customized by passing a custom configuration object to the `config()` method. The following are the attributes which can be configured:

| Attribute ( * - Mandatory )                    | Type          | Accepted Values  | Description                                                                                | Default Value           | Default Behavior                                                         |
| :---------------------------- | :------------ | :--------------- | :----------------------------------------------------------------------------------------- | :---------------------- | :----------------------------------------------------------------------- |
| * crawler.url                   | string        |                  | Base URL to start scanning from                                                            | "" (empty string)       | Module is disabled                                                       |                                                                          |
| crawler.Cookie                | string        |                  | Cookie string to be sent with each request (useful for pages that require auth)            | "" (empty string)       | Cookies will not be attached to the requests                             |
| crawler.saveOutputAsHtml      | string        | "Yes"/"No"       | Whether or not to store scraped content as HTML files in the output/html/ directory        | "No"                    | Saving output as HTML files is disabled                                  |
| crawler.saveOutputAsJson      | string        | "Yes"/"No"       | Whether or not to store scraped content as JSON files in the output/json/ directory        | "No"                    | Saving output as JSON files is disabled                                  |
| crawler.maxRequestsPerSecond  | int           | range: 1 to 5000 | The maximum number of requests to be sent to the target in one second                      | 5000                    |                                                                          |
| crawler.maxConcurrentRequests | int           | range: 1 to 5000 | The maximum number of concurrent connections to be created with the host at any given time | 5000                    |                                                                          |
| crawler.whiteList             | Array(string) |                  | If populated, only these URLs will be traversed                                            | [] (empty array)        | All URLs with the same hostname as the "url" attribute will be traversed |
| crawler.blackList             | Array(string) |                  | If populated, these URLs will ignored                                                      | [] (empty array)        |                                                                          |
| crawler.depth                 | int           | range: 1 to 999  | Depth up to which nested hyperlinks will be followed                                       | 3                       |                                                                          |
| * elastic.url                   | string        |                  | URI of the ElasticSearch instance to connect to                                            | "http://localhost:9200" |                                                                          |
| * elastic.index                 | string        |                  | The name of the ElasticSearch index to store results in                                    | "myIndex"               |                                                                          |
| * neo4j.url                     | string        |                  | The URI of a running Neo4J instance (uses the Bolt driver to connect)                      | "neo4j://localhost"     |                                                                          |
| * neo4j.user                    | string        |                  | Neo4J server username                                                                      | "neo4j"                 |                                                                          |
| * neo4j.password                | string        |                  | Neo4J server password                                                                      | "gumo123"               |                                                                          |

## ElasticSearch ⚡

Page content is stored with the URL and a hash. The index is set via the `elastic.index` config (or `config.json`). If the index does not exist, it is created. Gumo uses the official `@elastic/elasticsearch` client; each page is indexed with **id** = hash and **document** = the page object (no separate type field).

## GraphDB ☋

The sitemap of all the traversed pages is stored in a convenient graph. The following structure of nodes and relationships is followed:

### Nodes

- **Label**: Page
- **Properties**:

| Property Name | Type   | Description                                                                                                 |
| :------------ | :----- | :---------------------------------------------------------------------------------------------------------- |
| pid           | String | UID generated by the crawler which can be used to uniquely identify a page across ElasticSearch and GraphDB |
| link          | String | URL of the current page                                                                                     |
| parent        | String | URL of the page from which the current page was accessed (typically only used while creating relationships) |
| title         | String | Page title as it appears in the page header                                                                 |

### Relationships

| Name       | Direction                | Condition         |
| :--------- | :----------------------- | :---------------- |
| links_to   | (a)-[r1:links_to]->(b)   | b.link = a.parent |
| links_from | (b)-[r2:links_from]->(a) | b.link = a.parent |

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and upgrading notes (e.g. Node 24, Elasticsearch client, Neo4j driver in v2.0.0).

## TODO ☑️

- [ ] Make it executable from CLI
- [x] Enable to send config parameters while invoking the gumo
- [x] CI (GitHub Actions, Node 24, lint + test)
- [ ] Write more tests
