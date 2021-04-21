# Gumo

"Gumo" (蜘蛛) is Japanese for "spider".

## Overview

A web-crawler (get it?) and scraper that extracts data from a family of nested dynamic webpages with added enhancements to assist in knowledge mining applications. Written in NodeJS.

## Table of Contents

- [Gumo](#gumo)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Configuration](#configuration)
  - [ElasticSearch](#elasticsearch)
  - [GraphDB](#graphdb)
    - [Nodes](#nodes)
    - [Relationships](#relationships)
  - [TODO](#todo)

## Features

- Crawl hyperlinks present on the pages of any domain and its subdomains.
- Scrape meta-tags and body text from every page.
- Store entire sitemap in a GraphDB (currently supports Neo4J).
- Store page content in ElasticSearch for easy full-text lookup.

## Installation

`npm install gumo`

## Usage

From code:

```js
const gumo = require('gumo')

let cron = new gumo()
cron.insert()
```

From CLI:

`node gumo`

## Configuration

The behavior of the crawler can be customized using `config.json`. The following are the attributes which can be configured:

| Attribute             | Type          | Accepted Values          | Description                                                                                | Default Value          | Default Behavior                                                         |
| :-------------------- | :------------ | :----------------------- | :----------------------------------------------------------------------------------------- | :--------------------- | :----------------------------------------------------------------------- |
| url                   | string        |                          | Base URL to start scanning from                                                            | "" (empty string)      | Module is disabled                                                       |
| crawler               | string        |                          | Relative path of the crawler library file                                                  | "./crawler/crawler.js" |                                                                          |
| headers               | object        |                          | Optional headers for websites that require auth information to be sent in headers          |                        |                                                                          |
| headers.Cookie        | string        |                          | Cookie string to be sent with each request                                                 | "" (empty string)      | Cookies will not be attached to the requests                             |
| saveOutputAsHtml      | string        | "Yes"/"No"               | Whether or not to store scraped content as HTML files in the output/html/ directory        | "No"                   | Saving output as HTML files is disabled                                  |
| saveOutputAsJson      | string        | "Yes"/"No"               | Whether or not to store scraped content as JSON files in the output/json/ directory        | "No"                   | Saving output as JSON files is disabled                                  |
| maxRequestsPerSecond  | int           | range: 1 to 5000 | The maximum number of requests to be sent to the target in one second                      | 5000                   |                                                                          |
| maxConcurrentRequests | int           | range: 1 to 5000  | The maximum number of concurrent connections to be created with the host at any given time | 5000                   |                                                                          |
| whiteList             | Array(string) |                          | If populated, only these URLs will be traversed                                            | [] (empty array)       | All URLs with the same hostname as the "url" attribute will be traversed |
| blackList             | Array(string) |                          | If populated, these URLs will ignored                                                      | [] (empty array)       |                                                                          |
| depth                 | int           | range: 1 to 999 | Depth up to which nested hyperlinks will be followed                                        | 3                      |                                                                          |
| elastic               | string        |                          | URI of the ElasticSearch instance to connect to                                            | "" (empty string)      | ElasticSearch support is disabled                                        |
| index                 | string        |                          | The name of the ElasticSearch index to store results in                                    | "gumo"                 |                                                                          |
| neo4j                 | object        |                          | Neo4J driver connection information                                                        | {} (empty object)      | GraphDB support is disabled                                              |
| neo4j.uri             | string        |                          | The URI of a running Neo4J instance (uses the Bolt driver to connect)                      | undefined              |                                                                          |
| neo4j.auth            | object        |                          | Authentication credentials for the Neo4J server                                            | undefined              |                                                                          |
| neo4j.auth.user       | string        |                          | Neo4J server username                                                                      | undefined              |                                                                          |
| neo4j.auth.password   | string        |                          | Neo4J server password                                                                      | undefined              |                                                                          |

## ElasticSearch

The content of the web page will be stored along with the url, and a hash. The index for the elastic search can be selected through config.json index attribute. If the index already exists in the elastic search it will be used, else it will create one.

**id**: hash,
**index**: config.index,
**type**: 'pages',
**body**: JSON.stringify(page content)

## GraphDB

The sitemap of all the traversed pages is stored in a convenient graph. The following structure of nodes and relationships is followed:

### Nodes

- **Label**: Page
- **Properties**:

| Property Name | Type   | Description                                                                                                  |
| :------------ | :----- | :----------------------------------------------------------------------------------------------------------- |
| pid           | String | UID generated by the crawler which can be used to uniquely identify a page across ElasticSearch and GraphDB |
| link          | String | URL of the current page                                                                                      |
| parent        | String | URL of the page from which the current page was accessed (typically only used while creating relationships)  |
| title         | String | Page title as it appears in the page header                                                                  |

### Relationships

| Name       | Direction                | Condition         |
| :--------- | :----------------------- | :---------------- |
| links_to   | (a)-[r1:links_to]->(b)   | b.link = a.parent |
| links_from | (b)-[r2:links_from]->(a) | b.link = a.parent |

## TODO
