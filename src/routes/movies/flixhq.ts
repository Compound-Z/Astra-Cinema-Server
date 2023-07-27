import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { MOVIES } from '@consumet/extensions';
import { StreamingServers } from '@consumet/extensions/dist/models';
import { Sub, SubModel } from '../../models/Sub'
import { MediaStreamResource } from '../../models/MediaStreamResource';
const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  const flixhq = new MOVIES.FlixHQ();

  fastify.get('/app_versions', (req, res) => {
    const platform = (req.query as { platform: string }).platform;
    const getHighVersion = (req.query as { getHighVersion: boolean }).getHighVersion;
    console.log(getHighVersion.valueOf);
    const is_require_update = (req.query as { isForceUpdate: boolean }).isForceUpdate;

    let url = "";
    let version = "";

    if(platform == "android"){
      if(getHighVersion == true) url = "https://astra-cinema.herokuapp.com/static/slearn_1098.apk";
      else url = "https://astra-cinema.herokuapp.com/static/slearn_100.apk";
    }else{
      if(getHighVersion == true) url = "itms-services://?action=download-manifest&url=https://astra-cinema.herokuapp.com/static/slearn_1098.plist";
      else url = "itms-services://?action=download-manifest&url=https://astra-cinema.herokuapp.com/static/slearn_100.plist";
    }
    
    if(getHighVersion == true)
      version = "10.9.8+100";
    else
      version = "1.0.0+1";

    res.status(200).send({
        message: "Get version successfully",
        data: {
          version: version,
          message: "Mock force update api",
          url: url,
          is_require_update: is_require_update == true ? true : false
        }
      });
  });

  fastify.get('/', (_, rp) => {
    rp.status(200).send({
      intro:
        "Welcome to the flixhq provider: check out the provider's website @ https://flixhq.to/",
      routes: ['/:query', '/info', '/watch'],
      documentation: 'https://docs.consumet.org/#tag/flixhq',
    });
  });

  fastify.get('/:query', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = decodeURIComponent((request.params as { query: string }).query);

    const page = (request.query as { page: number }).page;

    const res = await flixhq.search(query, page);

    reply.status(200).send(res);
  });

  fastify.get('/recent-shows', async (request: FastifyRequest, reply: FastifyReply) => {
    const res = await flixhq.fetchRecentTvShows();

    reply.status(200).send(res);
  });

  fastify.get('/recent-movies', async (request: FastifyRequest, reply: FastifyReply) => {
    const res = await flixhq.fetchRecentMovies();

    reply.status(200).send(res);
  });

  fastify.get('/trending', async (request: FastifyRequest, reply: FastifyReply) => {
    const type = (request.query as { type: string }).type;
    try {
      if (!type) {
        const res = {
          results: [
            ...(await flixhq.fetchTrendingMovies()),
            ...(await flixhq.fetchTrendingTvShows()),
          ],
        };
        return reply.status(200).send(res);
      }
      const res =
        type === 'tv'
          ? await flixhq.fetchTrendingTvShows()
          : await flixhq.fetchTrendingMovies();
      reply.status(200).send(res);
    } catch (error) {
      reply.status(500).send({
        message:
          'Something went wrong. Please try again later. or contact the developers.',
      });
    }
  });

  fastify.get('/info', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = (request.query as { id: string }).id;

    if (typeof id === 'undefined')
      return reply.status(400).send({
        message: 'id is required',
      });

    try {
      const res = await flixhq
        .fetchMediaInfo(id)
        .catch((err) => reply.status(404).send({ message: err }));

      reply.status(200).send(res);
    } catch (err) {
      reply.status(500).send({
        message:
          'Something went wrong. Please try again later. or contact the developers.',
      });
    }
  });

  fastify.get('/watch', async (request: FastifyRequest, reply: FastifyReply) => {
    const episodeId = (request.query as { episodeId: string }).episodeId;
    const mediaId = (request.query as { mediaId: string }).mediaId;
    const server = (request.query as { server: StreamingServers }).server;

    if (typeof episodeId === 'undefined')
      return reply.status(400).send({ message: 'episodeId is required' });
    if (typeof mediaId === 'undefined')
      return reply.status(400).send({ message: 'mediaId is required' });

    if (server && !Object.values(StreamingServers).includes(server))
      return reply.status(400).send({ message: 'Invalid server query' });

    try {

      const [media, vietsub] = await Promise.allSettled(
        [
          flixhq
            .fetchEpisodeSources(episodeId, mediaId, server)
            .catch((err) => reply.status(404).send({ message: 'Media Not found.' })),

          SubModel.findOne({ id: mediaId, episodeId: episodeId })
        ]
      )

      if (media.status === 'rejected') throw new Error("Server error")

      const res = media.value as MediaStreamResource
      if (vietsub.status === 'fulfilled' && vietsub.value != null) {
        const vietsubData = vietsub.value as Sub
        res.subtitles.push({ lang: vietsubData.lang, url: vietsubData.url })
      }

      reply.status(200).send(res);
    } catch (err) {
      reply
        .status(500)
        .send({ message: 'Something went wrong. Please try again later.' });
    }
  });

  fastify.get('/servers', async (request: FastifyRequest, reply: FastifyReply) => {
    const episodeId = (request.query as { episodeId: string }).episodeId;
    const mediaId = (request.query as { mediaId: string }).mediaId;
    try {
      const res = await flixhq.fetchEpisodeServers(episodeId, mediaId);

      reply.status(200).send(res);
    } catch (error) {
      reply.status(500).send({
        message:
          'Something went wrong. Please try again later. or contact the developers.',
      });
    }
  });

  fastify.put('/vietsub', async (request: FastifyRequest, reply: FastifyReply) => {

    if (!request.body)
      return reply.status(400).send({
        message: 'body is required',
      });

    try {
      let subBody = request.body as Sub;
      var query = { id: subBody.id },
        update = subBody,
        options = { upsert: true, new: true, setDefaultsOnInsert: true };

      const sub = await SubModel.findOneAndUpdate(query, update, options)
        .catch((err) => reply.status(404).send({ message: err }))

      reply.status(200).send(sub);
    } catch (err) {
      reply.status(500).send({
        message:
          'Something went wrong. Please try again later. or contact the developers.',
      });
    }
  });
};

export default routes;
