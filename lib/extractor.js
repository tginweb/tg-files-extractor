/* eslint-env node */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function extractFiles(sourceFile) {
    const content = fs.readFileSync(sourceFile, 'utf-8');
    const baseDir = process.cwd();
    let fileCount = 0;
    let dirCount = 0;

    // Регулярное выражение для поиска разделителей файлов
    const filePattern = /\/\* ==== (.*?) ==== \*\//g;

    let lastIndex = 0;
    let files = [];

    // Находим все разделители файлов
    while (true) {
        const match = filePattern.exec(content);
        if (!match) break;

        const [fullMatch, filePath] = match;
        const startPos = match.index + fullMatch.length;

        files.push({
            path: filePath.trim(),
            start: startPos
        });

        lastIndex = filePattern.lastIndex;
    }

    // Обрабатываем каждый файл
    files.forEach((file, index) => {
        const startPos = file.start;
        const endPos = index < files.length - 1
            ? files[index + 1].index - files[index + 1].path.length - 15
            : content.length;

        // Извлекаем содержимое файла
        let fileContent = content.slice(startPos, endPos);

        // Удаляем лишние пробелы в начале и конце
        fileContent = fileContent.replace(/^\s+|\s+$/g, '');

        // Формируем полный путь
        const fullPath = path.resolve(file.path);
        const dir = path.dirname(fullPath);

        // Создаем директории, если нужно
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            dirCount++;
            console.log(chalk.blue(`📁 Created directory: ${path.relative(baseDir, dir)}`));
        }

        // Записываем файл
        fs.writeFileSync(fullPath, fileContent);
        fileCount++;
        console.log(chalk.green(`📄 Created file: ${path.relative(baseDir, fullPath)}`));
    });

    return {
        fileCount,
        dirCount,
        baseDir
    };
}

module.exports = {
    extractFiles
};
