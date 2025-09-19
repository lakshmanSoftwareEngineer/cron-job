# Website Monitor - Cron Job Application

A Node.js Express application that monitors a target website (localhost:3000 by default) every minute and logs success/failure responses. Designed to be deployed on Vercel with serverless functions and cron jobs.

## Features

- 🕐 **Automated Monitoring**: Checks target website every minute using Vercel Cron Jobs
- 📊 **Comprehensive Logging**: Detailed success/failure logs with timestamps and response times
- 🚀 **Vercel Ready**: Configured for seamless Vercel deployment with serverless functions
- 📈 **Status Dashboard**: API endpoints to view logs, status, and statistics
- 🔧 **Manual Testing**: Trigger manual checks via API endpoints
- 🏥 **Health Checks**: Built-in health monitoring endpoints

## Project Structure

```
├── api/
│   ├── index.js      # Main API endpoints
│   └── cron.js       # Cron job handler
├── server.js         # Local development server
├── package.json      # Dependencies and scripts
├── vercel.json       # Vercel deployment configuration
└── README.md         # This file
```

## API Endpoints

### Main Endpoints

- `GET /` or `GET /api` - API information and available endpoints
- `POST /api/check` - Trigger manual website check
- `GET /api/logs` - Get monitoring logs (query param: `?limit=50`)
- `GET /api/status` - Get monitoring statistics and recent logs
- `GET /api/health` - Health check endpoint

### Example Responses

**GET /api/status**

```json
{
  "totalChecks": 100,
  "successCount": 95,
  "errorCount": 5,
  "successRate": "95.00%",
  "latestLogs": [...],
  "lastCheckTime": "2025-09-19T10:30:00.000Z"
}
```

**POST /api/check**

```json
{
  "message": "Manual check completed",
  "result": {
    "timestamp": "2025-09-19T10:30:00.000Z",
    "type": "SUCCESS",
    "message": "✅ SUCCESS: Website loaded successfully - Status: 200, Response time: 150ms"
  },
  "targetUrl": "http://localhost:3000"
}
```

## Local Development

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start Development Server**:

   ```bash
   npm run dev
   ```

3. **Start Production Server**:
   ```bash
   npm start
   ```

The local server will run on port 3001 (configurable via PORT environment variable) and will automatically start monitoring localhost:3000 every minute.

## Vercel Deployment

### Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed
- Vercel account

### Deployment Steps

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy to Vercel**:

   ```bash
   vercel
   ```

4. **Set Environment Variables** (optional):
   ```bash
   vercel env add TARGET_URL
   vercel env add CRON_SECRET
   ```

### Environment Variables

| Variable      | Description                        | Default                 | Required |
| ------------- | ---------------------------------- | ----------------------- | -------- |
| `TARGET_URL`  | URL to monitor                     | `http://localhost:3000` | No       |
| `CRON_SECRET` | Secret for cron job authentication | -                       | No       |
| `NODE_ENV`    | Environment mode                   | `production`            | No       |

### Vercel Configuration

The `vercel.json` file includes:

- **Serverless Functions**: API routes as serverless functions
- **Cron Jobs**: Automated execution every minute
- **Environment Variables**: Production configuration

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "* * * * *"
    }
  ]
}
```

## Monitoring and Logging

### Log Types

- **SUCCESS**: Website loaded successfully (HTTP 2xx)
- **WARNING**: Website responded but with non-success status
- **ERROR**: Failed to load website (connection issues, timeouts)
- **INFO**: General information messages

### Log Format

```json
{
  "timestamp": "2025-09-19T10:30:00.000Z",
  "type": "SUCCESS",
  "message": "✅ SUCCESS: Website loaded successfully - Status: 200, Response time: 150ms"
}
```

## Usage Examples

### Manual Website Check

```bash
curl -X POST https://your-app.vercel.app/api/check \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Get Recent Logs

```bash
curl https://your-app.vercel.app/api/logs?limit=10
```

### Check Status

```bash
curl https://your-app.vercel.app/api/status
```

## Error Handling

The application handles various error scenarios:

- **Connection Refused**: Target server is down
- **Timeout**: Request takes longer than 10 seconds
- **DNS Issues**: Host not found
- **HTTP Errors**: 4xx and 5xx status codes

## Limitations

- **Memory Storage**: Logs are stored in memory (consider database for production)
- **Log Retention**: Only keeps last 100 logs to prevent memory issues
- **Vercel Limits**: Subject to Vercel's serverless function and cron job limits

## Troubleshooting

### Common Issues

1. **Cron Jobs Not Running**:

   - Ensure your Vercel plan supports cron jobs
   - Check Vercel dashboard for cron job logs

2. **Connection Errors**:

   - Verify the target URL is accessible
   - Check firewall and network settings

3. **Memory Issues**:
   - Logs are automatically trimmed to last 100 entries
   - Consider implementing database storage for production

### Debug Mode

Enable debug logging by checking Vercel function logs in your dashboard.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
