import superagent from 'superagent';
import superagentProxy from 'superagent-proxy';

export default class TheTVDbClient {
  constructor({
    url = 'https://api.thetvdb.com/',
    shouldDetectProxy = true,
    shouldReturnFullResponse = false,
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

    this.opts = {
      shouldReturnFullResponse,
      language,
    };

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

    // set default language if not specified in request.
    this.agent.use((req) => {
      if (this.opts.language) {
        req.set('Accept-Language', req.header['Accept-Language'] || this.opts.language);
      }

      return req;
    });

    // set proxy
    if (shouldDetectProxy) {
      this.agent.use((req) => {
        if (req.url.startsWith('https:') && (process.env.https_proxy || process.env.HTTPS_PROXY)) {
          req.proxy(process.env.https_proxy || process.env.HTTPS_PROXY);
        }

        if (req.url.startsWith('http:') && (process.env.http_proxy || process.env.HTTP_PROXY)) {
          req.proxy(process.env.http_proxy || process.env.HTTP_PROXY);
        }

        return req;
      });
    }
  }

  /**
   * Get an auth token from the api.
   *
   * @async
   * @param {Object} [opts] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object|string} Response object, or token.
   */
  async authenticate(opts) {
    const res = await this.agent
      .post('/login')
      .send({ ...this.auth });

    this.token = res.body.token;

    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    return shouldReturnFullResponse ? res : this.token;
  }

  /**
   * Send a request, and automatically tries to authenticate.
   *
   * @async
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
   * GET /languages
   *
   * @async
   * @param {Object} [opts] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object|Object[]} Response object, or the list of languages.
   */
  async getLanguages(opts) {
    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent.get('/languages'));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /languages/{id}
   *
   * @async
   * @param {number} languageId - Language id.
   * @param {Object} [opts] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object|Object[]} Response object, or the language.
   */
  async getLanguage(languageId, opts) {
    const e = encodeURIComponent;

    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent.get(`/languages/${e(languageId)}`));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /search/series
   *
   * @async
   * @param {Object} query - Search query.
   * @param {string} query.name - Series name.
   * @param {string} query.imdbId - Series IMDB id.
   * @param {string} query.zap2itId - Series Zap2It id.
   * @param {Object} [opts=null] - Options.
   * @param {string} [opts.language] - Override default language.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object|Object[]} Response object, of the list of series found.
   */
  async searchSeries(query, opts) {
    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get('/search/series')
      .query(query)
      .set('Accept-Language', language || ''));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /series/{id}
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [opts=null] - Options.
   * @param {string} [opts.language] - Override default language.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Response object, or the serie data.
   */
  async getSerie(serieId, opts) {
    const e = encodeURIComponent;

    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}`)
      .set('Accept-Language', language || ''));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * HEAD /series/{id}
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [opts=null] - Options.
   * @param {string} [opts.language] - Override default language.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Response object or headers.
   */
  async getSerieHead(serieId, opts) {
    const e = encodeURIComponent;

    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .head(`/series/${e(serieId)}`)
      .set('Accept-Language', language));

    return shouldReturnFullResponse ? res : res.headers;
  }

  /**
   * GET /series/{id}/actors
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [opts=null] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object|Object[]} Response object, or the list of actors of the serie.
   */
  async getSerieActors(serieId, opts) {
    const e = encodeURIComponent;

    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent.get(`/series/${e(serieId)}/actors`));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /series/{id}/episodes
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} query - Query parameters.
   * @param {number} [query.page=1] - Page of results to fetch.
   * @param {Object} [opts] - Options.
   * @param {string} [opts.language] - Override the language given in constructor.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object[]} Serie episodes.
   */
  async getSerieEpisodes(serieId, { page = 1 } = {}, opts) {
    const e = encodeURIComponent;

    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}/episodes`)
      .query({ page })
      .set('Accept-Language', language || ''));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /series/{id}/episodes/query
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} query - Query parameters.
   * @param {number} [query.absoluteNumber] - Absolute number of the episode.
   * @param {number} [query.airedSeason] - Aired season number.
   * @param {number} [query.airedEpisode] - Aired episode number.
   * @param {number} [query.dvdSeason] - DVD season number.
   * @param {number} [query.dvdEpisode] - DVD episode number.
   * @param {number} [query.imdbId] - IMDB id of the series.
   * @param {number} [query.page=1] - Page of results to fetch.
   * @param {Object} [opts] - Options.
   * @param {string} [opts.language] - Override the language given in constructor.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object[]} Serie episodes.
   */
  async getSerieEpisodesQuery(
    serieId,
    {
      absoluteNumber,
      airedSeason,
      airedEpisode,
      dvdSeason,
      dvdEpisode,
      imdbId,
      page = 1,
    } = {},
    opts,
  ) {
    const e = encodeURIComponent;

    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}/episodes/query`)
      .set('Accept-Language', language || '')
      .query({
        absoluteNumber,
        airedSeason,
        airedEpisode,
        dvdSeason,
        dvdEpisode,
        imdbId,
        page,
      }));

    return shouldReturnFullResponse ? res : res.body.data;
  }
}
