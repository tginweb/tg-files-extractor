#!/usr/bin/env node

const extractor = require('../lib/extractor');
const chalk = require('chalk');
const path = require('path');

// Обработка аргументов командной строки
const args = process.argv.slice(2);

// Парсинг флагов
let recursive = false;
let paths = [];
let outputDir = null;

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
        case '-r':
        case '--recursive':
            recursive = true;
            break;
        case '-o':
        case '--output':
            outputDir = args[++i];
            break;
        case '-h':
        case '--help':
            showHelp();
            process.exit(0);
            break;
        case '-v':
        case '--version':
            showVersion();
            process.exit(0);
            break;
        default:
            paths.push(arg);
    }
}

if (paths.length === 0) {
    console.error(chalk.red('\n❌ Error: No input paths specified\n'));
    showHelp();
    process.exit(1);
}

// Проверка и нормализация путей
paths = paths.map(p => path.resolve(p));
if (outputDir) outputDir = path.resolve(outputDir);

// Запуск обработки
try {
    const result = extractor.processPaths(paths, {
        recursive,
        outputDir
    });

    console.log(chalk.green(`\n✅ Successfully processed ${result.filesProcessed} files`));
    console.log(chalk.green(`✅ Extracted ${result.filesExtracted} files to ${outputDir || 'current directory'}`));
    console.log(chalk.green(`✅ Created ${result.dirsCreated} directories\n`));
} catch (error) {
    console.error(chalk.red(`\n❌ Processing error: ${error.message}\n`));
    process.exit(1);
}

function showHelp() {
    console.log(chalk.yellow('\n📂 Extract Files from Text Utility\n'));
    console.log(chalk.cyan('Usage:'));
    console.log('  extract-files <paths...> [options]\n');
    console.log(chalk.cyan('Paths:'));
    console.log('  Can be files or directories\n');
    console.log(chalk.cyan('Options:'));
    console.log('  -r, --recursive      Process directories recursively');
    console.log('  -o, --output <dir>   Specify output directory');
    console.log('  -h, --help           Show this help message');
    console.log('  -v, --version        Show package version\n');
    console.log(chalk.cyan('Examples:'));
    console.log('  extract-files file1.txt file2.txt');
    console.log('  extract-files src/ -r -o dist');
    console.log('  extract-files . --recursive\n');
}

function showVersion() {
    const pkg = require('../package.json');
    console.log(chalk.yellow(`\n📦 ${pkg.name} v${pkg.version}\n`));
}
