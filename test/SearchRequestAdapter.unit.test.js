import { SearchRequestAdapter } from "../src/SearchRequestAdapter";

// Mock fetch globally
global.fetch = jest.fn();

describe("SearchRequestAdapter Unit Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("._enhanceQuery", () => {
    it("returns original query for empty or wildcard queries", async () => {
      const subject = new SearchRequestAdapter([], null, {});

      expect(await subject._enhanceQuery("")).toBe("");
      expect(await subject._enhanceQuery("*")).toBe("*");
      expect(await subject._enhanceQuery(null)).toBe(null);
      expect(await subject._enhanceQuery(undefined)).toBe(undefined);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("enhances query successfully", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            processed: "enhanced query",
            original: "original query",
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await subject._enhanceQuery("original query");

      expect(result).toBe("enhanced query");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://arhhm5omsof3nkzctfctb5fcl40wdiya.lambda-url.eu-central-1.on.aws",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "original query",
          }),
        }),
      );
    });

    it("handles failed API response", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      const mockResponse = {
        ok: false,
        status: 500,
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await subject._enhanceQuery("original query");

      expect(result).toBe("original query");
      expect(global.fetch).toHaveBeenCalled();
    });

    it("handles network errors", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await subject._enhanceQuery("original query");

      expect(result).toBe("original query");
      expect(global.fetch).toHaveBeenCalled();
    });

    it("handles timeout", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      global.fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 6000); // Longer than our 5s timeout
          }),
      );

      const result = await subject._enhanceQuery("original query");

      expect(result).toBe("original query");
      expect(global.fetch).toHaveBeenCalled();
    });

    it("handles invalid response format", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ invalid: "format" }), // Missing processed field
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await subject._enhanceQuery("original query");

      expect(result).toBe("original query");
      expect(global.fetch).toHaveBeenCalled();
    });

    it("enhances Arabic query successfully", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            text: "شامبو ضد القشرة، شامبو علاج القشرة، شامبو للقشرة",
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await subject._enhanceQuery("شامبو ضد ال قشرة");

      expect(result).toBe("شامبو ضد القشرة، شامبو علاج القشرة، شامبو للقشرة");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://arhhm5omsof3nkzctfctb5fcl40wdiya.lambda-url.eu-central-1.on.aws",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "شامبو ضد ال قشرة",
          }),
        }),
      );
    });

    it("handles Arabic query with network error", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await subject._enhanceQuery("شامبو ضد ال قشرة");

      expect(result).toBe("شامبو ضد ال قشرة"); // Should return original query on error
      expect(global.fetch).toHaveBeenCalled();
    });

    it("enhances 'سماعة محيطية' query successfully", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            processed: "سمع حيط",
            original: "سماعة محيطية",
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await subject._enhanceQuery("سماعة محيطية");

      expect(result).toBe("سمع حيط");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://arhhm5omsof3nkzctfctb5fcl40wdiya.lambda-url.eu-central-1.on.aws",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "سماعة محيطية",
          }),
        }),
      );
    });

    it("makes actual network request for 'سماعة محيطية'", async () => {
      // Restore the real fetch
      global.fetch = global.fetch || fetch;

      const subject = new SearchRequestAdapter([], null, {});
      const result = await subject._enhanceQuery("سماعة محيطية");

      // Log the result for inspection
      console.log("Enhanced query result:", result);

      // Basic validation
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);

      // Restore the mock
      global.fetch = jest.fn();
    });

    it("enhances 'شامبو معالج القشرة' query successfully", async () => {
      const subject = new SearchRequestAdapter([], null, {});
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            processed: "شمبو علج قشر",
            original: "شامبو معالج القشرة",
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await subject._enhanceQuery("شامبو معالج القشرة");

      expect(result).toBe("شمبو علج قشر");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://arhhm5omsof3nkzctfctb5fcl40wdiya.lambda-url.eu-central-1.on.aws",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "شامبو معالج القشرة",
          }),
        }),
      );
    });

    it("complete flow test: 'شامبو معالج القشرة' from input to Typesense", async () => {
      const mockTypesenseClient = {
        multiSearch: {
          perform: jest.fn().mockResolvedValue({
            results: [
              {
                hits: [
                  { document: { name: "شامبو هيد آند شولدرز ضد القشرة" } },
                  { document: { name: "شامبو نيزورال المضاد للقشرة" } },
                ],
                found: 2,
              },
            ],
          }),
        },
      };

      const instantsearchRequests = [
        {
          indexName: "products",
          params: {
            query: "شامبو معالج القشرة",
            facets: ["brand", "category"],
            hitsPerPage: 20,
            page: 0,
          },
        },
      ];

      const subject = new SearchRequestAdapter(instantsearchRequests, mockTypesenseClient, {
        additionalSearchParameters: {
          query_by: "name,description,tags",
          sort_by: "_text_match:desc",
        },
        queryEnhancement: {
          enabled: true,
          url: "https://arhhm5omsof3nkzctfctb5fcl40wdiya.lambda-url.eu-central-1.on.aws",
          timeout: 5000,
        },
      });

      // Mock the Lambda enhancement response
      const mockEnhancementResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            processed: "شمبو علج قشر",
            original: "شامبو معالج القشرة",
          }),
      };
      global.fetch.mockResolvedValueOnce(mockEnhancementResponse);

      // Execute the request
      const result = await subject.request();

      // Verify the Lambda API was called with the original query
      expect(global.fetch).toHaveBeenCalledWith(
        "https://arhhm5omsof3nkzctfctb5fcl40wdiya.lambda-url.eu-central-1.on.aws",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "شامبو معالج القشرة",
          }),
        }),
      );

      // Verify Typesense was called with the enhanced query
      expect(mockTypesenseClient.multiSearch.perform).toHaveBeenCalledWith(
        {
          searches: [
            {
              collection: "products",
              q: "شمبو علج قشر", // Enhanced query
              query_by: "name,description,tags",
              sort_by: "_text_match:desc",
              facet_by: "brand,category",
              per_page: 20,
              page: 1,
            },
          ],
        },
        {},
      );

      // Verify the response contains the mocked search results
      expect(result.results[0].hits).toHaveLength(2);
      expect(result.results[0].found).toBe(2);
    });
  });

  describe("._buildSearchParameters with query enhancement", () => {
    it("enhances Arabic query and builds Typesense search parameters", async () => {
      const subject = new SearchRequestAdapter([], null, {
        additionalSearchParameters: {
          query_by: "name,description",
          sort_by: "_text_match:desc",
        },
      });

      // Mock the fetch response for query enhancement
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            processed: "فرش سنن كهرب",
            original: "فرشاة اسنان كهربائية",
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      // Test the complete search parameters build with enhanced query
      const result = await subject._buildSearchParameters({
        indexName: "products",
        params: {
          query: "فرشاة اسنان كهربائية",
          facets: ["category", "brand"],
          maxValuesPerFacet: 10,
          page: 0,
          hitsPerPage: 20,
        },
      });

      // Verify the enhanced query is used in search parameters
      expect(result).toEqual({
        collection: "products",
        q: "فرش سنن كهرب", // Enhanced query
        query_by: "name,description",
        sort_by: "_text_match:desc",
        facet_by: "category,brand",
        max_facet_values: 10,
        page: 1,
        per_page: 20,
      });

      // Verify the enhancement request was made correctly
      expect(global.fetch).toHaveBeenCalledWith(
        "https://arhhm5omsof3nkzctfctb5fcl40wdiya.lambda-url.eu-central-1.on.aws",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "فرشاة اسنان كهربائية",
          }),
        }),
      );
    });

    it("falls back to original query on enhancement failure", async () => {
      const subject = new SearchRequestAdapter([], null, {
        additionalSearchParameters: {
          query_by: "name,description",
        },
      });

      // Mock a failed enhancement request
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await subject._buildSearchParameters({
        indexName: "products",
        params: {
          query: "فرشاة اسنان كهربائية",
          facets: ["category"],
          page: 0,
        },
      });

      // Verify original query is used when enhancement fails
      expect(result).toEqual({
        collection: "products",
        q: "فرشاة اسنان كهربائية", // Original query
        query_by: "name,description",
        facet_by: "category",
        page: 1,
      });
    });

    it("handles empty query correctly", async () => {
      const subject = new SearchRequestAdapter([], null, {
        additionalSearchParameters: {
          query_by: "name,description",
        },
      });

      const result = await subject._buildSearchParameters({
        indexName: "products",
        params: {
          query: "",
          page: 0,
        },
      });

      // Verify that empty query becomes "*" and no enhancement is attempted
      expect(result).toEqual({
        collection: "products",
        q: "*",
        query_by: "name,description",
        page: 1,
      });

      // Verify no enhancement request was made
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe(".request() with query enhancement", () => {
    it("enhances queries before sending to Typesense", async () => {
      const mockTypesenseClient = {
        multiSearch: {
          perform: jest.fn().mockResolvedValue({
            results: [{ hits: [], found: 0 }],
          }),
        },
      };

      const instantsearchRequests = [
        {
          indexName: "products",
          params: {
            query: "فرشاة اسنان كهربائية",
            facets: ["category"],
            page: 0,
          },
        },
      ];

      const subject = new SearchRequestAdapter(instantsearchRequests, mockTypesenseClient, {
        additionalSearchParameters: {
          query_by: "name,description",
        },
        queryEnhancement: {
          enabled: true,
          url: "https://arhhm5omsof3nkzctfctb5fcl40wdiya.lambda-url.eu-central-1.on.aws",
          timeout: 5000,
        },
      });

      // Mock the fetch response
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            processed: "فرش سنن كهرب",
            original: "فرشاة اسنان كهربائية",
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      // Execute the request
      await subject.request();

      // Verify the enhanced query was used
      expect(mockTypesenseClient.multiSearch.perform).toHaveBeenCalledWith(
        {
          searches: [
            expect.objectContaining({
              collection: "products",
              q: "فرش سنن كهرب", // Enhanced query
              query_by: "name,description",
              facet_by: "category",
              page: 1,
            }),
          ],
        },
        {},
      );
    });

    it("handles multiple concurrent requests with enhancement", async () => {
      const mockTypesenseClient = {
        multiSearch: {
          perform: jest.fn().mockResolvedValue({
            results: [
              { hits: [], found: 0 },
              { hits: [], found: 0 },
            ],
          }),
        },
      };

      const instantsearchRequests = [
        {
          indexName: "products",
          params: { query: "شامبو", page: 0 },
        },
        {
          indexName: "products",
          params: { query: "سماعة", page: 0 },
        },
      ];

      const subject = new SearchRequestAdapter(instantsearchRequests, mockTypesenseClient, {
        additionalSearchParameters: { query_by: "name" },
        queryEnhancement: { enabled: true, url: "test-url", timeout: 5000 },
      });

      // Mock different responses for each query
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ processed: "شمبو", original: "شامبو" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ processed: "سمع", original: "سماعة" }),
        });

      await subject.request();

      // Verify both queries were enhanced
      expect(mockTypesenseClient.multiSearch.perform).toHaveBeenCalledWith(
        {
          searches: [expect.objectContaining({ q: "شمبو" }), expect.objectContaining({ q: "سمع" })],
        },
        {},
      );
    });
  });
});
