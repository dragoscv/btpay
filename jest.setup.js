// This file is used for additional Jest setup

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});