# DK Hawkshaw - Testing

This directory contains tests for the DK Hawkshaw server application.

## Test Structure

- `api/` - API endpoint tests
- `unit/` - Unit tests for individual components
- `integration/` - Integration tests
- `e2e/` - End-to-end tests
- `fixtures/` - Test fixtures and mock data
- `mocks/` - Mock implementations for testing

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Unit Tests

```bash
npm run test:unit
```

### Run API Tests

```bash
npm run test:api
```

### Run Integration Tests

```bash
npm run test:integration
```

### Run End-to-End Tests

```bash
npm run test:e2e
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Test Coverage Report

```bash
npm run test:coverage
```

## Test Environment

Tests run in a controlled environment with the following characteristics:

- **Database**: SQLite in-memory database
- **File Storage**: Local test directory
- **Environment Variables**: Loaded from `.env.test`
- **Logging**: Minimal output (errors only)

## Writing Tests

### Test Files

- Test files should be named with the pattern `*.test.js`
- Place test files next to the code they test or in the appropriate test directory

### Test Structure

```javascript
describe('Module Name', () => {
  // Setup before all tests
  beforeAll(async () => {
    // Setup code
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Cleanup code
  });

  describe('functionName', () => {
    it('should do something', async () => {
      // Test code
      expect(result).toBe(expected);
    });
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent of others
2. **Descriptive Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Follow the AAA pattern
4. **Mocks**: Use mocks for external dependencies
5. **Cleanup**: Always clean up test data

## Debugging Tests

To debug tests, you can use the following approaches:

1. **Debug Logs**: Use `console.log` or a proper logger
2. **Debugger**: Use Node.js debugger with `--inspect` flag
3. **VS Code**: Use the built-in debugger with the provided launch configuration

## Continuous Integration

Tests are automatically run in the CI/CD pipeline. Ensure all tests pass before merging to the main branch.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
