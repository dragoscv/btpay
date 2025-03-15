# Changelog

All notable changes to the BTPay library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2023-11-15

### Added

- React hooks for easier integration with React applications (`useBTPay`)
- Token refresh functionality to automatically renew authentication tokens
- Configurable logging system with different log levels
- Expanded error handling with specialized error types
- Additional tests for new functionality

### Changed

- Enhanced BTPay class with improved error handling
- Updated documentation to include React hooks usage

## [0.2.0] - 2023-10-30

### Added

- Initial project setup
- Core API client functionality
- TypeScript type definitions for API models
- Documentation foundation

## [0.1.0] - 2023-10-01

### Added

- Basic payment initiation for RON payments
- Payment status checking
- OAuth2 authentication handling
- TypeScript interfaces matching API models
- Error handling for common API responses

### Known Issues

- Limited support for bulk payments
- No persistent token storage implementation
