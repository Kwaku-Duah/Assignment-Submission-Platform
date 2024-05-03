import { Express, Request, Response } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import SwaggerUi from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Git Inspired Assignment Submission Platform',
      version: '1.0.0'
    }
  },
  apis: ['./docs.yaml']
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app: Express) => {
  app.use('/api_docs', SwaggerUi.serve, SwaggerUi.setup(swaggerSpec));

  app.get('/api_docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerDocs;
