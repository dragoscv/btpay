// This file is used for additional Jest setup

// Mock fetch globally
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
});

// Clean up after each test
afterEach(() => {
    jest.clearAllTimers();
});

// Clean up after all tests
afterAll(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});