const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Кэш для хранения предыдущих версий файлов
const fileCache = new Map();

function extractFiles(sourceFile, outputDir = null) {
    try {
        const content = fs.readFileSync(sourceFile, 'utf-8');
        let fileCount = 0;
        let dirCount = 0;

        // Разделяем содержимое файла по разделителям
        const sections = content.split(/(?:\/\* ==== (.*?) ==== \*\/)/);

        for (let i = 1; i < sections.length; i += 2) {
            const filePath = sections[i].trim();
            let fileContent = sections[i + 1] || '';

            // Удаляем лишние переносы строк
            fileContent = fileContent
                .replace(/^\s*\n/, '')
                .replace(/\n\s*$/, '');

            // Формируем полный путь
            const fullPath = outputDir
                ? path.resolve(outputDir, filePath)
                : path.resolve(filePath);

            // Обработка неизмененных блоков
            fileContent = processUnchangedBlocks(fileContent, fullPath);

            const dir = path.dirname(fullPath);

            // Создаем директорию при необходимости
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                dirCount++;
                console.log(chalk.blue(`📁 Created directory: ${path.relative(process.cwd(), dir)}`));
            }

            // Записываем файл
            fs.writeFileSync(fullPath, fileContent);
            fileCache.set(fullPath, fileContent);  // Кэшируем новую версию
            fileCount++;
            console.log(chalk.green(`📄 Created file: ${path.relative(process.cwd(), fullPath)}`));
        }

        return {
            fileCount,
            dirCount
        };
    } catch (error) {
        throw new Error(`Extraction from ${sourceFile} failed: ${error.message}`);
    }
}

function processUnchangedBlocks(content, filePath) {
    // Регулярка для поиска блоков "без изменений"
    const unchangedRegex = /\/\/ \.\.\. NOT-CHANGED: (.+?) \.\.\./g;

    let newContent = content;
    let match;

    while ((match = unchangedRegex.exec(content)) !== null) {
        const [fullMatch, reference] = match;
        const referenceType = detectReferenceType(reference);

        let originalContent = '';

        try {
            if (referenceType === 'line-range') {
                originalContent = extractByLineRange(filePath, reference);
            } else if (referenceType === 'regex') {
                originalContent = extractByRegex(filePath, reference);
            } else if (referenceType === 'context') {
                originalContent = extractByContext(filePath, reference);
            }
        } catch (e) {
            console.error(chalk.yellow(`⚠️ Reference error in ${filePath}: ${e.message}`));
            originalContent = `/* ERROR: Failed to restore content - ${e.message} */`;
        }

        newContent = newContent.replace(fullMatch, originalContent);
    }

    return newContent;
}

function detectReferenceType(reference) {
    if (/^\d+-\d+$/.test(reference)) return 'line-range';
    if (/^\/.+\/$/.test(reference)) return 'regex';
    return 'context';
}

function extractByLineRange(filePath, range) {
    const [start, end] = range.split('-').map(Number);
    const lines = getFileLines(filePath);

    if (isNaN(start) || isNaN(end) || start < 1 || end > lines.length || start > end) {
        throw new Error(`Invalid line range: ${range}`);
    }

    return lines.slice(start - 1, end).join('\n');
}

function extractByRegex(filePath, pattern) {
    const regex = new RegExp(pattern.slice(1, -1));
    const content = getFileContent(filePath);
    const match = content.match(regex);

    if (!match) {
        throw new Error(`Pattern not found: ${pattern}`);
    }

    return match[0];
}

function extractByContext(filePath, context) {
    const lines = getFileLines(filePath);
    const contextLines = context.split('~~');

    let startIndex = -1;
    let endIndex = -1;

    // Поиск начального контекста
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(contextLines[0])) {
            startIndex = i;
            break;
        }
    }

    // Поиск конечного контекста
    if (contextLines.length > 1) {
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (lines[i].includes(contextLines[1])) {
                endIndex = i + 1;
                break;
            }
        }
    }

    if (startIndex === -1) {
        throw new Error(`Start context not found: ${contextLines[0]}`);
    }

    if (contextLines.length > 1 && endIndex === -1) {
        throw new Error(`End context not found: ${contextLines[1]}`);
    }

    return lines.slice(
        startIndex,
        endIndex === -1 ? startIndex + 1 : endIndex
    ).join('\n');
}

function getFileContent(filePath) {
    // Сначала проверяем кэш
    if (fileCache.has(filePath)) {
        return fileCache.get(filePath);
    }

    // Затем проверяем файловую систему
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }

    throw new Error(`File not found: ${filePath}`);
}

function getFileLines(filePath) {
    return getFileContent(filePath).split('\n');
}

function processPaths(paths, options = {}) {
    let filesProcessed = 0;
    let filesExtracted = 0;
    let dirsCreated = 0;
    const processedFiles = new Set();

    function processFile(filePath) {
        if (processedFiles.has(filePath)) return;
        processedFiles.add(filePath);

        try {
            const result = extractFiles(filePath, options.outputDir);
            filesProcessed++;
            filesExtracted += result.fileCount;
            dirsCreated += result.dirCount;
        } catch (error) {
            console.error(chalk.red(`❌ ${error.message}`));
        }
    }

    function exploreDirectory(dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                if (options.recursive) exploreDirectory(fullPath);
            } else if (entry.isFile()) {
                processFile(fullPath);
            }
        }
    }

    // Обработка всех переданных путей
    for (const currentPath of paths) {
        try {
            const stats = fs.statSync(currentPath);

            if (stats.isFile()) {
                processFile(currentPath);
            } else if (stats.isDirectory()) {
                exploreDirectory(currentPath);
            }
        } catch (error) {
            console.error(chalk.red(`❌ Path error: ${currentPath} - ${error.message}`));
        }
    }

    return {
        filesProcessed,
        filesExtracted,
        dirsCreated
    };
}

module.exports = {
    extractFiles,
    processPaths
};
