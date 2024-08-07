/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { getUserFromXToken, getUserFromAuthorization } from '../utils/auth';

/**
 * Middleware for Basic authentication.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function.
 */
export const basicAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getUserFromAuthorization(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = user;
  next();
};

/**
 * Middleware for X-Token authentication.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function.
 */
export const xTokenAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getUserFromXToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = user;
  next();
};
