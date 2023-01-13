/* eslint-disable */
const Typesense = require('typesense')
const fs = require('fs')
const readline = require('readline')
const utils = require('../../utils')
require('dotenv').config()

// config
const appDir = process.env.PWD
const dataFile = 'AC2022_set1'

async function searchByParams(qArr, typesense) {
    let searchRequests = {
        searches: [],
    }

    let commonSearchParams = {
        query_by: 'headline,content',
        limit_multi_searches: 50,
    }

    for await (const q of qArr) {
        searchRequests.searches.push({
            collection: 'dataset1',
            q: q,
            sort_by: 'non_view_engagements:desc',
        })
    }

    const hit = await typesense.multiSearch.perform(searchRequests, commonSearchParams)
    return hit
}

module.exports = (async () => {
    const typesense = new Typesense.Client({
        nodes: [
            {
                host: 'hg7vkrslzm6cty9bp-1.a1.typesense.net', // 'localhost' || 'hg7vkrslzm6cty9bp-1.a1.typesense.net'
                port: '443', // 443 || 8108
                protocol: 'https', // https in prod
            },
        ],
        apiKey: process.env.TYPESENSE_ADMIN_KEY, // xyz for 'localhost'
        connectionTimeoutSeconds: 30,
    })

    console.log('Querying keywords count in datasetB...')

    console.time('queriesCount')
    await processLine(typesense)
    console.timeEnd('queriesCount')
})()

async function processLine(typesense) {
    let counter = 0
    let keywordsSet = new Set()
    try {
        const rl = readline.createInterface({
            input: fs.createReadStream(`${appDir}/data/jsons/${dataFile}.jsonl`, {
                encoding: 'utf-8',
            }),
            crlfDelay: Infinity,
        })
        // step 1 - Loop thru set1.jsonl by line and extract # tag names
        for await (const line of rl) {
            if (counter == 351440) break
            parseData = JSON.parse(line)
            let splitStrArr = parseData.content.split('#')
            for await (const i of splitStrArr) {
                // Split by # => trim keywords & clean symbols => add to set
                const regex = /[`~!@#$%^&*()_|+\-=?;:“'’",，.】【（<>\{\}\[\]\\\/]/gi
                let tag = i.trim().replace(regex, '').split(' ')[0]
                if (tag.length <= 15 && tag.length > 1 && tag != '' && tag != '0' && !tag.includes('\n')) {
                    if (!keywordsSet.has(tag.toLowerCase())) {
                        keywordsSet.add(tag.toLowerCase())
                    }
                }
            }
            counter++
        }

        console.log('Reading file line by line with readline done.')
        const used = process.memoryUsage().heapUsed / 1024 / 1024
        console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`)
        await utils.writeFile(`${appDir}/data/csvs/keywords${counter}.json`, JSON.stringify([...keywordsSet]))

        // step 2 - Loop thru keyword array and query them
        const tags = await utils.readFile(`${appDir}/data/csvs/keywords${counter}.json`)
        const tagsInJson = JSON.parse(tags)
        const tagsInChunks = utils.sliceIntoChunks(tagsInJson, 50)
        console.log(91, tagsInChunks)
        let hitRecords = [['Tag', 'Count']]
        let hitCounter = 0
        for await (const tag of tagsInChunks) {
            const hitResults = await searchByParams(tag, typesense)
            // if numOfHits >= 120, store it
            for (const result of hitResults.results) {
                if (result.found >= 120) {
                    hitRecords.push([result.request_params.q, result.found])
                }
            }

            await utils.sleepInMillisecs(1000)
            console.log(`Completed 50 queries for batch ${hitCounter}`)
            hitCounter++
            let finalCsv = ' \n' + hitRecords.join('\n')
            await utils.appendFile(`${appDir}/results/csvs/queriesCount.csv`, finalCsv)
            hitRecords.length = 0
        }
        return 'done'
    } catch (err) {
        console.error('[queriesCount Error]: ', err)
    }
}