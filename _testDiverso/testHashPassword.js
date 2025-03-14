const bcrypt = require('bcrypt');
async function hashPassword(password) {
  try {
    console.log(`hashPassword(password)=${password}`);
    
    const customSalt = await bcrypt.genSalt(10); // Gera o salt diretamente
    console.log(`customSalt=${customSalt}`);
    
    const hashedPassword = await bcrypt.hash(password, customSalt);
    console.log(`hashedPassword=${hashedPassword}`);
    
    console.log(`hashedPassword-saindo`);
    return hashedPassword;
  } catch (error) {
    console.log(`hash error=${error.message}`);
  }
}

// Executa a função com uma senha de exemplo
(async () => {
  const password = "myPassword123";
  await hashPassword(password);
})();