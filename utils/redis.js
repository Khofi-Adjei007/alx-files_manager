import { promisify } from 'util';
import { createClient } from 'redis';

/**
 * Defines a Redis client handler.
 */
class RedisClient {
  /**
   * Initializes a new RedisClient instance.
   */
  constructor() {
    this.client = createClient();
    this.isClientConnected = true;

    this.client.on('error', (err) => {
      console.error('Error connecting to Redis:', err.message || err.toString());
      this.isClientConnected = false;
    });

    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
   * Verifies if the client is connected to the Redis server.
   * @returns {boolean} True if connected, false otherwise.
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Gets the value associated with the provided key.
   * @param {String} key The key to look up.
   * @returns {Promise<String | null>} The value stored in Redis or null if not found.
   */
  async get(key) {
    return promisify(this.client.get).bind(this.client)(key);
  }

  /**
   * Sets a value in Redis with an expiration time.
   * @param {String} key The key under which to store the value.
   * @param {String | Number | Boolean} value The value to store.
   * @param {Number} duration Time in seconds until the value expires.
   * @returns {Promise<void>}
   */
  async set(key, value, duration) {
    await promisify(this.client.setex).bind(this.client)(key, duration, value);
  }

  /**
   * Deletes the value associated with the provided key.
   * @param {String} key The key whose value needs to be deleted.
   * @returns {Promise<void>}
   */
  async del(key) {
    await promisify(this.client.del).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
