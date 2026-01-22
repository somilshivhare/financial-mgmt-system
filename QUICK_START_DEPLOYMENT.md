# 🚀 Quick Start Deployment Guide

**Your code is already on GitHub. Here's what to do next on your Neev cloud server:**

## ⚡ Quick Commands (Copy & Paste)

### 1. Initial Server Setup (One-time)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL, Nginx, Git
sudo apt install -y mysql-server nginx git

# Install PM2 globally
sudo npm install -g pm2

# Secure MySQL (follow prompts)
sudo mysql_secure_installation
```

### 2. Clone Your Repository

```bash
cd /var/www
sudo git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git nbaurum
sudo chown -R $USER:$USER nbaurum
cd nbaurum
```

**⚠️ Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your actual GitHub details!**

### 3. Set Up Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Then run these SQL commands:
CREATE DATABASE nbaurum_erp;
CREATE USER 'nbaurum_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON nbaurum_erp.* TO 'nbaurum_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**⚠️ Remember the password you set - you'll need it for the .env file!**

### 4. Configure Backend

```bash
cd /var/www/nbaurum/server
cp .env.example .env
nano .env
```

**Update these key values in `.env`:**
- `NODE_ENV=production`
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `DB_PASSWORD` - Use the password you set in step 3
- `ALLOWED_ORIGINS` - Your domain or IP (e.g., `http://your-server-ip`)

**Save:** Ctrl+X, then Y, then Enter

### 5. Install Backend & Run Migrations

```bash
cd /var/www/nbaurum/server
npm install
npm run migrate
```

### 6. Configure Frontend

```bash
cd /var/www/nbaurum/client
cp .env.example .env
nano .env
```

**Update:**
- `VITE_API_BASE_URL` - Your backend URL (e.g., `http://your-server-ip:4000` or `https://api.yourdomain.com`)

**Save and build:**
```bash
npm install
npm run build
```

### 7. Start Backend with PM2

```bash
cd /var/www/nbaurum
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions shown
```

### 8. Configure Nginx

```bash
# Copy the example config
sudo cp nginx.conf.example /etc/nginx/sites-available/nbaurum

# Edit it with your details
sudo nano /etc/nginx/sites-available/nbaurum

# Enable the site
sudo ln -s /etc/nginx/sites-available/nbaurum /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

**⚠️ In the Nginx config, replace:**
- `yourdomain.com` with your actual domain or IP
- `/var/www/nbaurum/client/dist` path (should be correct if you cloned to `/var/www/nbaurum`)

### 9. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 10. Test Your Deployment

- Frontend: `http://your-server-ip`
- Backend Health: `http://your-server-ip/api/v1/health`
- Check PM2: `pm2 status`
- Check logs: `pm2 logs server`

## 🔄 Future Updates (When You Push to GitHub)

```bash
cd /var/www/nbaurum
./deploy.sh
```

Or manually:
```bash
cd /var/www/nbaurum
git pull
cd server && npm install && npm run migrate && pm2 restart server
cd ../client && npm install && npm run build
sudo systemctl reload nginx
```

## 📋 Important Notes

1. **Replace all placeholders:**
   - `YOUR-USERNAME` / `YOUR-REPO-NAME` - Your GitHub details
   - `your-server-ip` - Your actual server IP address
   - `yourdomain.com` - Your domain (if you have one)
   - Database password - Use a strong password

2. **Environment Variables:**
   - Backend `.env` is in `/var/www/nbaurum/server/.env`
   - Frontend `.env` is in `/var/www/nbaurum/client/.env`
   - Never commit these files to Git!

3. **If something fails:**
   - Check PM2 logs: `pm2 logs server`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
   - Check if backend is running: `pm2 status`

## 🆘 Common Issues

**Port 4000 already in use:**
```bash
sudo lsof -i :4000
# Kill the process or change PORT in .env
```

**Database connection failed:**
```bash
# Test connection
mysql -u nbaurum_user -p nbaurum_erp
# Check MySQL is running
sudo systemctl status mysql
```

**Frontend shows blank page:**
```bash
# Check if build exists
ls -la /var/www/nbaurum/client/dist
# Rebuild if needed
cd /var/www/nbaurum/client && npm run build
```

---

**Need more details? See `DEPLOYMENT_GUIDE.md` for the complete guide.**

