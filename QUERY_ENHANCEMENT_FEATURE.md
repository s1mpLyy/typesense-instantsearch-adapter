# Query Enhancement Feature

## Overview

This feature adds the ability to enhance search queries through an external API before sending them to Typesense. This is particularly useful for:

- **Language Processing**: Normalizing Arabic text, handling diacritics, etc.
- **Query Expansion**: Adding synonyms or related terms
- **Spell Correction**: Fixing common typos
- **Domain-specific Understanding**: Custom query processing for specific industries

## Implementation Details

### Files Modified

1. **src/Configuration.js**

   - Added `queryEnhancement` configuration option
   - Defaults to disabled for backward compatibility
   - Configurable URL and timeout

2. **src/SearchRequestAdapter.js**

   - Added `_enhanceQuery()` method
   - Modified `_buildSearchParameters()` to use enhanced queries
   - Fixed `request()` method to properly await async operations

3. **src/TypesenseInstantsearchAdapter.js**
   - No changes needed (configuration flows through existing structure)

### Configuration

```javascript
{
  queryEnhancement: {
    enabled: false,     // Disabled by default
    url: "...",        // Enhancement API endpoint
    timeout: 5000      // Timeout in milliseconds
  }
}
```

### API Contract

The enhancement API should accept POST requests with:

```json
{
  "text": "original query"
}
```

And respond with:

```json
{
  "processed": "enhanced query",
  "original": "original query"
}
```

### Error Handling

- Network errors: Falls back to original query
- Timeouts: Falls back after 5 seconds (configurable)
- Invalid responses: Falls back to original query
- All errors are logged with `console.warn`

## Testing

### Unit Tests Added

1. **Basic functionality tests**

   - Empty/wildcard query handling
   - Successful enhancement
   - Configuration validation

2. **Error handling tests**

   - Network failures
   - Timeout handling
   - Invalid response format

3. **Integration tests**
   - Complete flow from input to Typesense
   - Concurrent request handling
   - Arabic text handling

### Test Coverage

All new code is covered by unit tests in:

- `test/SearchRequestAdapter.unit.test.js`
- `test/SearchRequestAdpater.test.js`

## Production Considerations

1. **Performance**

   - 5-second timeout prevents hanging requests
   - Concurrent requests supported
   - No caching implemented (could be added)

2. **Backward Compatibility**

   - Feature is disabled by default
   - No breaking changes to existing API
   - Existing configurations work unchanged

3. **Monitoring**
   - Errors logged to console
   - Could add metrics/telemetry if needed

## Example Usage

```javascript
const adapter = new TypesenseInstantSearchAdapter({
  server: {
    /* ... */
  },
  queryEnhancement: {
    enabled: true,
    url: "https://your-api.com/enhance",
    timeout: 3000,
  },
  additionalSearchParameters: {
    query_by: "name,description",
  },
});
```

## Future Enhancements

1. **Caching**: Cache enhanced queries to reduce API calls
2. **Batch Processing**: Enhance multiple queries in one request
3. **Custom Headers**: Support authentication headers
4. **Retry Logic**: Implement exponential backoff
5. **Analytics**: Track enhancement success rates
