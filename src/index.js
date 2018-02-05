import superagent from 'superagent';
import superagentProxy from 'superagent-proxy';

export default class TheTVDbClient {
  constructor({
    url = 'https://api.thetvdb.com/',
    shouldDetectProxy = true,
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

    this.agent = superagentProxy(superagent).agent();

    // set root url
    this.agent.use((req) => {
      if (req.url.startsWith('/')) {
        req.url = `${url}/${req.url}`.replace(/([^:]\/)\/+/g, '$1');
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
      req.set('Accept-Language', req.header['Accept-Language'] || language);
      return req;
    });

    // set proxy
    if (shouldDetectProxy) {
      this.agent.use((req) => {
        if (req.url.startsWith('https:') && process.env.https_proxy) {
          req.proxy(process.env.https_proxy);
        }

        if (req.url.startsWith('http:') && process.env.http_proxy) {
          req.proxy(process.env.http_proxy);
        }

        return req;
      });
    }
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
      return makeRequest();
    }

    try {
      return await makeRequest();
    } catch (err) {
      await this.authenticate();
      return makeRequest();
    }
  }

  /**
   * GET /search/series
   *
   * @async
   * @param {Object} query - Search query.
   * @param {string} query.name - Series name.
   * @param {string} query.imdbId - Series IMDB id.
   * @param {string} query.zap2itId - Series Zap2It id.
   * @returns {Object[]} The series found.
   */
  async searchSeries(query) {
    const { body } = await this._doRequest(() => this.agent.get('/search/series').query(query));
    return body.data;
  }

  /**
   * GET /series/{id}
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @returns {Object} Serie data.
   */
  async getSerie(serieId) {
    const { body } = await this._doRequest(() => this.agent.get(`/series/${serieId}`));
    return body.data;
  }

  // /**
  //  * GET /series/{id}/actors
  //  *
  //  * @async
  //  * @param {number} serieId - Id of the serie.
  //  * @returns {Object[]} Serie actors.
  //  */
  // async getSerieActors(serieId) {
  //   const { body } = await this._doRequest(() => this.agent.get(`/series/${serieId}/actors`));
  //   return body.data;
  // }

  // /**
  //  * GET /series/{id}/episodes
  //  *
  //  * @async
  //  * @param {number} serieId - Id of the serie.
  //  * @param {Object} query - Query parameters.
  //  * @param {number} [query.page=1] - Page of results to fetch.
  //  * @param {Object} [opts] - Options.
  //  * @param {string} [opts.language] - Override the language given in constructor.
  //  * @returns {Object[]} Serie episodes.
  //  */
  // async getSerieEpisodes(serieId, { page = 1 } = {}, { language } = {}) {
  //   const { body } = await this._doRequest(() => this.agent.get(`/series/${serieId}/episodes`));
  //   return body.data;
  // }

  // /**
  //  * GET /series/{id}/episodes/query
  //  *
  //  * @async
  //  * @param {number} serieId - Id of the serie.
  //  * @param {Object} query - Query parameters.
  //  * @param {number} [query.absoluteNumber] - Absolute number of the episode.
  //  * @param {number} [query.airedSeason] - Aired season number.
  //  * @param {number} [query.airedEpisode] - Aired episode number.
  //  * @param {number} [query.dvdSeason] - DVD season number.
  //  * @param {number} [query.dvdEpisode] - DVD episode number.
  //  * @param {number} [query.imdbId] - IMDB id of the series.
  //  * @param {number} [query.page=1] - Page of results to fetch.
  //  * @param {Object} [opts] - Options.
  //  * @param {string} [opts.language] - Override the language given in constructor.
  //  * @returns {Object[]} Serie episodes.
  //  */
  // async getSerieEpisodesQuery(serieId, {
  //   absoluteNumber,
  //   airedSeason,
  //   airedEpisode,
  //   dvdSeason,
  //   dvdEpisode,
  //   imdbId,
  //   page = 1,
  // } = {}, {
  //   language,
  // } = {}) {
  //   const { body } = await this._doRequest(() => this.agent
  //     .get(`/series/${serieId}/episodes/query`)
  //     .set('Accept-Language', language)
  //     .query({
  //       absoluteNumber,
  //       airedSeason,
  //       airedEpisode,
  //       dvdSeason,
  //       dvdEpisode,
  //       imdbId,
  //       page,
  //     }));

  //   return body.data;
  // }
}
