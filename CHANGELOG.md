# Changelog

## [2.9.1-3] - 2024-01-XX

### Added

- Query Enhancement Feature (Beta): Support for enhancing search queries through an external API before sending them to Typesense
  - Configurable enhancement endpoint URL and timeout
  - Automatic fallback to original query on enhancement failure
  - Disabled by default for backward compatibility
  - Particularly useful for multi-language support, query expansion, and spell correction

### Changed

- Modified `SearchRequestAdapter` to support async query enhancement
- Updated `request()` method to properly await all search parameter builds

### Technical Details

- Added `queryEnhancement` configuration option with `enabled`, `url`, and `timeout` properties
- Implemented `_enhanceQuery()` method with proper error handling and timeout management
- Added comprehensive test coverage for the enhancement feature
