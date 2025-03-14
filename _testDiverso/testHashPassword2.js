const bcrypt = require('bcrypt');

(async () => {
  const password = "myPassword123";
  const salt = await bcrypt.genSalt(10);
  console.log(`salt=${salt}`)
  console.log(`Generated Salt: ${salt}`);
  
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(`Hashed Password: ${hashedPassword}`);
})();

$2b$10$FQRo9cl0iZChiIvAEWKSl.
$2b$10$aG8QkojxDa3sENaQi0vCbu