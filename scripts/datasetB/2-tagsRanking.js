/* eslint-disable */
const fs = require('fs')
const readline = require('readline')
const utils = require('./utils')

// config
const appDir = process.env.PWD
const dataFile = 'AC2022_set1'

module.exports = (async () => {
    console.log('2 - Ranking tags in dataset1...')
    console.time('rankTags')
    await processLine()
    console.timeEnd('rankTags')
})()

async function processLine() {
    // read tags
    const rawTags = await utils.readFile(`${appDir}/data/csvs/final_tags_list.csv`)
    const tagsList = rawTags.split('\r\n')
    let top10TagsList = tagsList.map((i) => i.split(','))
    let bottom10TagsList = tagsList.map((i) => i.split(','))

    // read top and bottom 10 issuers
    const rawTop10List = await utils.readFile(`${appDir}/data/csvs/Top_10.csv`)
    const rawBottom10List = await utils.readFile(`${appDir}/data/csvs/Bottom_10.csv`)
    let top10List = rawTop10List.split('\n').map((i) => i.split(','))
    let bottom10List = rawBottom10List.split('\r\n').map((i) => i.split(','))

    let counter = 0
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
            let headline = parseData.headline
            let content = parseData.content
            // loop thru top issuers
            console.log('looping thru top 10% of issuers.')
            for await (const [i, item] of top10List.entries()) {
                if (i == 0 || !headline || !content) continue
                let hitFlag = false
                const issuer = item[1]
                if (headline.includes(issuer) || content.includes(issuer)) {
                    for await (const [j, item2] of top10TagsList.entries()) {
                        if (j == 0) continue
                        const tag = item2[0]
                        if (headline.includes(tag) || content.includes(tag)) {
                            // increment tag count
                            top10TagsList[j][1]++
                            top10List[i][6]++
                            // + 1 to total hit only
                            if (!hitFlag) {
                                top10List[i][7]++
                                hitFlag = true
                            }
                        }
                    }
                }
            }

            // loop thru bottom issuers
            console.log('looping thru bottom 10% of issuers.')
            for await (const [i, item] of bottom10List.entries()) {
                if (i == 0 || !headline || !content) continue
                let hitFlag = false
                const issuer = item[1]
                if (headline.includes(issuer) || content.includes(issuer)) {
                    for await (const [j, item2] of bottom10TagsList.entries()) {
                        if (j == 0) continue
                        const tag = item2[0]
                        if (headline.includes(tag) || content.includes(tag)) {
                            // increment tag count
                            bottom10TagsList[j][1]++
                            bottom10List[i][6]++
                            // + 1 to total hit only
                            if (!hitFlag) {
                                bottom10List[i][7]++
                                hitFlag = true
                            }
                        }
                    }
                }
            }

            counter++
            console.log('Counter ran: ', counter)
        }
        console.log('Reading file line by line with readline done.')
        const used = process.memoryUsage().heapUsed / 1024 / 1024
        console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`)
        let finalCsv = top10TagsList.join('\n')
        let finalCsv2 = bottom10TagsList.join('\n')
        let finalCsv3 = top10List.join('\n')
        let finalCsv4 = bottom10List.join('\n')
        await utils.writeFile(`${appDir}/results/csvs/top10TagsCount.csv`, finalCsv)
        await utils.writeFile(`${appDir}/results/csvs/bottom10TagsCount.csv`, finalCsv2)
        await utils.writeFile(`${appDir}/results/csvs/Top_10_index.csv`, finalCsv3)
        await utils.writeFile(`${appDir}/results/csvs/Bottom_10_index.csv`, finalCsv4)
        return 'done'
    } catch (err) {
        console.error('[rankTags Error]: ', err)
    }
}
