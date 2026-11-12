const fs = require('fs/promises');
const path = require('path');

// const outputFilePath = path.join(__dirname, outputFilename);
// await fs.writeFile(outputFilePath, 'this is test output');
const INPUT_FILEPATH = path.join(__dirname, 'input.txt');
const HTML_FILEPATH = path.join(__dirname, 'dreamWorldPokemonTable.html');
const OUTPUT_FILEPATH = path.join(__dirname, 'output.txt');

async function getInputData() {
    try {
        return await fs.readFile(INPUT_FILEPATH, 'utf8');
    } catch (error) {
        console.error('Error getting input data:', error);
    }
}

async function getHTMLData() {
    try {
        return await fs.readFile(HTML_FILEPATH, 'utf8');
    } catch (error) {
        console.error('Error getting HTML data:', error);
    }
}

function stripHTMLTags(str) {
    return str.replace(/<[^>]*>/g, '').trim();
}

function getTitleAttributeFromSpanTag(str) {
    const match = str.match(/<span[^>]*title="([^"]*)"[^>]*>/);
    return match ? match[1] : '';
}

async function getPokeAPIData(pkmnName) {
    let name = pkmnName.toLowerCase();
    if (name.includes('nidoran')) {
        const trunc = name.substring(name.indexOf('nidoran')+6);
        if (trunc.includes('f') || trunc.includes('♀')) {
            name = 'nidoran-f';
        } else if (trunc.includes('m') || trunc === '♂') {
            name = 'nidoran-m';
        }
    } else if (name.includes('farfetch')) {
        name = 'farfetchd';
    } else if (name.includes('mr') && name.includes('mime')) {
        name = 'mr-mime';
    }
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`)
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        return response.json();
    } catch (error) {
        throw new Error(String(`Error while getting dex number for ${pkmnName}:`.concat(String(error))));
    }
}

async function getPokedexNumber(pkmnName) {
    const data = await getPokeAPIData(pkmnName);
    return data['pokedex_numbers'][0]['entry_number'];
}

async function parseString(inputString) {
    let data = new Array();
    const str = await inputString;
    const trs = str.split(/<\/tr>/);
    for (let i = 0; i < trs.length - 1; i++) {
        data.push(new Array(4).fill(''));
        const tr = trs[i].trim();
        const tds = tr.split(/<td>/);
        const pkmnName = stripHTMLTags(tds[2]);
        const pokedexNumber = String('#').concat(String(await getPokedexNumber(pkmnName)).padStart(3, '0'));
        data[i][0] = pokedexNumber;
        data[i][1] = pkmnName;
        for (let j = 3; j <= 4; j++) {
            data[i][j-1] = stripHTMLTags(tds[j]).trim();
        }
        data[i][4] = getTitleAttributeFromSpanTag(tds[5]);
    }
    return data;
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

async function writeToHTMLFile(outputString) {
    try {
        await fs.writeFile(HTML_FILEPATH, outputString);
    } catch (error) {
        console.error('Error writing to HTML file:', error);
    }
}

function findTag(htmlString, tagName, idStr) {
    const contentRegex = new RegExp(`<${tagName}[^>]*id="${idStr}"[^>]*>(.*)<\/${tagName}>`);
    if (!contentRegex.test(htmlString)) { throw new Error('Selector did not find a match.') };
    const contentMatch = htmlString.match(contentRegex);
    if (contentMatch.length !== 2) { throw new Error('Selector found more than one match. Make your regex more specific.') }
    const idxOfTag = htmlString.indexOf(contentMatch[0]);
    return {
        tag: {
            start: idxOfTag,
            end: idxOfTag + contentMatch[0].length - 1
        },
        content: {
            start: idxOfTag + contentMatch[0].indexOf('>') + 1,
            end: idxOfTag + contentMatch[0].substring(1).indexOf('<') + 1
        }
    };
}

function testDOMManip(htmlString, tagName, idStr, newStr) {
    const idxs = findTag(htmlString, tagName, idStr);
    writeToHTMLFile(
        htmlString.substring(0, idxs.content.start)
            .concat(newStr)
            .concat(htmlString.substring(idxs.content.end))
    );
}

/*getInputData()
    .then(input => parseString(input)
    .then(dataArr => formatOutputString(dataArr)
    .then(outputString => writeOutputFile(outputString))));*/
getHTMLData()
    .then(input => testDOMManip(input, 'caption', 'table-caption', 'Hello, World!'));