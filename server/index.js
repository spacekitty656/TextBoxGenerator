const path = require('node:path');
const fastify = require('fastify')({ logger: true });
const fastifyStatic = require('@fastify/static');

const projectRoot = path.resolve(__dirname, '..');
const appRoot = path.join(projectRoot, 'apps', 'TextBoxGenerator');

fastify.register(fastifyStatic, {
  root: appRoot,
  prefix: '/TextBoxGenerator/',
  wildcard: true,
});

fastify.get('/', async (_request, reply) => {
  reply
    .type('text/html; charset=utf-8')
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Text Box Generator</title>
  </head>
  <body>
    <main>
      <h1>Text Box Generator</h1>
      <p><a href="/TextBoxGenerator">Open Text Box Generator</a></p>
    </main>
  </body>
</html>`);
});

fastify.get('/TextBoxGenerator', async (_request, reply) => {
  reply.redirect('/TextBoxGenerator/');
});

fastify.get('/health', async () => ({ status: 'ok' }));
fastify.get('/favicon.ico', async (_request, reply) => reply.code(204).send());

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
