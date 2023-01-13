/* eslint-disable */
const fs = require('fs')
const readline = require('readline')
const utils = require('../../utils')
const config = require('./config')
const fetch = require('node-fetch')
require('dotenv').config()

async function query(data, url) {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.HUGGING_FACE_KEY}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
    })
    const result = await response.json()
    return result
}

async function init() {
    const rawTags = await utils.readFile(`${process.env.PWD}/data/csvs/final_tags_list.csv`)
    const tagsList = rawTags.split('\r\n')
    const sentimentTable = await utils.readFile(`${process.env.PWD}/data/csvs/sentiment_table.csv`)
    const top3TagsCount = tagsList.map((i) => i.split(','))
    const bottom3TagsCount = tagsList.map((i) => i.split(','))

    // read top and bottom 3 issuers
    const rawTop3Table = await utils.readFile(`${process.env.PWD}/data/csvs/Top_3.csv`)
    const rawBottom3Table = await utils.readFile(`${process.env.PWD}/data/csvs/Bottom_3.csv`)
    const top3Table = rawTop3Table.split('\n').map((i) => i.split(','))
    const bottom3Table = rawBottom3Table.split('\r\n').map((i) => i.split(','))

    const top3IssuersList = await utils.readDir(`${process.env.PWD}/results/txts/top3`)
    const bottom3IssuersList = await utils.readDir(`${process.env.PWD}/results/txts/bottom3`)
    return [
        sentimentTable,
        top3TagsCount,
        bottom3TagsCount,
        top3Table,
        bottom3Table,
        top3IssuersList,
        bottom3IssuersList,
    ]
}

