# Health Check Endpoints

Production-ready health check endpoints for monitoring API availability and database connectivity.

## Endpoints

### GET `/health`

Basic API availability check. Returns 200 if the Express server is running and responsive.

**Response Time:** < 1ms (no database queries)

**Status Codes:**
- `200 OK` - API is healthy and available

**Example Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

**Use Cases:**
- Load balancer health checks
- Container orchestration liveness probes
- Basic uptime monitoring
- Quick API availability verification

---

### GET `/health/db`

Database connectivity check. Verifies that the MySQL database is reachable and responsive using a minimal query.

**Response Time:** Typically 5-50ms (depends on database latency)

**Status Codes:**
- `200 OK` - Database is healthy and connected
- `503 Service Unavailable` - Database is unreachable or connection failed

**Example Response (Healthy):**
```json
{
  "status": "healthy",
  "database": "connected",
  "responseTime": "12ms",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Example Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Database connection failed",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Use Cases:**
- Readiness probes for container orchestration
- Database connectivity monitoring
- Automated failover detection
- Alerting systems for database outages

---

## Implementation Details

### Security
- No authentication required (intended for monitoring systems)
- No sensitive information exposed (no connection strings, credentials, or query details)
- Rate limiting bypassed for health endpoints (see `rateLimit.js`)
- Minimal information disclosure (only status and timing data)

### Performance
- `/health` endpoint uses no database queries (instant response)
- `/health/db` uses minimal query (`SELECT 1`) for fastest possible database check
- Connection pooling ensures efficient resource usage
- Proper connection cleanup even on errors

### Reliability
- Proper error handling with connection release
- Graceful degradation (503 status for failures)
- Standard HTTP status codes for compatibility
- ISO 8601 timestamps for consistent parsing

### Compatibility
- Compatible with Kubernetes liveness/readiness probes
- Works with AWS ELB/ALB health checks
- Compatible with monitoring tools (Prometheus, Datadog, etc.)
- Standard JSON responses for easy parsing

---

## Monitoring Integration Examples

### Kubernetes Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /health/db
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3
```

### Kubernetes Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3
```

### AWS Application Load Balancer
- Health check path: `/health/db`
- Health check interval: 30 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3
- Timeout: 5 seconds

### cURL Examples

**Basic health check:**
```bash
curl http://localhost:4000/health
```

**Database health check:**
```bash
curl http://localhost:4000/health/db
```

**Check with verbose output:**
```bash
curl -v http://localhost:4000/health/db
```

---

## Notes

- Health endpoints are excluded from rate limiting to ensure monitoring systems can check status frequently
- Database health check uses connection pooling and properly releases connections
- Response times are included in database health check for performance monitoring
- All timestamps use ISO 8601 format for consistent parsing across systems

