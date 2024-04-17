const faker = require('faker')
faker.locale = 'pt_BR';

const nomeFicticio = faker.name.findName();
console.log(nomeFicticio);