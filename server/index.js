const path = require('node:path');
const { existsSync } = require('node:fs');
const fastify = require('fastify')({ logger: true });
const fastifyStatic = require('@fastify/static');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const staticRoot = existsSync(publicDir) ? publicDir : projectRoot;

fastify.register(fastifyStatic, {
  root: staticRoot,
  prefix: '/',
  wildcard: false,
});

fastify.get('/health', async () => ({ status: 'ok' }));


const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
