/* eslint-disable import/no-named-as-default */
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

export default class AuthController {
  /**
   * Generates a new authentication token for the user and stores it in Redis.
   * @param {Object} req The Express request object.
   * @param {Object} res The Express response object.
   */
  static async getConnect(req, res) {
    const { user } = req; // Extract user information from the request
    const token = uuidv4(); // Generate a unique token

    // Store the token in Redis with a 24-hour expiration
    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
    res.status(200).json({ token }); // Respond with the generated token
  }

  /**
   * Revokes the authentication token by removing it from Redis.
   * @param {Object} req The Express request object.
   * @param {Object} res The Express response object.
   */
  static async getDisconnect(req, res) {
    const token = req.headers['x-token']; // Extract token from request headers

    // Remove the token from Redis
    await redisClient.del(`auth_${token}`);
    res.status(204).send(); // Respond with no content to indicate success
  }
}
