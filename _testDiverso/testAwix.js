const container = require('../container');

try {
  console.log('✅ Testando stateController:', container.resolve('stateController'));
} catch (error) {
  console.error('❌ Erro ao resolver stateController:', error);
}