# DK Hawkshaw API Documentation

## Base URL
```
https://your-api-url.com/api/v1
```

## Authentication
All endpoints require authentication using JWT tokens.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Models

### 1. Device
Represents a physical device registered with the system.

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Auto-incrementing ID |
| deviceId | STRING | Unique device identifier |
| name | STRING | Device name |
| nickname | STRING | User-defined nickname |
| model | STRING | Device model |
| manufacturer | STRING | Device manufacturer |
| os | STRING | Operating system |
| osVersion | STRING | OS version |
| isOnline | BOOLEAN | Online status |
| lastSeen | DATE | Last seen timestamp |
| userId | INTEGER | Reference to user |
| createdAt | DATE | Creation timestamp |
| updatedAt | DATE | Last update timestamp |

### 2. DeviceInfo
Extended device information.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| deviceId | STRING | Reference to devices table |
| hardwareInfo | JSON | Hardware specifications |
| softwareInfo | JSON | Software information |
| networkInfo | JSON | Network configuration |
| securityInfo | JSON | Security settings |
| installedApps | JSON | Installed applications |
| systemSettings | JSON | System settings |
| permissions | JSON | App permissions |
| createdAt | DATE | Creation timestamp |
| updatedAt | DATE | Last update timestamp |

### 3. AppUpdate
Manages app version updates.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| versionName | STRING | Version name (e.g., 1.0.0) |
| versionCode | INTEGER | Version code |
| isCritical | BOOLEAN | Critical update flag |
| filePath | STRING | Path to APK file |
| createdAt | DATE | Creation timestamp |
| updatedAt | DATE | Last update timestamp |

### 4. AppInstallation
Tracks app installations on devices.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| deviceId | STRING | Reference to devices table |
| packageName | STRING | App package name |
| versionName | STRING | Installed version |
| versionCode | INTEGER | Version code |
| isSystemApp | BOOLEAN | System app flag |
| metadata | JSON | Additional metadata |
| createdAt | DATE | Creation timestamp |
| updatedAt | DATE | Last update timestamp |

## API Endpoints

### Devices

#### Get All Devices
```
GET /devices
```

#### Get Device by ID
```
GET /devices/:deviceId
```

#### Update Device
```
PATCH /devices/:deviceId
```

### Device Info

#### Get Device Info
```
GET /devices/:deviceId/info
```

#### Update Device Info
```
PATCH /devices/:deviceId/info
```

### App Updates

#### Check for Updates
```
GET /updates/check
```

#### Get Update by ID
```
GET /updates/:updateId
```

### App Installations

#### Get Installed Apps
```
GET /devices/:deviceId/apps
```

#### Install App
```
POST /devices/:deviceId/apps/install
```

## WebSocket Events

### Device Connection
```json
{
  "event": "device_connected",
  "data": {
    "deviceId": "device123",
    "timestamp": "2023-11-09T12:00:00Z"
  }
}
```

### Command Execution
```json
{
  "event": "command_executed",
  "data": {
    "commandId": "cmd_123",
    "status": "completed",
    "timestamp": "2023-11-09T12:00:00Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "ValidationError",
  "message": "Invalid input data",
  "details": {
    "field": "Expected type"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "NotFound",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting
- 100 requests per minute per IP address
- 1000 requests per hour per user

## Versioning
API versioning is handled through the URL path (e.g., `/api/v1/...`).

## Changelog
- **2023-11-09**: Initial API documentation
- **2023-11-09**: Added device management endpoints
- **2023-11-09**: Added app update functionality
