const fs = require('fs');
const path = require('path');

// Read avoid.txt and parse directories and files to exclude
function readAvoidFile(avoidFilePath) {
  try {
    const avoidContent = fs.readFileSync(avoidFilePath, 'utf-8');
    return avoidContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  } catch (error) {
    console.error('Failed to read avoid.txt:', error.message);
    return [];
  }
}

// Check if a file is text-only
function isTextFile(content) {
  // Regex checks for printable ASCII characters, tabs, newlines, and carriage returns
  return /^[\x20-\x7E\r\n\t]*$/.test(content);
}

// Normalize line endings to Unix-style (\n)
function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, '\n');
}

// Merge files recursively
function mergeFilesRecursive(dir, avoidList, outputFile) {
  let mergedContent = '';
  const excludedFiles = [];

  function processDirectory(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Skip if the path is in the avoid list
      if (avoidList.some(avoidItem => fullPath.includes(avoidItem))) {
        excludedFiles.push(fullPath);
        continue;
      }

      if (entry.isDirectory()) {
        processDirectory(fullPath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (isTextFile(content)) {
            mergedContent += `// ${fullPath}\n` + normalizeLineEndings(content) + '\n\n';
          } else {
            excludedFiles.push(fullPath); // Add non-text file to excluded list
          }
        } catch (error) {
          console.error(`Failed to process file: ${fullPath}`, error.message);
        }
      }
    }
  }

  processDirectory(dir);

  try {
    fs.writeFileSync(outputFile, mergedContent, { encoding: 'utf-8' });
    console.log(`Merged content written to: ${outputFile}`);
    console.log(`Excluded files/directories:`);
    excludedFiles.forEach(file => console.log(file));
  } catch (error) {
    console.error(`Failed to write output file: ${outputFile}`, error.message);
  }
}

// Main script execution
(function main() {
  const rootDir = process.argv[2];
  if (!rootDir) {
    console.error('Usage: node mergeFiles.js <root-directory>');
    process.exit(1);
  }

  const avoidFilePath = path.join(__dirname, 'avoid.txt');
  const avoidList = readAvoidFile(avoidFilePath);

  const outputFile = path.join(rootDir, 'merged_output.js');
  mergeFilesRecursive(rootDir, avoidList, outputFile);
})();