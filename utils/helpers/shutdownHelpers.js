const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);

    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        console.error('Error during shutdown:', err);
        process.exit(1); // Exit with error if there's a problem
      }

      console.log('All connections closed, shutting down.');
      process.exit(0); // Exit gracefully
    });

    // Force shutdown after a timeout if connections still active
    setTimeout(() => {
      console.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000); // 10-second grace period
  };
};

module.exports = { gracefulShutdown };