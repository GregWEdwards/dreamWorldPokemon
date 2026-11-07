const fs = require('fs/promises');
const path = require('path');
     
// const outputFilePath = path.join(__dirname, outputFilename);
// await fs.writeFile(outputFilePath, 'this is test output');
const INPUT_FILEPATH = path.join(__dirname, 'input.txt');
const OUTPUT_FILEPATH = path.join(__dirname, 'output.txt');

async function getInputData() {
    try {
        return await fs.readFile(INPUT_FILEPATH, 'utf8');
    } catch (error) {
        console.error('Error getting data:', error);
    }
}

function stripHTMLTags(str) {
    return str.replace(/<[^>]*>/g, '');
}

function getTitleAttributeFromSpanTag(str) {
    const match = str.match(/<span[^>]*title="([^"]*)"[^>]*>/);
    return match ? match[1] : '';
}

async function parseString(inputString) {
    let data = new Array();
    const str = await inputString;
    const trs = str.split(/<\/tr>/);
    for (let i = 0; i < trs.length - 1; i++) {
        data.push(new Array(4).fill(''));
        const tr = trs[i].trim();
        const tds = tr.split(/<td>/);
        for (let j = 2; j < 6; j++) {
            const td = tds[j];
            let tdContent = stripHTMLTags(td).trim();
            if (j === 5) {
                tdContent = getTitleAttributeFromSpanTag(td);
            }
            // console.log(`Row ${i+1}, Column ${j-1}:`, tdContent);
            data[i][j-2] = tdContent;
        }
        // console.log(`data.length`,data.length);
    }
    return data;
}

async function printFive(arr) {
    const dataArr = await arr;
    for (let i=0; i<5; i++) {
        console.log(dataArr[i]);
    }
}

async function formatOutputString(arr) {
    const dataArr = await arr;
    let outputString = '';
    for (let i = 0; i < dataArr.length; i++) {
        const row = dataArr[i].map((cell, idx) => `\t<td id="cell-${i}-${idx}">` + cell + '</td>');
        outputString += `<tr id="row-${i}">\n` + row.join('\n') + '\n' + '</tr>\n';
    }
    return outputString;
}

async function writeOutputFile(outputString) {
    try {
        await fs.writeFile(OUTPUT_FILEPATH, outputString);
    } catch (error) {
        console.error('Error writing output file:', error);
    }
}

getInputData()
    .then(input => parseString(input)
    .then(dataArr => formatOutputString(dataArr)
    .then(outputString => writeOutputFile(outputString))));