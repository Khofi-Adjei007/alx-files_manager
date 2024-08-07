import express from 'express';

/**
 * Adds middlewares to the given Express application.
 * @param {express.Express} api The Express application instance.
 */
const injectMiddlewares = (api) => {
  // Use JSON middleware with a limit of 200 MB
  api.use(express.json({ limit: '200mb' }));
};

export default injectMiddlewares;
