import mongodb from 'mongodb';
// eslint-disable-next-line no-unused-vars
import Collection from 'mongodb/lib/collection';
import envLoader from './env_loader';

/**
 * Manages the connection to the MongoDB database.
 */
class DBClient {
  /**
   * Initializes a new DBClient instance.
   */
  constructor() {
    envLoader(); // Load environment variables
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new mongodb.MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect(); // Establish connection to MongoDB
  }

  /**
   * Verifies if the MongoDB client is connected.
   * @returns {boolean} True if connected, otherwise false.
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * Returns the number of users in the database.
   * @returns {Promise<number>} The count of users.
   */
  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * Returns the number of files in the database.
   * @returns {Promise<number>} The count of files.
   */
  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  /**
   * Provides access to the users collection.
   * @returns {Promise<Collection>} The users collection.
   */
  async usersCollection() {
    return this.client.db().collection('users');
  }

  /**
   * Provides access to the files collection.
   * @returns {Promise<Collection>} The files collection.
   */
  async filesCollection() {
    return this.client.db().collection('files');
  }
}

export const dbClient = new DBClient();
export default dbClient;
