// Execute com: node gerar_hashes.js
// Depois cole os hashes no banco_de_dados.sql

const bcrypt = require('bcrypt');

const usuarios = [
  { email: 'paulo@email.com',                senha: '123456' },
  { email: 'ana@email.com',                  senha: '654321' },
  { email: 'victor@email.com',               senha: '111222' },
  { email: 'guilhermeoliveiraifrn@email.com', senha: '112358' },
];

(async () => {
  console.log('Gerando hashes bcrypt...\n');
  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.senha, 10);
    console.log(`${u.email} (senha: ${u.senha})`);
    console.log(`Hash: ${hash}\n`);
  }
})();