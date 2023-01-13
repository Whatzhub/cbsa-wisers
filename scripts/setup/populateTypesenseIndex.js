/* eslint-disable */
const Typesense = require('typesense');
const fs = require('fs');
const readline = require('readline');

// config
const appDir = process.env.PWD
const dataFile = 'AC2022_set1'

module.exports = (async () => {
  const typesense = new Typesense.Client({
    nodes: [
      {
        host: 'hg7vkrslzm6cty9bp-1.a1.typesense.net', // 'localhost'
        port: '443',
        protocol: 'https', // https in prod
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_KEY, // xyz for 'localhost'
    connectionTimeoutSeconds: 30
  });

  const schema = {
    name: 'dataset1',
    fields: [
      { name: 'docid', type: 'int64' },
      { name: 'non_view_engagements', type: 'int32' },
      { name: 'comment_count', type: 'int32' },
      { name: 'like_count', type: 'int32' },
      { name: 'dislike_count', type: 'int32' },
      { name: 'content', type: 'string', locale: 'zh' },
      { name: 'headline', type: 'string', locale: 'zh' },
      { name: 'author_name', type: 'string' },
      { name: 'pubname', type: 'string', facet: true },
      { name: 'pubtype', type: 'string', facet: true },
      { name: 'region', type: 'string', facet: true },
      //     // Only fields that need to be searched / filtered by need to be specified in the collection's schema
      //     // The documents you index can still contain other additional fields.
      //     //  These fields not mentioned in the schema, will be returned as is as part of the search results.
      //     // { name: 'image_url', type: 'string' },
    ],
    default_sorting_field: 'non_view_engagements',
  };

  console.log('Populating index in Typesense');

  try {
    await typesense.collections('dataset1').delete();
    console.log('Deleting existing collection: dataset1');
  } catch (error) {
    // Do nothing
  }

  console.log('Creating schema: ');
  console.log(JSON.stringify(schema, null, 2));
  await typesense.collections().create(schema);

  console.log('Importing records: ');
  console.time('import');
  await processLine(typesense);
  console.timeEnd('import');
})();

async function processLine(typesense) {
  let counter = 0;
  let jsonArr = []
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream(`${appDir}/data/jsons/${dataFile}.jsonl`, {
        encoding: 'utf-8',
      }),
      crlfDelay: Infinity,
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
      jsonArr.push(JSON.parse(line))
      // batch populate per 1000 lines
      if (counter % 1000 == 0 || counter == 351440) {
        try {
          console.log('Adding records: ', counter);
          const returnData = await typesense
            .collections('dataset1')
            .documents()
            .import(jsonArr);
          console.log('Done indexing: ', counter);
          if (returnData.success == false) {
            const failedItems = returnData.filter(
              (item) => item.success === false
            );
            if (failedItems.length > 0) {
              throw new Error(
                `Error indexing items ${JSON.stringify(failedItems, null, 2)}`
              );
            }
          }
          jsonArr.length = 0
        } catch (error) {
          console.log(error);
          jsonArr.length = 0
        }
      }
      counter++;
    }

    console.log('Reading file line by line with readline done.');
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`
    );
    return 'done';
  } catch (err) {
    console.error('[Typesense Populating Error]: ', err);
  }
}