async function processLine() {
    console.time('tagsRanking')
    let [
        sentimentTable,
        top3TagsCount,
        bottom3TagsCount,
        top3Table,
        bottom3Table,
        top3IssuersList,
        bottom3IssuersList,
    ] = await init()
    console.log('[init] completed successfully.')

    for await (const [index, issuer] of top3IssuersList.entries()) {
        const txtFiles = await utils.readDir(`${process.env.PWD}/results/txts/top3/${issuer}`)
        let annualSentimentTable = sentimentTable.split('\n').map((i) => i.split(','))

        for await (const txtFile of txtFiles) {
            await runAnalysis('top3', index + 1, issuer, txtFile, top3Table, top3TagsCount, annualSentimentTable)
        }
        // write to issuer sentiment table
        let finalAnnualSentimentTable = annualSentimentTable.join('\n')
        await utils.writeFile(`${process.env.PWD}/results/csvs/${issuer}.csv`, finalAnnualSentimentTable)
    }
    console.log('[Top3Issuers] completed successfully.')

    for await (const [index, issuer] of bottom3IssuersList.entries()) {
        const txtFiles = await utils.readDir(`${process.env.PWD}/results/txts/bottom3/${issuer}`)
        let annualSentimentTable = sentimentTable.split('\n').map((i) => i.split(','))

        for await (const txtFile of txtFiles) {
            await runAnalysis(
                'bottom3',
                index + 1,
                issuer,
                txtFile,
                bottom3Table,
                bottom3TagsCount,
                annualSentimentTable
            )
        }
        // write to issuer sentiment table
        let finalAnnualSentimentTable = annualSentimentTable.join('\n')
        await utils.writeFile(`${process.env.PWD}/results/csvs/${issuer}.csv`, finalAnnualSentimentTable)
    }
    console.log('[Bottom3Issuers] completed successfully.')

    console.log('[processLine] completed successfully.')
    const used = process.memoryUsage().heapUsed / 1024 / 1024
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`)

    // Write results to csv file
    await writeAnalysis(top3TagsCount, bottom3TagsCount, top3Table, bottom3Table)
    console.log('[writeAnalysis] completed successfully.')
    console.timeEnd('tagsRanking')
}

async function writeAnalysis(top3TagsCount, bottom3TagsCount, top3Table, bottom3Table) {
    let finalCsv = top3TagsCount.join('\n')
    let finalCsv2 = bottom3TagsCount.join('\n')
    let finalCsv3 = top3Table.join('\n')
    let finalCsv4 = bottom3Table.join('\n')
    await utils.writeFile(`${process.env.PWD}/results/csvs/top3TagsCount.csv`, finalCsv)
    await utils.writeFile(`${process.env.PWD}/results/csvs/bottom3TagsCount.csv`, finalCsv2)
    await utils.writeFile(`${process.env.PWD}/results/csvs/Top_3_index.csv`, finalCsv3)
    await utils.writeFile(`${process.env.PWD}/results/csvs/Bottom_3_index.csv`, finalCsv4)
}

async function runAnalysis(category, index, issuer, fileName, issuerList, tagsList, annualSentimentTable) {
    try {
        // init store
        let lineCount = 0
        let leadershipText = ''
        let leadershipContent = []
        let flag = false
        let totalScores = {
            neutral: 0,
            negative: 0,
            positive: 0,
        }
        let currentYear = fileName.split('.')[0].substring(2)

        console.log(`Performing tags extraction for issuer code ${issuerList[index][0]} and annual report ${fileName}.`)

        // increment issuer total hits count
        issuerList[index][7]++

        const rl = readline.createInterface({
            input: fs.createReadStream(`${process.env.PWD}/results/txts/${category}/${issuer}/${fileName}`, {
                encoding: 'utf-8',
            }),
            crlfDelay: Infinity,
        })
        // Step 0. Loop thru each line of the txt file
        for await (const line of rl) {
            // [Tags Analysis]
            // Step 1a - Go thru txt file by line and sum sustainable tags found
            for await (const [j, item2] of tagsList.entries()) {
                // ignore csv header row
                if (j == 0) continue
                const tag = item2[0]
                if (line.includes(tag)) {
                    // increment total tag count
                    tagsList[j][1]++
                    // increment issuer total tag count
                    issuerList[index][6]++
                    // increment issuer year tag count
                    issuerList[index][config.csvToRowIndexMap[currentYear]]++
                }
            }

            // [Sentiment Analysis]
            // Step 1b. identify and extract chairman's statement content
            if (lineCount > 2000 || leadershipText.length >= 5000) flag = false
            for await (const leadershipTag of config.leadershipTags) {
                if (line.includes(leadershipTag) && lineCount > 200 && leadershipText.length == 0) flag = true
            }

            // Step 2. get summary from chairman's statement content
            if (flag) {
                // regex for matching chinese characters
                const pattern = /[\p{Unified_Ideograph}\u3006\u3007][\ufe00-\ufe0f\u{e0100}-\u{e01ef}]?/gmu
                const cleanedLine = line.replace(pattern, '').trim()
                if (!cleanedLine.includes('(cid:')) {
                    leadershipText = leadershipText.concat(cleanedLine)
                }
            }

            // Step 3. query text to get sentiment content
            // an arbitrary length of 5000 char is chosen to cover 4-5 pages of chairman/ management discussions
            if (leadershipText.length >= 5000 && flag) {
                console.log(`querying issuer code ${issuerList[index][0]} and annual report ${fileName}...`)
                leadershipContent = utils.sliceIntoChunks(leadershipText, 512)
                for await (const chunkedContent of leadershipContent) {
                    await query(
                        { inputs: chunkedContent, wait_for_model: true },
                        config.huggingFaceApis['sentimentEng']
                    ).then((response) => {
                        let res = response[0]
                        if (res.label == 'neutral') totalScores.neutral += res.score
                        if (res.label == 'negative') totalScores.negative += res.score
                        if (res.label == 'positive') totalScores.positive += res.score
                    })

                    let sleepTime = utils.getRandomInt(1, 3)
                    console.log(`Sleeping for ${sleepTime} sec...`)
                    await utils.sleepInMillisecs(sleepTime * 1000)
                }
            }

            // Complete line
            lineCount++
        }
        console.log(`Total Scores for ${issuerList[index][0]} and annual report ${fileName}}: `, totalScores)
        // update to year col
        annualSentimentTable[1][config.sentimentToColIndexMap[currentYear]] = totalScores.negative
        annualSentimentTable[2][config.sentimentToColIndexMap[currentYear]] = totalScores.neutral
        annualSentimentTable[3][config.sentimentToColIndexMap[currentYear]] = totalScores.positive
    } catch (err) {
        console.error(`[runAnalysis Error]: `, err)
    }
}

console.log('[Annual Reports Analysis] Ranking tags for Top and Bottom 3 total stock return % companies...')
processLine()
