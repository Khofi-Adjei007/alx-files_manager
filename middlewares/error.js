/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';

/**
 * Represents an error in this API.
 */
export class APIError extends Error {
  /**
   * Creates an instance of APIError.
   * @param {number} [code=500] The HTTP status code for the error.
   * @param {string} [message] The error message.
   */
  constructor(code = 500, message) {
    super(message);
    this.code = code;
    this.message = message || 'An unexpected error occurred';
  }
}

/**
 * Error handling middleware for Express.
 * @param {Error} err The error object.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function.
 */
export const errorResponse = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const defaultMsg = `Failed to process ${req.url}`;

  if (err instanceof APIError) {
    return res.status(err.code).json({ error: err.message || defaultMsg });
  }

  res.status(500).json({
    error: err ? err.message || err.toString() : defaultMsg,
  });
};
