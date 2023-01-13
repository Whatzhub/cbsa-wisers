const fs = require('fs')

const readFile = async function (path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (err, content) => {
            resolve(content)
        })
    })
}

const writeFile = async function (path, text) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, text, (err) => {
            if (err) reject(err)
            resolve()
        })
    })
}

// Get the file contents before the append operation
const appendFile = async function (path, text) {
    return new Promise((resolve, reject) => {
        fs.appendFile(path, text, (err) => {
            if (err) reject(err)
            resolve()
        })
    })
}

const readDir = async function (path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) reject(err)
            const filesArr = []
            files.forEach((file) => {
                filesArr.push(file)
            })
            resolve(filesArr)
        })
    })
}

const sleepInMillisecs = async function (delay) {
    return new Promise((resolve) => setTimeout(resolve, delay))
}

// The maximum is exclusive and the minimum is inclusive
const getRandomInt = function (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
}

const sliceIntoChunks = function (arrOrStr, chunkSize) {
    const arr = []
    for (let i = 0; i < arrOrStr.length; i += chunkSize) {
        arr.push(arrOrStr.slice(i, i + chunkSize))
    }
    return arr
}

module.exports = {
    readFile,
    writeFile,
    appendFile,
    readDir,
    sleepInMillisecs,
    getRandomInt,
    sliceIntoChunks,
}
