import envLoader from '../utils/env_loader';

/**
 * Starts the server and listens for incoming requests.
 * @param {Object} api The API instance to start listening.
 */
const startServer = (api) => {
  // Load environment variables
  envLoader();

  // Define the port to listen on, defaulting to 5000 if not specified
  const port = process.env.PORT || 5000;

  // Retrieve the current environment from process variables, defaulting to 'dev'
  const env = process.env.npm_lifecycle_event || 'dev';

  // Start the API server and log a message indicating that it's running
  api.listen(port, () => {
    console.log(`[${env}] API has started listening at port:${port}`);
  });
};

export default startServer;
