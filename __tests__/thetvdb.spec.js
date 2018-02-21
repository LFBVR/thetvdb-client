import { Response } from 'superagent';
import TheTVDbClient from '../src';

const auth = {
  apikey: process.env.TVDB_API_KEY_TEST,
  userkey: process.env.TVDB_USER_KEY_TEST,
  username: process.env.TVDB_USER_NAME_TEST,
};

describe('TheTVDbClient', () => {
  const client = new TheTVDbClient({
    ...auth,
    language: 'en',
  });

  const fullResponseClient = new TheTVDbClient({
    ...auth,
    shouldReturnFullResponse: true,
  });

  describe('#authenticate', () => {
    it('authenticates the user', async () => {
      const testClient = new TheTVDbClient({ ...auth });
      const token = await testClient.authenticate();
      expect(token).toBeDefined();
    });

    it('lets the user get the full response', async () => {
      const testFullResponseClient = new TheTVDbClient({
        ...auth,
        shouldReturnFullResponse: true,
      });

      const res = await testFullResponseClient.authenticate();
      expect(res).toBeInstanceOf(Response);
      expect(res.body.token).toBeDefined();
    });

    it('automatically authenticates the user', async () => {
      const testClient = new TheTVDbClient({ ...auth });
      const serie = await testClient.getSerie(121361);
      expect(serie.id).toBe(121361);
    });
  });

  describe('Languages', () => {
    describe('#getLanguages', () => {
      it('gets the list of languages', async () => {
        const languages = await client.getLanguages();
        expect(languages).toBeInstanceOf(Array);
      });

      it('lets the user override the full response option', async () => {
        const res = await client.getLanguages({ shouldReturnFullResponse: true });
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('takes the constructor full response option', async () => {
        const res = await fullResponseClient.getLanguages();
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
      });
    });

    describe('#getLanguage', () => {
      it('gets the info of a language', async () => {
        const language = await client.getLanguage(7);
        expect(language.id).toBe(7);
      });

      it('lets the user override the full response option', async () => {
        const res = await client.getLanguage(7, { shouldReturnFullResponse: true });
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data.id).toBe(7);
      });

      it('takes the constructor full response option', async () => {
        const res = await fullResponseClient.getLanguage(7);
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data.id).toBe(7);
      });
    });
  });

  describe('Series', () => {
    describe('#searchSeries', () => {
      it('searches series', async () => {
        const result = await client.searchSeries({ name: 'game of thrones' });
        expect(result).toBeInstanceOf(Array);
      });

      it('finds a serie by its IMDB id', async () => {
        const result = await client.searchSeries({ imdbId: 'tt0944947' });
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(1);
      });

      it('lets the user override the language', async () => {
        const result = await client.searchSeries({ imdbId: 'tt0944947' }, { language: 'fr' });
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(1);
        // This field is the only way for the test to assert the language.
        // This is not ideal.
        expect(result[0].aliases).toContain('Le Trône de fer');
      });

      it('lets the user override the full response option', async () => {
        const res = await client.searchSeries({ imdbId: 'tt0944947' }, { shouldReturnFullResponse: true });
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data).toHaveLength(1);
      });

      it('takes the constructor full response option', async () => {
        const res = await fullResponseClient.searchSeries({ imdbId: 'tt0944947' });
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data).toHaveLength(1);
      });
    });

    describe('#getSerie', () => {
      it('gets the data of a serie', async () => {
        const serie = await client.getSerie(121361);
        expect(serie).toBeDefined();
        expect(serie.id).toBe(121361);
      });

      it('lets the user override the language', async () => {
        const serie = await client.getSerie(121361, { language: 'fr' });
        expect(serie).toBeDefined();
        expect(serie.id).toBe(121361);
        // This field is the only way for the test to assert the language.
        // This is not ideal.
        expect(serie.aliases).toContain('Le Trône de fer');
      });

      it('lets the user override the full response option', async () => {
        const res = await client.getSerie(121361, { shouldReturnFullResponse: true });
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data.id).toBe(121361);
      });

      it('takes the constructor full response option', async () => {
        const res = await fullResponseClient.getSerie(121361);
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data.id).toBe(121361);
      });
    });

    describe('#getSerieHead', () => {
      it('returns the response headers', async () => {
        const headers = await client.getSerieHead(121361);
        expect(headers.date).toBeDefined();
      });

      it('lets the user override the full response option', async () => {
        const res = await client.getSerieHead(121361, { shouldReturnFullResponse: true });
        expect(res).toBeInstanceOf(Response);
        expect(res.headers.date).toBeDefined();
      });

      it('takes the constructor full response option', async () => {
        const res = await fullResponseClient.getSerieHead(121361);
        expect(res).toBeInstanceOf(Response);
        expect(res.headers.date).toBeDefined();
      });
    });

    describe('#getSerieActors', () => {
      it('fetches the actors of a serie', async () => {
        const actors = await client.getSerieActors(121361);
        expect(actors).toBeInstanceOf(Array);
      });

      it('lets the user override the full response option', async () => {
        const res = await client.getSerieActors(121361, { shouldReturnFullResponse: true });
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('takes the constructor full response option', async () => {
        const res = await fullResponseClient.getSerieActors(121361);
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
      });
    });

    describe('#getSerieEpisodes', () => {
      it('fetches a page of episodes of a serie', async () => {
        const episodes = await client.getSerieEpisodes(121361);
        expect(episodes).toBeInstanceOf(Array);
      });

      it('lets the user override the language', async () => {
        const episodes = await client.getSerieEpisodes(121361, undefined, { language: 'fr' });
        expect(episodes).toBeInstanceOf(Array);
      });

      it('lets the user override the full response option', async () => {
        const res = await client.getSerieEpisodes(
          121361,
          {},
          { shouldReturnFullResponse: true },
        );

        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('takes the constructor full response option', async () => {
        const res = await fullResponseClient.getSerieEpisodes(121361);
        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
      });
    });

    describe('#getSerieEpisodesQuery', () => {
      it('fetches a page of episodes of a serie', async () => {
        const episodes = await client.getSerieEpisodesQuery(121361, { airedSeason: 1 });
        expect(episodes).toBeInstanceOf(Array);
      });

      it('lets the user override the language', async () => {
        const episodes = await client.getSerieEpisodesQuery(
          121361,
          { airedSeason: 1 },
          { language: 'fr' },
        );

        expect(episodes).toBeInstanceOf(Array);
      });

      it('lets the user override the full response option', async () => {
        const res = await client.getSerieEpisodesQuery(
          121361,
          { airedSeason: 1 },
          { shouldReturnFullResponse: true },
        );

        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      it('takes the constructor full response option', async () => {
        const res = await fullResponseClient.getSerieEpisodesQuery(
          121361,
          { airedSeason: 1 },
        );

        expect(res).toBeInstanceOf(Response);
        expect(res.body.data).toBeInstanceOf(Array);
      });
    });
  });
});
