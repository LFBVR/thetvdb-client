import TheTVDbClient from '../src';

const auth = {
  apikey: process.env.TVDB_API_KEY_TEST,
  userkey: process.env.TVDB_USER_KEY_TEST,
  username: process.env.TVDB_USER_NAME_TEST,
};

describe('TheTVDbClient', () => {
  const client = new TheTVDbClient({ ...auth });

  describe('#authenticate', () => {
    it('authenticates the user', async () => {
      const testClient = new TheTVDbClient({ ...auth });
      const token = await testClient.authenticate();
      expect(token).toBeDefined();
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
    });

    describe('#getLanguage', () => {
      it('gets the info of a language', async () => {
        const language = await client.getLanguage(7);
        expect(language.id).toBe(7);
      });
    });
  });

  describe('#getSerie', () => {
    it('gets the data of a serie', async () => {
      const serie = await client.getSerie(121361);
      expect(serie).toBeDefined();
      expect(serie.id).toBe(121361);
    });
  });
});
