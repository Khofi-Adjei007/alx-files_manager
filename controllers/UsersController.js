/* eslint-disable import/no-named-as-default */
import sha1 from 'sha1';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

const userQueue = new Queue('email sending');

export default class UsersController {
  /**
   * Creates a new user with the provided email and password.
   * @param {Request} req The Express request object, containing the user data.
   * @param {Response} res The Express response object.
   */
  static async postNew(req, res) {
    const email = req.body?.email || null;
    const password = req.body?.password || null;

    // Validate input
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    // Check if the user already exists
    const user = await (await dbClient.usersCollection()).findOne({ email });

    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    // Insert the new user into the database with a hashed password
    const insertionInfo = await (await dbClient.usersCollection())
      .insertOne({ email, password: sha1(password) });
    const userId = insertionInfo.insertedId.toString();

    // Add a job to the email sending queue
    userQueue.add({ userId });

    // Respond with the created user's email and ID
    res.status(201).json({ email, id: userId });
  }

  /**
   * Retrieves the details of the currently authenticated user.
   * @param {Request} req The Express request object, containing user data from authentication middleware.
   * @param {Response} res The Express response object.
   */
  static async getMe(req, res) {
    const { user } = req;

    // Respond with the user's email and ID
    res.status(200).json({ email: user.email, id: user._id.toString() });
  }
}
