const fs = require('fs');
const path = require('path');

const MAX_LOG_FILES = 10; // Define o número máximo de arquivos de log a serem mantidos

function customLogger(query, options) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${query}\n`;

  const logDir = path.join(path.dirname(__dirname), '/logs/sql'); // Diretório onde os arquivos de log serão armazenados
  const logFileName = 'sql.log';
  const logFilePath = path.join(logDir, logFileName);
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '');
  }
  const logFileSize = fs.statSync(logFilePath).size;

  // Rotate log file if it exceeds 10MB
  if (logFileSize > 10000000) {
    // Renomeia o arquivo de log atual
    const rotatedLogFilePath = path.join(logDir, `sql_${timestamp.replace(/:/g, '-')}.log`);
    fs.renameSync(logFilePath, rotatedLogFilePath);

    // Remove arquivos de log antigos se houver mais do que o número máximo permitido
    const logFiles = fs.readdirSync(logDir);
    const oldLogFiles = logFiles.filter(file => file.startsWith('sql_') && file.endsWith('.log'));
    if (oldLogFiles.length > MAX_LOG_FILES) {
      const filesToDelete = oldLogFiles.slice(0, oldLogFiles.length - MAX_LOG_FILES);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(logDir, file));
      });
    }
  }
  // Adiciona a mensagem de log ao arquivo de log atual
  fs.appendFileSync(logFilePath, logMessage);
}
module.exports = customLogger;