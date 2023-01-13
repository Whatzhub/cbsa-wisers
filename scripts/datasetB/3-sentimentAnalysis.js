/* eslint-disable */
const fs = require('fs')
const readline = require('readline')
const utils = require('../../utils')
const fetch = require('node-fetch')
require('dotenv').config()

// config
const appDir = process.env.PWD
const dataFile = 'AC2022_set1'

const csvHeaders = [
  'Stock_Code',
  'Issuer_Chi',
  'First_Trade_Board',
  'Total_Return_%',
  'CAGR_Total_Return_%',
  'CAGR_Relative_Return_%',
  'Tags_Count,Total_Hits',
  'Total_Positive_Sentiment',
  'Total_Negative_Sentiment',
  'Tag_Index\n',
]

module.exports = (async () => {
  console.log('3 - Sentiment Analysis in dataset1...')
  console.time('sentimentAnalysis')
  await processLine()
  console.timeEnd('sentimentAnalysis')
})()

async function query(data) {
  const response = await fetch('https://s4dqjpxo8p6nh80x.us-east-1.aws.endpoints.huggingface.cloud', {
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

async function runSentimentAnalysis(issuersList, rowIndex, issuer, content, counter) {
  if (issuersList[rowIndex][8] < 30) {
    leadershipContent = utils.sliceIntoChunks(content, 500)
    for await (const chunkedContent of leadershipContent) {
      try {
        // check sentiment on content hit
        await query({ inputs: chunkedContent }).then((response) => {
          console.log('HuggingFace API response: ', response)
          issuersList[rowIndex][8] += response[0].label == 'Positive' ? response[0].score : 1 - response[0].score
          issuersList[rowIndex][9] += response[0].label == 'Negative' ? response[0].score : 1 - response[0].score
        })
        let sleepTime = utils.getRandomInt(1, 3)
        console.log(`Sleeping for ${sleepTime} sec...`)
        await utils.sleepInMillisecs(sleepTime * 1000)
        counter.api++
        console.log(`Completed ${issuer} content query. Positive sentiment is ${issuersList[rowIndex][8]}. Negative sentiment is ${issuersList[rowIndex][9]}`)
        console.log(`apiCounter: ${counter.api}`)
      } catch (err) {
        console.log(`HuggingFace API ERROR: ${err}`)
      }
    }
  }
}

async function processLine() {
  // read top and bottom 10 issuers
  const rawTop10List = await utils.readFile(`${appDir}/data/csvs/Top_10.csv`)
  const rawBottom10List = await utils.readFile(`${appDir}/data/csvs/Bottom_10.csv`)
  let top10List = rawTop10List
    .split('\n')
    .map((i) => i.split(','))
    .filter((el, i) => i != 0)
    .map((i) => {
      return [i[0], i[1], i[2], i[3], i[4], i[5], +i[6], +i[7], +i[8], +i[9], +i[10]]
    })
  let bottom10List = rawBottom10List
    .split('\n')
    .map((i) => i.split(','))
    .filter((el, i) => i != 0)
    .map((i) => {
      return [i[0], i[1], i[2], i[3], i[4], i[5], +i[6], +i[7], +i[8], +i[9], +i[10]]
    })

  let counter = {
      line: 0,
      api: 0,
  }
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream(`${appDir}/data/jsons/${dataFile}.jsonl`, {
        encoding: 'utf-8',
      }),
      crlfDelay: Infinity,
    })
    // step 1 - Loop thru set1.jsonl by line and extract # tag names
    for await (const line of rl) {
      if (counter.line == 351440) break
      parseData = JSON.parse(line)
      let headline = parseData.headline
      let content = parseData.content
      // loop thru top issuers
      console.log('looping thru top 10% of issuers.')
      for await (const [i, item] of top10List.entries()) {
        if (!headline || !content) continue
        const issuer = item[1]
        if (headline.includes(issuer) || content.includes(issuer)) {
          console.log(`Found ${issuer} hit content.`)
          // proceed if issuer +ve sentiment score < 30
          await runSentimentAnalysis(top10List, i, issuer, content, counter)
        }
      }

      // loop thru bottom issuers
      console.log('looping thru bottom 10% of issuers.')
      for await (const [i, item] of bottom10List.entries()) {
        if (!headline || !content) continue
        const issuer = item[1]
        if (headline.includes(issuer) || content.includes(issuer)) {
          console.log(`Found ${issuer} hit content.`)
          // proceed if issuer +ve sentiment score < 30
          await runSentimentAnalysis(bottom10List, i, issuer, content, counter)
        }
      }
      counter.line++
      console.log('lineCounter: ', counter.line)
    }

    console.log('Reading file line by line with readline done.')
    const used = process.memoryUsage().heapUsed / 1024 / 1024
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`)
    let finalCsv3 = csvHeaders.join(',') + top10List.join('\n')
    let finalCsv4 = csvHeaders.join(',') + bottom10List.join('\n')

    await utils.writeFile(`${appDir}/results/csvs/Top_10_index.csv`, finalCsv3)
    await utils.writeFile(`${appDir}/results/csvs/Bottom_10_index.csv`, finalCsv4)
    return 'done'
  } catch (err) {
    console.error('[sentimentAnalysis Error]: ', err)
  }
}
