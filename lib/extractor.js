const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function extractFiles(sourceFile) {
    try {
        const content = fs.readFileSync(sourceFile, 'utf-8');
        const baseDir = process.cwd();
        let fileCount = 0;
        let dirCount = 0;

        // Разделяем содержимое файла по разделителям
        const sections = content.split(/(?:\/\* ==== (.*?) ==== \*\/)/);

        // Первый элемент - текст до первого разделителя (игнорируем)
        for (let i = 1; i < sections.length; i += 2) {
            const filePath = sections[i].trim();
            let fileContent = sections[i + 1] || '';

            // Удаляем лишние переносы строк в начале и конце
            fileContent = fileContent
                .replace(/^\s*\n/, '')
                .replace(/\n\s*$/, '');

            const fullPath = path.resolve(filePath);
            const dir = path.dirname(fullPath);

            // Создаем директорию при необходимости
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                dirCount++;
                console.log(chalk.blue(`📁 Created directory: ${path.relative(baseDir, dir)}`));
            }

            // Записываем файл
            fs.writeFileSync(fullPath, fileContent);
            fileCount++;
            console.log(chalk.green(`📄 Created file: ${path.relative(baseDir, fullPath)}`));
        }

        return {
            fileCount,
            dirCount,
            baseDir
        };
    } catch (error) {
        throw new Error(`Extraction failed: ${error.message}`);
    }
}

module.exports = {
    extractFiles
};
