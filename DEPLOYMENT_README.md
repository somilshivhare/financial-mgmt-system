# 📦 Deployment Files Overview

This directory contains all the files needed to deploy your NBAURUM ERP application on a Neev cloud server.

## 📄 Files Created

### 1. `DEPLOYMENT_GUIDE.md`
**Complete step-by-step deployment guide** with detailed instructions for:
- Server setup and software installation
- Database configuration
- Backend and frontend setup
- Nginx reverse proxy configuration
- SSL certificate setup
- Troubleshooting tips

**Use this for:** First-time deployment or when you need detailed explanations.

### 2. `QUICK_START_DEPLOYMENT.md`
**Quick reference guide** with copy-paste commands for fast deployment.

**Use this for:** Quick deployment when you know what you're doing.

### 3. `ecosystem.config.js`
**PM2 configuration file** for managing your backend Node.js process.

**What it does:**
- Configures PM2 to run your backend server
- Sets up automatic restarts on failure
- Configures logging
- Manages memory limits

**Usage:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 4. `deploy.sh`
**Automated deployment script** that:
- Pulls latest code from GitHub
- Installs dependencies
- Runs database migrations
- Builds the frontend
- Restarts services

**Usage:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. `nginx.conf.example`
**Nginx configuration template** for:
- Serving frontend static files
- Proxying API requests to backend
- WebSocket support for Socket.IO
- SSL/HTTPS configuration (after certbot)

**Usage:**
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/nbaurum
sudo nano /etc/nginx/sites-available/nbaurum  # Edit with your details
sudo ln -s /etc/nginx/sites-available/nbaurum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🚀 Next Steps

### On Your Local Machine (Now):

1. **Commit and push these deployment files to GitHub:**
   ```bash
   git add DEPLOYMENT_GUIDE.md QUICK_START_DEPLOYMENT.md deploy.sh ecosystem.config.js nginx.conf.example DEPLOYMENT_README.md
   git commit -m "Add deployment configuration files"
   git push origin main
   ```

### On Your Neev Cloud Server (After SSH):

1. **Follow `QUICK_START_DEPLOYMENT.md`** for the fastest setup, OR
2. **Follow `DEPLOYMENT_GUIDE.md`** for detailed step-by-step instructions

## 📋 Deployment Checklist

Before deploying, make sure you have:

- [ ] GitHub repository URL
- [ ] Server IP address or domain name
- [ ] SSH access to server
- [ ] MySQL database credentials (or plan to create them)
- [ ] Strong password for JWT_SECRET (generate with `openssl rand -base64 32`)

## 🔧 Configuration Summary

### Backend Configuration (`server/.env`)
- `NODE_ENV=production`
- `PORT=4000`
- `JWT_SECRET` (strong random string)
- `DB_HOST=localhost`
- `DB_USER=nbaurum_user`
- `DB_PASSWORD` (your database password)
- `DB_NAME=nbaurum_erp`
- `ALLOWED_ORIGINS` (your frontend URL)

### Frontend Configuration (`client/.env`)
- `VITE_API_BASE_URL` (your backend URL)

### Nginx Configuration
- Frontend root: `/var/www/nbaurum/client/dist`
- Backend proxy: `http://localhost:4000`
- Server name: Your domain or IP

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs:**
   - Backend: `pm2 logs server`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
   - System: `sudo journalctl -xe`

2. **Verify services are running:**
   - PM2: `pm2 status`
   - Nginx: `sudo systemctl status nginx`
   - MySQL: `sudo systemctl status mysql`

3. **Test endpoints:**
   - Frontend: `http://your-server-ip`
   - Backend health: `http://your-server-ip/api/v1/health`

4. **Review the troubleshooting section** in `DEPLOYMENT_GUIDE.md`

## 📝 Important Notes

- **Never commit `.env` files** to Git
- **Use strong passwords** for database and JWT_SECRET
- **Keep your server updated:** `sudo apt update && sudo apt upgrade`
- **Set up SSL/HTTPS** if you have a domain name
- **Configure firewall** to allow only necessary ports
- **Set up automated backups** for your database

---

**Ready to deploy? Start with `QUICK_START_DEPLOYMENT.md`!** 🚀

