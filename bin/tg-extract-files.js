#!/usr/bin/env node

const extractor = require('../lib/extractor');
const chalk = require('chalk');
const fs = require('fs');

// Обработка аргументов командной строки
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(chalk.yellow('\n📂 Extract Files from Text Utility\n'));
    console.log(chalk.cyan('Usage:'));
    console.log('  extract-files <input-file> [options]\n');
    console.log(chalk.cyan('Options:'));
    console.log('  -h, --help     Show this help message');
    console.log('  -v, --version  Show package version\n');
    console.log(chalk.cyan('Example:'));
    console.log('  extract-files source.txt\n');
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('../package.json');
    console.log(chalk.yellow(`\n📦 ${pkg.name} v${pkg.version}\n`));
    process.exit(0);
}

const inputFile = args[0];

// Проверка существования файла
if (!fs.existsSync(inputFile)) {
    console.error(chalk.red(`\n❌ Error: File not found - ${inputFile}\n`));
    process.exit(1);
}

// Запуск процесса извлечения
try {
    const result = extractor.extractFiles(inputFile);
    console.log(chalk.green(`\n✅ Successfully extracted ${result.fileCount} files to ${result.baseDir}\n`));
} catch (error) {
    console.error(chalk.red(`\n❌ Extraction error: ${error.message}\n`));
    process.exit(1);
}
