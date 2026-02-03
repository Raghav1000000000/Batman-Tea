# Production Deployment Checklist

## 🚀 Pre-Deployment

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Change `DEFAULT_ADMIN_PASSWORD` from default
- [ ] Generate and set `SESSION_SECRET` (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Configure `ALLOWED_ORIGINS` with your production domain(s)
- [ ] Adjust rate limits if needed (`MAX_LOGIN_ATTEMPTS_PER_MINUTE`, `MAX_API_REQUESTS_PER_MINUTE`)

### 2. Security Hardening
- [ ] Change dashboard password immediately after first login
- [ ] Verify `.env` is in `.gitignore` (should already be there)
- [ ] Never commit `.env` file to version control
- [ ] Review and update CORS allowed origins
- [ ] Setup HTTPS (required - see below)

### 3. HTTPS Setup (REQUIRED)
Choose one option:

#### Option A: Reverse Proxy (nginx/Apache)
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Option B: Platform with Built-in HTTPS
- Heroku (automatic SSL)
- Railway (automatic SSL)
- DigitalOcean App Platform (automatic SSL)
- Vercel (automatic SSL)

### 4. Database Backup
Create automated backup script:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
mkdir -p $BACKUP_DIR

# Backup database
cp batman-tea.db $BACKUP_DIR/batman-tea_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "batman-tea_*.db" -mtime +30 -delete

# Optional: Upload to cloud storage
# aws s3 cp $BACKUP_DIR/batman-tea_$DATE.db s3://your-bucket/backups/
```

Add to crontab (daily at 2 AM):
```bash
crontab -e
# Add:
0 2 * * * /path/to/backup.sh
```

### 5. Process Management
Install and configure PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name batman-tea

# Configure startup script
pm2 startup
pm2 save

# View logs
pm2 logs batman-tea

# Monitor
pm2 monit
```

### 6. Firewall Configuration
```bash
# Allow HTTP and HTTPS only
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

### 7. Monitoring Setup
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom, or StatusCake)
- [ ] Configure error alerts
- [ ] Review `access.log` regularly for suspicious activity
- [ ] Setup log rotation

```bash
# Log rotation configuration
# /etc/logrotate.d/batman-tea
/path/to/app/access.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    postrotate
        pm2 reload batman-tea
    endscript
}
```

## 🔒 Post-Deployment Security

### Immediate Actions (First 24 Hours)
1. **Change Dashboard Password**
   - Login to dashboard at `https://yourdomain.com/dashboard`
   - Open browser console (F12)
   - Run password change script (see README.md)

2. **Test Rate Limiting**
   - Try 6 failed login attempts
   - Verify you get rate limited

3. **Test CORS**
   - Try accessing API from unauthorized domain
   - Should be blocked

4. **Verify HTTPS**
   - Check SSL certificate is valid
   - Ensure HTTP redirects to HTTPS
   - Test with SSL Labs (ssllabs.com/ssltest)

### Regular Maintenance (Weekly)
- [ ] Review `access.log` for suspicious patterns
- [ ] Check disk space (`df -h`)
- [ ] Verify backups are running (`ls -lah backups/`)
- [ ] Check PM2 status (`pm2 status`)
- [ ] Review error logs (`pm2 logs batman-tea --err`)

### Monthly Security Tasks
- [ ] Update dependencies (`npm audit` and `npm update`)
- [ ] Review and rotate logs
- [ ] Test backup restoration procedure
- [ ] Change dashboard password (optional, recommended)
- [ ] Review CORS whitelist
- [ ] Check for security updates

## 📊 Monitoring Checklist

### Key Metrics to Monitor
- Server uptime (should be 99.9%+)
- Response time (should be <500ms)
- Failed login attempts (watch for spikes)
- API request rate (watch for unusual traffic)
- Disk space (database grows over time)
- Memory usage (should be stable)

### Alert Thresholds
- Server down for >1 minute
- Response time >2 seconds
- 10+ failed login attempts in 1 minute (brute force attack)
- Disk usage >80%
- Memory usage >90%

## 🆘 Incident Response

### If Compromised
1. **Immediate Actions**:
   ```bash
   # Stop the server
   pm2 stop batman-tea
   
   # Change all passwords
   # Rotate SESSION_SECRET in .env
   # Clear all auth tokens from database
   ```

2. **Investigation**:
   - Review `access.log` for attack vectors
   - Check database for unauthorized changes
   - Review firewall logs

3. **Recovery**:
   - Restore from clean backup
   - Apply security patches
   - Update all credentials
   - Restart server

### If Database Corrupted
```bash
# Restore from backup
pm2 stop batman-tea
cp backups/batman-tea_YYYYMMDD_HHMMSS.db batman-tea.db
pm2 start batman-tea
```

## ✅ Production Ready Verification

Before going live, verify all:
- [ ] HTTPS enabled and working
- [ ] Dashboard password changed from default
- [ ] Environment variables configured correctly
- [ ] CORS restricted to your domain(s)
- [ ] Rate limiting active and tested
- [ ] Backups running automatically
- [ ] PM2 configured for auto-restart
- [ ] Monitoring and alerts setup
- [ ] Firewall rules applied
- [ ] Logs being collected and rotated
- [ ] All security headers present (check with securityheaders.com)
- [ ] SSL certificate valid (check with ssllabs.com)

## 🎯 Performance Optimization (Optional)

### Database Optimization
```sql
-- Add more indexes if needed
-- Already optimized with indexes on phone, status, createdAt
```

### Caching (If High Traffic)
Consider adding Redis for:
- Rate limiting storage
- Session storage
- API response caching

### Load Balancing (If Very High Traffic)
- Setup nginx as load balancer
- Run multiple instances with PM2 cluster mode:
  ```bash
  pm2 start server.js -i max --name batman-tea
  ```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Let's Encrypt (Free SSL)](https://letsencrypt.org/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

## 🆘 Support

If you encounter issues:
1. Check `access.log` and PM2 logs
2. Verify environment variables are set correctly
3. Ensure database file has proper permissions
4. Review firewall rules
5. Test with HTTPS disabled temporarily (development only)
