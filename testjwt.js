const jwt = require('jsonwebtoken');

const pivatekey = '1@#$^%FJ^A^';

const token = jwt.sign({
  d: {
    name: 'wck',
  }
}, pivatekey, {
  expiresIn: 3,
});

const decode1 = jwt.verify(token, pivatekey);
setTimeout(() => {
  try {
    const decode2 = jwt.verify(token, pivatekey);
    console.log(decode2);
  } catch (e) {
    console.log(e.message);
  }
}, 4000)

console.log(decode1);