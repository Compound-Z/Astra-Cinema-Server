require('dotenv').config();
import Redis from 'ioredis';
import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';
import books from './routes/books';
import anime from './routes/anime';
import manga from './routes/manga';
import comics from './routes/comics';
import lightnovels from './routes/light-novels';
import movies from './routes/movies';
import meta from './routes/meta';
import chalk from 'chalk';
import Utils from './utils';
import connectDB from './db/connect'
const path = require('path');
const fs = require('fs');


export const redis =
  process.env.REDIS_HOST &&
  new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: {},
  });

export const tmdbApi = process.env.apiKey && process.env.apiKey;
(async () => {
  const PORT = Number(process.env.PORT) || 3000;

  console.log(chalk.green(`Starting server on port ${PORT}... 🚀`));
  if (!process.env.REDIS_HOST)
    console.warn(chalk.yellowBright('Redis not found. Cache disabled.'));
  if (!process.env.tmdbApi)
    console.warn(
      chalk.yellowBright('TMDB api key not found. the TMDB meta route may not work.')
    );

  try {
    await connectDB(process.env.MONGO_URI as string)
    console.log(chalk.green(`Starting MongoDB... 🚀`));
  } catch (error) {
    console.log(`Error while starting mongoDB: ${error}`);
  }

  const fastify = Fastify({
    maxParamLength: 1000,
    logger: true,
  });
  await fastify.register(FastifyCors, {
    origin: '*',
    methods: 'GET',
  });

  await fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'static'),
    prefix: '/static/', 
  })
  fastify.get('/static/slearn_100.ipa', function (req, reply) {
    const stream = fs.createReadStream(path.resolve('./static/slearn_100.ipa'));
    reply.type("application/octet-stream").send(stream);
  })
  fastify.get('/static/slearn_100.plist', function (req, reply) {
    const stream = fs.createReadStream(path.resolve('./static/slearn_100.plist'));
    reply.type("text/xml").send(stream);
  })
  fastify.get('/static/slearn_1098.ipa', function (req, reply) {
    const stream = fs.createReadStream(path.resolve('./static/slearn_1098.ipa'));
    reply.type("application/octet-stream").send(stream);
  })
  fastify.get('/static/slearn_1098.plist', function (req, reply) {
    const stream = fs.createReadStream(path.resolve('./static/slearn_1098.plist'));
    reply.type("text/xml").send(stream);
  })
  fastify.get('/static/slearn_100_dev_debug.apk', function (req, reply) {
    const stream = fs.createReadStream(path.resolve('./static/slearn_100_dev_debug.apk'));
    reply.type("application/octet-stream").send(stream);
  })
  fastify.get('/static/slearn_1098_dev_debug.apk', function (req, reply) {
    const stream = fs.createReadStream(path.resolve('./static/slearn_1098_dev_debug.apk'));
    reply.type("application/octet-stream").send(stream);
  })
 
  // await fastify.register(books, { prefix: '/books' });
  // await fastify.register(anime, { prefix: '/anime' });
  // await fastify.register(manga, { prefix: '/manga' });
  //await fastify.register(comics, { prefix: '/comics' });
  // await fastify.register(lightnovels, { prefix: '/light-novels' });
  await fastify.register(movies, { prefix: '/movies' });
  // await fastify.register(meta, { prefix: '/meta' });

  await fastify.register(Utils, { prefix: '/utils' });

  try {
    fastify.get('/', (_, rp) => {
      rp.status(200).send('Welcome to consumet api! 🎉');
    });
    fastify.get('*', (request, reply) => {
      reply.status(404).send({
        message: '',
        error: 'page not found',
      });
    });

    fastify.listen({ port: PORT, host: '0.0.0.0' }, (e, address) => {
      if (e) throw e;
      console.log(`server listening on ${address}`);
    });
  } catch (err: any) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
