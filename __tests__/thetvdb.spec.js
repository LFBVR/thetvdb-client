import TheTVDbClient from '../src';

const auth = {
  apikey: process.env.TVDB_API_KEY_TEST,
  userkey: process.env.TVDB_USER_KEY_TEST,
  username: process.env.TVDB_USER_NAME_TEST,
};

describe('TheTVDbClient', () => {
  describe('#authenticate', () => {
    it('authenticates the user', async () => {
      const client = new TheTVDbClient({ ...auth });
      const token = await client.authenticate();
      expect(token).toBeTruthy();
    });

    it('automatically authenticates the user', async () => {
      const client = new TheTVDbClient({ ...auth });
      const serie = await client.getSerie(121361);
      expect(serie.id).toBe(121361);
    });
  });
});
