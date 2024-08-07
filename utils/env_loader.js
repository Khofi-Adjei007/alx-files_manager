import { existsSync, readFileSync } from 'fs';

/**
 * Loads environment variables from a file based on
 * the current script being executed.
 */

const envLoader = () => {
  // Determine the environment based on the npm lifecycle event or default to 'dev'
  const env = process.env.npm_lifecycle_event || 'dev';
  // Select the appropriate .env file based on the environment
  const path = env.includes('test') || env.includes('cover') ? '.env.test' : '.env';

  // Check if the environment file exists
  if (existsSync(path)) {
    // Read the file content, split it into lines, and trim any extraneous whitespace
    const data = readFileSync(path, 'utf-8').trim().split('\n');

    // Iterate through each line to set environment variables
    for (const line of data) {
      const delimPosition = line.indexOf('=');
      const variable = line.substring(0, delimPosition);
      const value = line.substring(delimPosition + 1);
      process.env[variable] = value;
    }
  }
};

export default envLoader;
