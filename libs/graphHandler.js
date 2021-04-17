const neo4j = require('neo4j-driver');

module.exports = async function(config, eventEmitter) {
    const creds = config.neo4j.auth;
    const driver = neo4j.driver(config.neo4j.uri, neo4j.auth.basic(creds.user, creds.password));

    createUniqueConstraint(driver);

    var eventCount = 0;

    eventEmitter.on("readPage", async msg => {
        console.log(`GraphDB new event(${++eventCount}) received: `, msg);

        const session = driver.session();

        try {
            await createNode(session, msg);
            await createNodesRelationship(session, msg);
        } catch (error) {
            console.log('GraphDB update exception occurred: ', error);
        } finally {
            await session.close();
        }
    });
};

var createNode = async function(session, data) {
    await session.writeTransaction(tx =>
        tx.run(
            'MERGE (:Page{pid: $hash, link: $link, parent: $parent, title: $title})', data
        )
    );
};

var createNodesRelationship = async function(session, data) {
    await session.writeTransaction(tx => {
        // create a relationship from parent page to current page and vice-versa
        tx.run(
            "MATCH (a:Page), (b:Page) WHERE b.link = $link AND a.link = $parent CREATE (a)-[r1:links_to]->(b), (b)-[r2:links_from]->(a)", data
        );
    });
};

var createUniqueConstraint = async function(driver) {
    const session = driver.session();
    try {
        await session.writeTransaction(tx => {
            // create a constraint to ensure uniqueness of a Page node
            tx.run(
                "CREATE CONSTRAINT ON (n:Page) ASSERT n.link IS UNIQUE"
            );
        });
    } catch (error) {
        console.log('GraphDB constraint exception occurred: ', error);
    } finally {
        await session.close();
    }
};