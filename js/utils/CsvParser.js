const fs = require('fs');
const path = require('path');

class CsvParser {
    static parseDarkestDungeonCSV(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`파일을 찾울 수 없습니다: ${filePath}`);
        }
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n').map(l => l.trim().replace(/\r/g, '')).filter(l => l.length > 0);

        const elements = [];
        let currentElement = null;

        for (let line of lines) {
            const parts = line.split(',');
            if (parts[0] === 'element_start') {
                currentElement = { id: parts[1], type: parts[2], data: {} };
            } else if (parts[0] === 'element_end') {
                if (currentElement) { 
                    elements.push(currentElement); 
                    currentElement = null; 
                }
            } else if (currentElement) {
                const key = parts[0];
                const values = parts.slice(1).filter(v => v !== '');
                currentElement.data[key] = values;
            }
        }
        return elements;
    }

    static saveCSVLines(filePath, lines) {
        fs.writeFileSync(filePath, lines.join('\n'));
    }

    static readCSVLines(filePath) {
        return fs.readFileSync(filePath, 'utf8').split('\n').map(l => l.trim().replace(/\r/g, ''));
    }
}

module.exports = CsvParser;
