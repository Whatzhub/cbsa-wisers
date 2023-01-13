const csvToRowIndexMap = {
    2013: 11,
    2014: 12,
    2015: 13,
    2016: 14,
    2017: 15,
    2018: 16,
    2019: 17,
    2020: 18,
    2021: 19,
    2022: 20,
}

const sentimentToColIndexMap = {
    2013: 1,
    2014: 2,
    2015: 3,
    2016: 4,
    2017: 5,
    2018: 6,
    2019: 7,
    2020: 8,
    2021: 9,
    2022: 10,
}

const sentimentToRowIndexMap = {
    negative: 1,
    neutral: 2,
    positive: 3,
}

const leadershipTags = [
    'Chairman’s Letter',
    'Chairman’s Statement',
    'CHAIRMAN’S STATEMENT',
    'DEPUTY CHIEF EXECUTIVE OFFICER’S STATEMENT',
    'Executive Director’s Statement',
]

const huggingFaceApis = {
    summary: 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
    sentimentEng: 'https://eda603zndgakehv5.us-east-1.aws.endpoints.huggingface.cloud'
}

module.exports = {
    csvToRowIndexMap,
    sentimentToColIndexMap,
    sentimentToRowIndexMap,
    leadershipTags,
    huggingFaceApis,
}
