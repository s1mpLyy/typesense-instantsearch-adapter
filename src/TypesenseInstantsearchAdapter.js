"use strict";

import { Configuration } from "./Configuration";
import { SearchClient as TypesenseSearchClient } from "typesense";
import { SearchRequestAdapter } from "./SearchRequestAdapter";
import { SearchResponseAdapter } from "./SearchResponseAdapter";
import { FacetSearchResponseAdapter } from "./FacetSearchResponseAdapter";

export default class TypesenseInstantsearchAdapter {
  constructor(options) {
    this.updateConfiguration(options);
    this.queryEnhancementCache = new Map();
    this.searchClient = {
      clearCache: () => this.clearCache(),
      search: (instantsearchRequests) => this.searchTypesenseAndAdapt(instantsearchRequests),
      searchForFacetValues: (instantsearchRequests) =>
        this.searchTypesenseForFacetValuesAndAdapt(instantsearchRequests),
    };
  }

  /**
   * Enhances a search query by calling an external API
   */
  async _enhanceQuery(query) {
    if (!query || query === "*") {
      return query;
    }

    // Check if query enhancement is enabled
    if (!this.configuration.queryEnhancement?.enabled) {
      return query;
    }

    // Check cache first
    if (this.queryEnhancementCache.has(query)) {
      return this.queryEnhancementCache.get(query);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.configuration.queryEnhancement.timeout || 5000);

      const response = await fetch(this.configuration.queryEnhancement.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: query,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.processed) {
        // Cache the enhanced query
        this.queryEnhancementCache.set(query, data.processed);
        return data.processed;
      }

      // Cache the original query if no enhancement
      this.queryEnhancementCache.set(query, query);
      return query;
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn(
          `[Typesense-Instantsearch-Adapter] Query enhancement timed out after ${this.configuration.queryEnhancement.timeout || 5000}ms`,
        );
      } else {
        console.warn("[Typesense-Instantsearch-Adapter] Query enhancement failed:", error.message);
      }
      // Cache the original query on error
      this.queryEnhancementCache.set(query, query);
      return query;
    }
  }

  async _enhanceSearchRequests(instantsearchRequests) {
    // Get all unique queries from all requests
    const allQueries = instantsearchRequests
      .map((req) => req.params.query)
      .filter((query) => query && query !== "" && query !== "*");

    if (allQueries.length === 0) {
      return instantsearchRequests; // No enhancement needed
    }

    const uniqueQueries = [...new Set(allQueries)];

    // Enhance all unique queries in parallel
    const enhancementPromises = uniqueQueries.map(async (query) => {
      const enhancedQuery = await this._enhanceQuery(query);
      return { original: query, enhanced: enhancedQuery };
    });

    const enhancements = await Promise.all(enhancementPromises);
    const queryMap = new Map(enhancements.map((e) => [e.original, e.enhanced]));

    // Update all requests with enhanced queries
    return instantsearchRequests.map((req) => {
      if (req.params.query && req.params.query !== "" && req.params.query !== "*") {
        const enhancedQuery = queryMap.get(req.params.query);
        if (enhancedQuery && enhancedQuery !== req.params.query) {
          return {
            ...req,
            params: {
              ...req.params,
              query: enhancedQuery,
            },
          };
        }
      }
      return req;
    });
  }

  async searchTypesenseAndAdapt(instantsearchRequests) {
    let typesenseResponse;
    try {
      // Enhance queries before processing
      const enhancedRequests = await this._enhanceSearchRequests(instantsearchRequests);

      typesenseResponse = await this._adaptAndPerformTypesenseRequest(enhancedRequests);

      const adaptedResponses = typesenseResponse.results.map((typesenseResult, index) => {
        this._validateTypesenseResult(typesenseResult);
        const responseAdapter = new SearchResponseAdapter(
          typesenseResult,
          instantsearchRequests[index], // Use original requests for response mapping
          this.configuration,
          typesenseResponse.results,
          typesenseResponse,
        );
        let adaptedResponse = responseAdapter.adapt();

        return adaptedResponse;
      });

      return {
        results: adaptedResponses,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async searchTypesenseForFacetValuesAndAdapt(instantsearchRequests) {
    let typesenseResponse;
    try {
      typesenseResponse = await this._adaptAndPerformTypesenseRequest(instantsearchRequests);

      const adaptedResponses = typesenseResponse.results.map((typesenseResult, index) => {
        this._validateTypesenseResult(typesenseResult);
        const responseAdapter = new FacetSearchResponseAdapter(
          typesenseResult,
          instantsearchRequests[index],
          this.configuration,
        );
        return responseAdapter.adapt();
      });

      return adaptedResponses;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async _adaptAndPerformTypesenseRequest(instantsearchRequests) {
    const requestAdapter = new SearchRequestAdapter(instantsearchRequests, this.typesenseClient, this.configuration);
    const typesenseResponse = await requestAdapter.request();
    return typesenseResponse;
  }

  clearCache() {
    this.typesenseClient = new TypesenseSearchClient(this.configuration.server);
    this.queryEnhancementCache.clear();
    return this.searchClient;
  }

  updateConfiguration(options) {
    this.configuration = new Configuration(options);
    this.configuration.validate();
    this.typesenseClient = new TypesenseSearchClient(this.configuration.server);
    return true;
  }

  _validateTypesenseResult(typesenseResult) {
    if (typesenseResult.error) {
      throw new Error(`${typesenseResult.code} - ${typesenseResult.error}`);
    }
    if (!typesenseResult.hits && !typesenseResult.grouped_hits) {
      throw new Error(`Did not find any hits. ${typesenseResult.code} - ${typesenseResult.error}`);
    }
  }
}
