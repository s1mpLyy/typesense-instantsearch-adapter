"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _Configuration = require("./Configuration");
var _typesense = require("typesense");
var _SearchRequestAdapter = require("./SearchRequestAdapter");
var _SearchResponseAdapter = require("./SearchResponseAdapter");
var _FacetSearchResponseAdapter = require("./FacetSearchResponseAdapter");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var TypesenseInstantsearchAdapter = exports["default"] = /*#__PURE__*/function () {
  function TypesenseInstantsearchAdapter(options) {
    var _this = this;
    (0, _classCallCheck2["default"])(this, TypesenseInstantsearchAdapter);
    this.updateConfiguration(options);
    this.queryEnhancementCache = new Map();
    this.queryEnhancementPromises = new Map(); // Cache for ongoing promises
    this.searchClient = {
      clearCache: function clearCache() {
        return _this.clearCache();
      },
      search: function search(instantsearchRequests) {
        return _this.searchTypesenseAndAdapt(instantsearchRequests);
      },
      searchForFacetValues: function searchForFacetValues(instantsearchRequests) {
        return _this.searchTypesenseForFacetValuesAndAdapt(instantsearchRequests);
      }
    };
  }

  /**
   * Enhances a search query by calling an external API
   */
  return (0, _createClass2["default"])(TypesenseInstantsearchAdapter, [{
    key: "_enhanceQuery",
    value: (function () {
      var _enhanceQuery2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(query) {
        var _this$configuration$q;
        var enhancementPromise, result;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (!(!query || query === "*")) {
                _context.next = 2;
                break;
              }
              return _context.abrupt("return", query);
            case 2:
              if ((_this$configuration$q = this.configuration.queryEnhancement) !== null && _this$configuration$q !== void 0 && _this$configuration$q.enabled) {
                _context.next = 4;
                break;
              }
              return _context.abrupt("return", query);
            case 4:
              if (!this.queryEnhancementCache.has(query)) {
                _context.next = 7;
                break;
              }
              console.debug("[Query Enhancement] Using cached result for: \"".concat(query, "\""));
              return _context.abrupt("return", this.queryEnhancementCache.get(query));
            case 7:
              if (!this.queryEnhancementPromises.has(query)) {
                _context.next = 12;
                break;
              }
              console.debug("[Query Enhancement] Waiting for ongoing request for: \"".concat(query, "\""));
              _context.next = 11;
              return this.queryEnhancementPromises.get(query);
            case 11:
              return _context.abrupt("return", _context.sent);
            case 12:
              console.debug("[Query Enhancement] Making API call for: \"".concat(query, "\""));

              // Create and cache the promise
              enhancementPromise = this._performQueryEnhancement(query);
              this.queryEnhancementPromises.set(query, enhancementPromise);
              _context.prev = 15;
              _context.next = 18;
              return enhancementPromise;
            case 18:
              result = _context.sent;
              // Cache the result
              this.queryEnhancementCache.set(query, result);
              return _context.abrupt("return", result);
            case 21:
              _context.prev = 21;
              // Remove the promise from cache once completed
              this.queryEnhancementPromises["delete"](query);
              return _context.finish(21);
            case 24:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[15,, 21, 24]]);
      }));
      function _enhanceQuery(_x) {
        return _enhanceQuery2.apply(this, arguments);
      }
      return _enhanceQuery;
    }()
    /**
     * Performs the actual API call for query enhancement
     */
    )
  }, {
    key: "_performQueryEnhancement",
    value: (function () {
      var _performQueryEnhancement2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(query) {
        var controller, timeoutId, response, data;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              controller = new AbortController();
              timeoutId = setTimeout(function () {
                return controller.abort();
              }, this.configuration.queryEnhancement.timeout || 5000);
              _context2.next = 5;
              return fetch(this.configuration.queryEnhancement.url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  text: query
                }),
                signal: controller.signal
              });
            case 5:
              response = _context2.sent;
              clearTimeout(timeoutId);
              if (response.ok) {
                _context2.next = 9;
                break;
              }
              throw new Error("HTTP error! status: ".concat(response.status));
            case 9:
              _context2.next = 11;
              return response.json();
            case 11:
              data = _context2.sent;
              if (!(data && data.processed)) {
                _context2.next = 15;
                break;
              }
              console.debug("[Query Enhancement] API success: \"".concat(query, "\" -> \"").concat(data.processed, "\""));
              return _context2.abrupt("return", data.processed);
            case 15:
              console.debug("[Query Enhancement] No enhancement returned for: \"".concat(query, "\""));
              return _context2.abrupt("return", query);
            case 19:
              _context2.prev = 19;
              _context2.t0 = _context2["catch"](0);
              if (_context2.t0.name === "AbortError") {
                console.warn("[Typesense-Instantsearch-Adapter] Query enhancement timed out after ".concat(this.configuration.queryEnhancement.timeout || 5000, "ms"));
              } else {
                console.warn("[Typesense-Instantsearch-Adapter] Query enhancement failed:", _context2.t0.message);
              }
              // Return original query on error
              return _context2.abrupt("return", query);
            case 23:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[0, 19]]);
      }));
      function _performQueryEnhancement(_x2) {
        return _performQueryEnhancement2.apply(this, arguments);
      }
      return _performQueryEnhancement;
    }())
  }, {
    key: "_enhanceSearchRequests",
    value: function () {
      var _enhanceSearchRequests2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(instantsearchRequests) {
        var _this2 = this;
        var allQueries, uniqueQueries, enhancementPromises, enhancements, queryMap;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              // Get all unique queries from all requests
              allQueries = instantsearchRequests.map(function (req) {
                return req.params.query;
              }).filter(function (query) {
                return query && query !== "" && query !== "*";
              });
              if (!(allQueries.length === 0)) {
                _context4.next = 3;
                break;
              }
              return _context4.abrupt("return", instantsearchRequests);
            case 3:
              uniqueQueries = (0, _toConsumableArray2["default"])(new Set(allQueries));
              console.debug("[Query Enhancement] Processing ".concat(instantsearchRequests.length, " requests with ").concat(uniqueQueries.length, " unique queries:"), uniqueQueries);

              // Enhance all unique queries in parallel
              enhancementPromises = uniqueQueries.map( /*#__PURE__*/function () {
                var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(query) {
                  var enhancedQuery;
                  return _regenerator["default"].wrap(function _callee3$(_context3) {
                    while (1) switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return _this2._enhanceQuery(query);
                      case 2:
                        enhancedQuery = _context3.sent;
                        return _context3.abrupt("return", {
                          original: query,
                          enhanced: enhancedQuery
                        });
                      case 4:
                      case "end":
                        return _context3.stop();
                    }
                  }, _callee3);
                }));
                return function (_x4) {
                  return _ref.apply(this, arguments);
                };
              }());
              _context4.next = 8;
              return Promise.all(enhancementPromises);
            case 8:
              enhancements = _context4.sent;
              queryMap = new Map(enhancements.map(function (e) {
                return [e.original, e.enhanced];
              })); // Update all requests with enhanced queries
              return _context4.abrupt("return", instantsearchRequests.map(function (req) {
                if (req.params.query && req.params.query !== "" && req.params.query !== "*") {
                  var enhancedQuery = queryMap.get(req.params.query);
                  if (enhancedQuery && enhancedQuery !== req.params.query) {
                    return _objectSpread(_objectSpread({}, req), {}, {
                      params: _objectSpread(_objectSpread({}, req.params), {}, {
                        query: enhancedQuery
                      })
                    });
                  }
                }
                return req;
              }));
            case 11:
            case "end":
              return _context4.stop();
          }
        }, _callee4);
      }));
      function _enhanceSearchRequests(_x3) {
        return _enhanceSearchRequests2.apply(this, arguments);
      }
      return _enhanceSearchRequests;
    }()
  }, {
    key: "searchTypesenseAndAdapt",
    value: function () {
      var _searchTypesenseAndAdapt = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(instantsearchRequests) {
        var _this3 = this;
        var typesenseResponse, enhancedRequests, adaptedResponses;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              _context5.next = 3;
              return this._enhanceSearchRequests(instantsearchRequests);
            case 3:
              enhancedRequests = _context5.sent;
              _context5.next = 6;
              return this._adaptAndPerformTypesenseRequest(enhancedRequests);
            case 6:
              typesenseResponse = _context5.sent;
              adaptedResponses = typesenseResponse.results.map(function (typesenseResult, index) {
                _this3._validateTypesenseResult(typesenseResult);
                var responseAdapter = new _SearchResponseAdapter.SearchResponseAdapter(typesenseResult, instantsearchRequests[index],
                // Use original requests for response mapping
                _this3.configuration, typesenseResponse.results, typesenseResponse);
                var adaptedResponse = responseAdapter.adapt();
                return adaptedResponse;
              });
              return _context5.abrupt("return", {
                results: adaptedResponses
              });
            case 11:
              _context5.prev = 11;
              _context5.t0 = _context5["catch"](0);
              console.error(_context5.t0);
              throw _context5.t0;
            case 15:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this, [[0, 11]]);
      }));
      function searchTypesenseAndAdapt(_x5) {
        return _searchTypesenseAndAdapt.apply(this, arguments);
      }
      return searchTypesenseAndAdapt;
    }()
  }, {
    key: "searchTypesenseForFacetValuesAndAdapt",
    value: function () {
      var _searchTypesenseForFacetValuesAndAdapt = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(instantsearchRequests) {
        var _this4 = this;
        var typesenseResponse, enhancedRequests, adaptedResponses;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.prev = 0;
              _context6.next = 3;
              return this._enhanceSearchRequests(instantsearchRequests);
            case 3:
              enhancedRequests = _context6.sent;
              _context6.next = 6;
              return this._adaptAndPerformTypesenseRequest(enhancedRequests);
            case 6:
              typesenseResponse = _context6.sent;
              adaptedResponses = typesenseResponse.results.map(function (typesenseResult, index) {
                _this4._validateTypesenseResult(typesenseResult);
                var responseAdapter = new _FacetSearchResponseAdapter.FacetSearchResponseAdapter(typesenseResult, instantsearchRequests[index],
                // Use original requests for response mapping
                _this4.configuration);
                return responseAdapter.adapt();
              });
              return _context6.abrupt("return", adaptedResponses);
            case 11:
              _context6.prev = 11;
              _context6.t0 = _context6["catch"](0);
              console.error(_context6.t0);
              throw _context6.t0;
            case 15:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this, [[0, 11]]);
      }));
      function searchTypesenseForFacetValuesAndAdapt(_x6) {
        return _searchTypesenseForFacetValuesAndAdapt.apply(this, arguments);
      }
      return searchTypesenseForFacetValuesAndAdapt;
    }()
  }, {
    key: "_adaptAndPerformTypesenseRequest",
    value: function () {
      var _adaptAndPerformTypesenseRequest2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(instantsearchRequests) {
        var requestAdapter, typesenseResponse;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              requestAdapter = new _SearchRequestAdapter.SearchRequestAdapter(instantsearchRequests, this.typesenseClient, this.configuration);
              _context7.next = 3;
              return requestAdapter.request();
            case 3:
              typesenseResponse = _context7.sent;
              return _context7.abrupt("return", typesenseResponse);
            case 5:
            case "end":
              return _context7.stop();
          }
        }, _callee7, this);
      }));
      function _adaptAndPerformTypesenseRequest(_x7) {
        return _adaptAndPerformTypesenseRequest2.apply(this, arguments);
      }
      return _adaptAndPerformTypesenseRequest;
    }()
  }, {
    key: "clearCache",
    value: function clearCache() {
      this.typesenseClient = new _typesense.SearchClient(this.configuration.server);
      this.queryEnhancementCache.clear();
      this.queryEnhancementPromises.clear();
      return this.searchClient;
    }
  }, {
    key: "updateConfiguration",
    value: function updateConfiguration(options) {
      this.configuration = new _Configuration.Configuration(options);
      this.configuration.validate();
      this.typesenseClient = new _typesense.SearchClient(this.configuration.server);
      return true;
    }
  }, {
    key: "_validateTypesenseResult",
    value: function _validateTypesenseResult(typesenseResult) {
      if (typesenseResult.error) {
        throw new Error("".concat(typesenseResult.code, " - ").concat(typesenseResult.error));
      }
      if (!typesenseResult.hits && !typesenseResult.grouped_hits) {
        throw new Error("Did not find any hits. ".concat(typesenseResult.code, " - ").concat(typesenseResult.error));
      }
    }
  }]);
}();
//# sourceMappingURL=TypesenseInstantsearchAdapter.js.map