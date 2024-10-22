async function main() {
  console.log('GETTING STARTED - AFTER TESTS')
  console.log('COMPLETED - AFTER TESTS\n\n');
  process.exit(0);
}


main().catch(err => {
  console.error('Error in beforeTest script:', err);
  process.exit(1);
});