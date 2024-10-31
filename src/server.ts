import fastifyAccepts from '@fastify/accepts';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastify, { RouteShorthandOptions } from 'fastify';
import { env } from './env.js';
import { getRequestLogger } from './logger.js';

const server = fastify({
  loggerInstance: getRequestLogger(),
  ignoreDuplicateSlashes: true,
  ignoreTrailingSlash: true,
});

server.register(helmet);
server.register(fastifyAccepts);
server.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Test swagger',
      description: 'Testing the Fastify swagger API',
      version: '0.1.0',
    },
    // servers: [
    //   {
    //     url: 'http://localhost:3000',
    //     description: 'Development server',
    //   },
    // ],
    tags: [
      // { name: 'api', description: 'User related end-points' },
      // { name: 'code', description: 'Code related end-points' },
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'apiKey',
          in: 'header',
        },
      },
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here',
    },
  },
});

server.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      next();
    },
    preHandler: function (request, reply, next) {
      next();
    },
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
});

server.addHook('onRequest', (request, reply, done) => {
  if (!request.accepts().type(['application/json'])) {
    reply.code(415).send({ message: 'Unsupported Media Type' });
  } else {
    done();
  }
});

if (env.CORS !== '') {
  server.register(cors, { origin: env.CORS.split(',') });
}

const opts: RouteShorthandOptions = {
  schema: {
    description: 'post some data',
    tags: ['user', 'code'],

    // params: {
    //   type: 'object',
    //   properties: {
    //     id: {
    //       type: 'string',
    //       description: 'user id',
    //     },
    //   },
    // },
    body: {
      type: 'object',
      required: ['name', 'parentId', 'requiredKey'],
      additionalProperties: false,
      properties: {
        hello: { type: 'string' },
        obj: {
          type: 'object',
          properties: {
            some: { type: 'string' },
          },
        },
      },
    },
    response: {
      201: {
        description: 'Successful response',
        type: 'object',
        properties: {
          hello: { type: 'string' },
        },
      },
    },
    // security: [
    //   {
    //     apiKey: [],
    //   },
    // ],
  },
};

server.register((server, _opts, done) => {
  server.get('/api/healthcheck', async () => {
    return { ok: true };
  });

  server.post('/api/echo', opts, async (request, res) => {
    res.status(201);
    return request.body;
  });
  done();
});

export { server };
