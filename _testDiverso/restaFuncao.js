const findResult = {
  success: true,
  data: { someKey: 'someValue' },
  message: 'Validation passed',
  unexpected: false,
};

console.log('findResult',findResult);
const result = (({ data, ...rest }) => rest)(findResult);
console.log('Result',result);
