# DK Hawkshaw Server

Backend server for the DK Hawkshaw Android device management application.

## Features

### Core Features
- **Device Management**: Register, monitor, and control Android devices
- **Location Tracking**: Real-time GPS location tracking and history
- **Media Management**: Photo, video, and audio file uploads from devices
- **Contact & Call Logs**: Sync and manage contacts and call history
- **SMS Management**: Access and manage SMS messages

### Advanced Features
- **Screen Recording**: Capture and view device screens remotely
- **Live Screen Projection**: Real-time screen mirroring
- **App Updates**: Remote app deployment and version management
- **File Explorer**: Browse and manage device files
- **Accessibility Features**: Advanced device control and monitoring
- **Audio Recording**: Remote audio capture
- **Dynamic Configuration**: Update device settings remotely

### Security & Administration
- **Role-based Access Control**: Granular permissions for admins
- **JWT Authentication**: Secure token-based authentication
- **Admin Panel**: Comprehensive web interface
- **Real-time Updates**: WebSocket support for live monitoring
- **Activity Logs**: Detailed audit trails

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL with Sequelize ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate limiting
- **Frontend**: Bootstrap 5, Leaflet Maps
- **Logging**: Winston

## Installation

### Prerequisites

- Node.js 16+ 
- MySQL 8.0+
- Git

### Setup

1. **Clone and navigate to the server directory**
   ```bash
   cd "H:\Mobile app\DK Hawkshaw App Server"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   HOST=0.0.0.0

   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=hawkshaw_db
   DB_USER=hawkshaw_user
   DB_PASSWORD=your_secure_password
   DB_DIALECT=mysql

   # JWT Authentication
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h
   REFRESH_TOKEN_SECRET=your_refresh_secret
   REFRESH_TOKEN_EXPIRES_IN=7d

   # File Uploads
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=1073741824  # 1GB

   # App Updates
   APK_UPLOAD_DIR=./uploads/app-updates
   MAX_APK_SIZE=1073741824  # 1GB

   # Screen Features
   SCREEN_RECORDING_DIR=./uploads/screen-recordings
   MAX_SCREEN_RECORDING_SIZE=536870912  # 500MB

   # WebSocket
   WEBSOCKET_PATH=/socket.io
   WEBSOCKET_CORS_ORIGIN=*

   # Rate Limiting
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100

   # Logging
   LOG_LEVEL=info
   LOG_DIR=./logs
   ```

4. **Create MySQL database**
   ```sql
   CREATE DATABASE hawkshaw_db;
   CREATE USER 'hawkshaw_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON hawkshaw_db.* TO 'hawkshaw_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

5. **Initialize database**
   ```bash
   npm run init-db
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/device/register` - Device registration
- `POST /api/auth/device/heartbeat` - Device heartbeat

### Device Management
- `GET /api/devices` - List all devices (Admin)
- `GET /api/devices/:id` - Get device details (Admin)
- `PUT /api/devices/:id` - Update device (Admin)
- `DELETE /api/devices/:id` - Delete device (Admin)
- `GET /api/devices/:id/stats` - Get device statistics

### Location Tracking
- `POST /api/location` - Submit location data (Device)
- `POST /api/location/bulk` - Submit bulk location data (Device)
- `GET /api/location/device/:id` - Get device locations (Admin)
- `GET /api/location/latest` - Get latest locations (Admin)

### Screen Features
- `POST /api/screen-recordings/upload` - Upload screen recording
- `GET /api/screen-recordings` - List screen recordings
- `GET /api/screen-recordings/:id/download` - Download recording
- `POST /api/screen-projection/start` - Start screen projection
- `POST /api/screen-projection/stop` - Stop projection
- `POST /api/screen-projection/stream/:sessionId` - Stream frames

### App Updates
- `POST /api/app-updates/upload` - Upload new app version
- `GET /api/app-updates/check` - Check for updates
- `GET /api/app-updates/:id/download` - Download update
- `POST /api/app-updates/:id/report` - Report installation status

### File Management
- `POST /api/files/upload` - Upload files
- `GET /api/files` - List files
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Real-time Events
- `socket.io` WebSocket connection for:
  - `device-connected` - Device online status
  - `location-update` - Real-time location updates
  - `command-status` - Command execution updates
  - `screen-frame` - Live screen projection
  - `app-update` - Update notifications

### Media Files
- `POST /api/media/upload` - Upload media file (Device)
- `GET /api/media/device/:id` - Get device media files (Admin)
- `GET /api/media/download/:id` - Download media file (Admin)

### Commands
- `POST /api/admin/command` - Send command to device (Admin)
- `GET /api/admin/commands/pending` - Get pending commands (Device)
- `POST /api/admin/commands/:id/status` - Update command status (Device)

### Dashboard
- `GET /api/dashboard/overview` - Dashboard statistics (Admin)
- `GET /api/dashboard/health` - System health (Admin)

## Admin Panel

Access the admin panel at: `http://localhost:3000/admin`

Default credentials:
- Email: admin@hawkshaw.com
- Password: admin123

**Important**: Change the default password after first login!

## Device Commands

Available commands that can be sent to devices:

- `location_request` - Request current location
- `take_photo` - Capture photo with camera
- `record_audio` - Record audio
- `get_contacts` - Sync contacts
- `get_sms` - Sync SMS messages
- `get_call_logs` - Sync call logs
- `play_sound` - Play sound on device
- `vibrate` - Vibrate device
- `show_message` - Display message on device

## Security Features

- JWT authentication for all endpoints
- Rate limiting to prevent abuse
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention with Sequelize ORM
- File upload restrictions and validation

## Deployment

### Production Deployment

1. **Set environment to production**
   ```bash
   export NODE_ENV=production
   ```

2. **Configure production database**
   Update `.env` with production database credentials

3. **Use process manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name hawkshaw-server
   pm2 startup
   pm2 save
   ```

4. **Configure reverse proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **SSL Certificate (Let's Encrypt)**
   ```bash
   certbot --nginx -d your-domain.com
   ```

## Monitoring and Logs

- Application logs: `./logs/combined.log`
- Error logs: `./logs/error.log`
- Access logs via Morgan middleware
- Health check endpoint: `/health`

## Database Schema

The server uses the following main tables:
- `devices` - Device registration and status
- `users` - Admin users
- `locations` - GPS location data
- `media_files` - Uploaded media files
- `contacts` - Synced contacts
- `sms_messages` - SMS data
- `call_logs` - Call history
- `commands` - Device commands
- `device_info` - Device specifications
- `file_uploads` - General file uploads

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check MySQL service is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Port already in use**
   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:3000 | xargs kill -9`

3. **File upload fails**
   - Check upload directory permissions
   - Verify MAX_FILE_SIZE setting
   - Ensure enough disk space

4. **Device not connecting**
   - Verify server URL in Android app
   - Check firewall settings
   - Confirm JWT_SECRET matches

## Support

For issues and questions:
1. Check the logs in `./logs/` directory
2. Verify environment configuration
3. Test API endpoints with curl or Postman
4. Check database connectivity

## License

MIT License - see LICENSE file for details.
