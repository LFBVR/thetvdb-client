import superagent from 'superagent';

export default class TheTVDbClient {
  constructor({
    url = 'https://api.thetvdb.com/',
    language = null,
    username,
    userkey,
    apikey,
  } = {}) {
    this.auth = {
      username,
      userkey,
      apikey,
    };

    this.token = null;

    this.agent = superagent.agent();

    // set root url
    this.agent.use((req) => {
      if (req.url.startsWith('/')) {
        req.url = `${url}/${req.url}`;
      }

      return req;
    });

    // set token
    this.agent.use((req) => {
      if (this.token) {
        req.set('Authorization', `Bearer ${this.token}`);
      }

      return req;
    });

    // set language
    this.agent.use((req) => {
      req.set('Accept-Language', req.headers['Accept-Language'] || language);
      return req;
    });
  }

  /**
   * Get an auth token from the api.
   *
   * @async
   * @returns {Promise} Resolves if the authentication succeeded.
   */
  async authenticate() {
    const res = await this.agent
      .post('/login')
      .send({ ...this.auth });

    this.token = res.token;
  }

  /**
   * Send a request, and automatically tries to authenticate.
   *
   * @param {func} makeRequest - Request factory.
   * @returns {Promise.<Object>} The result of the request.
   */
  async _doRequest(makeRequest) {
    if (!this.token) {
      await this.authenticate();
      return await makeRequest();
    }

    try {
      return await makeRequest();
    } catch (err) {
      await this.authenticate();
      return await makeRequest();
    }
  }

  /**
   * GET /series/{id}
   *
   * @param {number} serieId - Id of the serie.
   * @returns {Object} Serie data.
   */
  getSerie(serieId) {
    const { body } = await this._doRequest(() => this.agent.get(`/series/${serieId}`));
    return body.data;
  }
}
