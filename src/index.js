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
   * @returns {Object|Object[]} Response object, or the list of series found.
   */
  async getSearchSeries(query, opts) {
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
   * GET /search/series/params
   *
   * @description Returns an array of parameters to query by in the /search/series route.
   *
   * @async
   * @param {Object} [opts=null] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object|Object[]} Response object, or the params.
   */
  async getSearchSeriesParams(opts) {
    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent.get('/search/series/params'));

    return shouldReturnFullResponse ? res : res.body.data.params;
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

  /**
   * GET /series/{id}/episodes/query/params
   *
   * @description Returns the allowed query keys for the /series/{id}/episodes/query route.
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [opts] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Parameters information.
   */
  async getSerieEpisodesQueryParams(serieId, opts) {
    const e = encodeURIComponent;

    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}/episodes/query/params`));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /series/{id}/episodes/summary
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [opts] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Serie summary.
   */
  async getSerieEpisodesSummary(serieId, opts) {
    const e = encodeURIComponent;

    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}/episodes/summary`));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /series/{id}/filter
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [query] - Query parameters.
   * @param {string[]} [query.keys] - List of query to filter by.
   * @param {Object} [opts] - Options.
   * @param {string} [opts.language] - Override the language given in constructor.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Serie data filtered.
   */
  async getSerieFilter(serieId, { keys = [] } = {}, opts) {
    const e = encodeURIComponent;

    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}/filter`)
      .set('Accept-Language', language || '')
      .query({ keys: keys.join(',') }));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /series/{id}/images
   *
   * @description Returns a summary of the images for a particular series.
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [opts] - Options.
   * @param {string} [opts.language] - Override the language given in constructor.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Serie images summary.
   */
  async getSerieImages(serieId, opts) {
    const e = encodeURIComponent;

    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}/images`)
      .set('Accept-Language', language || ''));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /series/{id}/images/query
   *
   * @description Query images for the given series ID.
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [query] - Query parameters.
   * @param {string} [query.keyType] - Type of image you're querying for.
   * @param {string} [query.subKey] - Subkey for the above query keys.
   * @param {string} [query.resolution] - Resolution to filter by (1280x1024, for example).
   * @param {Object} [opts] - Options.
   * @param {string} [opts.language] - Override the language given in constructor.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Serie images.
   */
  async getSerieImagesQuery(serieId, { keyType, subKey, resolution }, opts) {
    const e = encodeURIComponent;

    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}/images/query`)
      .query({ keyType, subKey, resolution })
      .set('Accept-Language', language || ''));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /series/{id}/images/query/params
   *
   * @description Returns the allowed query keys for the /series/{id}/images/query route.
   *
   * @async
   * @param {number} serieId - Id of the serie.
   * @param {Object} [opts] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Parameters information.
   */
  async getSerieImagesQueryParams(serieId, opts) {
    const e = encodeURIComponent;

    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/series/${e(serieId)}/images/query/params`));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /updated/query
   *
   * @description Returns an array of series that have changed in a maximum of one week blocks since
   * the provided fromTime.
   *
   * @async
   * @param {Object} query - Query parameters.
   * @param {number|Date} query.fromTime - Epoch time to start your date range.
   * @param {number|Date} [query.toTime] - Epoch time to end your date range. Must be one week from
   * fromTime.
   * @param {Object} [opts] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Updated series ids.
   */
  async getUpdatedQuery({ fromTime, toTime }, opts) {
    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get('/updated/query')
      .query({
        fromTime: (fromTime?.getTime?.() / 1000) || fromTime,
        toTime: (toTime?.getTime?.() / 1000) || toTime,
      }));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /updated/query/params
   *
   * @description Returns an array of valid query keys for the /updated/query/params route.
   *
   * @async
   * @param {Object} query - Query parameters.
   * @param {number|Date} query.fromTime - Epoch time to start your date range.
   * @param {number|Date} [query.toTime] - Epoch time to end your date range. Must be one week from
   * fromTime.
   * @param {Object} [opts] - Options.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Updated series ids.
   */
  async getUpdatedQueryParams(opts) {
    const { shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent.get('/updated/query/params'));

    return shouldReturnFullResponse ? res : res.body.data;
  }

  /**
   * GET /episodes/{id}
   *
   * @description Returns the full information for a given episode id.
   *
   * @async
   * @param {number} episodeId - ID of the episode.
   * @param {Object} [opts] - Options.
   * @param {string} [opts.language] - Override the language given in constructor.
   * @param {boolean} [opts.shouldReturnFullResponse] - Override constructor option.
   * @returns {Object} Episode data.
   */
  async getEpisode(episodeId, opts) {
    const e = encodeURIComponent;

    const { language, shouldReturnFullResponse } = {
      ...this.opts,
      ...opts,
    };

    const res = await this._doRequest(() => this.agent
      .get(`/episodes/${e(episodeId)}`)
      .set('Accept-Language', language || ''));

    return shouldReturnFullResponse ? res : res.body.data;
  }
}
