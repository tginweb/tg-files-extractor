# tg-files-extractor

Utility to extract files from text with specific delimiters.

## Installation

```bash
npm install -g tginweb/tg-files-extractor
# or
yarn global add tginweb/tg-files-extractor
```

## Usage

```bash
tg-extract-files input.txt
```

## Input format

```
/* ==== path/to/file.js ==== */
Content of the file
/* ==== another/file.txt ==== */
Another content
```

## AI Chat Instruction
<pre>
В конце твоего ответа соедини все файлы использованного исходного кода как общий текст с разделителем вида:
/* ==== path/to/file.ext ==== */
Где "path/to/file.ext" это путь и название файла согласно разработанной тобой структуре.
Тексты исходного кода должны быть представлены полностью, без пропусков и отсылок на прошлые ответы.
Также в объединенный текст также включи следующие файлы на основе текущей структуры проекта:
- files-schema.txt - описание структуры файлов и папок в виде acsii дерева
- Использованные тобой файлы служебных скриптов bash/nodejs (если такие будут) размести в отдельном каталоге scripts с наименованими по смыслу
- Использованные тобой короткие команды bash по работе с проектом (например "npm install & npm run build") - размести в виде файлов в каталоге bash с наименованиями по смыслу
</pre>
