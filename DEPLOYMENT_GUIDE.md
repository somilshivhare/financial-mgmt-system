# NBAURUM ERP - Complete Deployment Guide for Neev Cloud Server

This guide will help you deploy both the frontend and backend of the NBAURUM ERP application on a Neev cloud server from scratch.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ A Neev cloud server (Ubuntu/Debian recommended)
- ✅ SSH access to your server
- ✅ Domain name configured (optional but recommended)
- ✅ GitHub repository with your code pushed
- ✅ MySQL database (can be on same server or separate)

## 🚀 Step-by-Step Deployment Process

### Step 1: Connect to Your Server

```bash
ssh username@your-server-ip
```

### Step 2: Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Required Software

#### Install Node.js (v18 or higher)

```bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install MySQL

```bash
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Install Nginx (for reverse proxy)

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

#### Install Git

```bash
sudo apt install -y git
```

### Step 4: Clone Your Repository

```bash
# Navigate to a suitable directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/your-username/your-repo-name.git nbaurum
sudo chown -R $USER:$USER nbaurum
cd nbaurum
```

**Replace `your-username` and `your-repo-name` with your actual GitHub repository details.**

### Step 5: Set Up MySQL Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE nbaurum_erp;
CREATE USER 'nbaurum_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON nbaurum_erp.* TO 'nbaurum_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**⚠️ Important: Replace `YourStrongPassword123!` with a strong password and update it in your `.env` file.**

### Step 6: Configure Backend Environment

```bash
cd /var/www/nbaurum/server

# Copy environment example file
cp .env.example .env

# Edit the .env file
nano .env
```

**Update the following variables in `server/.env`:**

```env
NODE_ENV=production
PORT=4000

# Generate a strong JWT secret (run this on server: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here-min-32-chars

# Database configuration
DB_HOST=localhost
DB_USER=nbaurum_user
DB_PASSWORD=YourStrongPassword123!
DB_NAME=nbaurum_erp
DB_PORT=3306

# CORS - Replace with your domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# If using IP address instead of domain:
# ALLOWED_ORIGINS=http://your-server-ip
```

**Save and exit (Ctrl+X, then Y, then Enter)**

### Step 7: Install Backend Dependencies and Run Migrations

```bash
cd /var/www/nbaurum/server

# Install dependencies
npm install

# Run database migrations
npm run migrate
```

### Step 8: Build Frontend

```bash
cd /var/www/nbaurum/client

# Copy environment example file
cp .env.example .env

# Edit the .env file
nano .env
```

**Update the following in `client/.env`:**

```env
# Replace with your backend URL
# If using domain: https://api.yourdomain.com
# If using IP: http://your-server-ip:4000
VITE_API_BASE_URL=https://api.yourdomain.com

# Or if backend and frontend on same domain:
# VITE_API_BASE_URL=https://yourdomain.com
```

**Save and exit, then build:**

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

The build output will be in `client/dist/` directory.

### Step 9: Configure PM2 for Backend

```bash
cd /var/www/nbaurum

# Start backend with PM2 using the ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown in the output
```

### Step 10: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/nbaurum
```

**Add the following configuration:**

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain or IP

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain or IP

    root /var/www/nbaurum/client/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**If using IP address instead of domain, use this simpler config:**

```nginx
server {
    listen 80;
    server_name your-server-ip;  # Replace with actual IP

    # Frontend
    root /var/www/nbaurum/client/dist;
    index index.html;

    # Serve frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/nbaurum /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Step 11: Set Up SSL Certificate (Optional but Recommended)

If you have a domain name, install Certbot for free SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically configure Nginx for HTTPS.

### Step 12: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 13: Verify Deployment

1. **Check Backend:**
   ```bash
   pm2 status
   pm2 logs server
   ```

2. **Check Frontend:**
   - Visit `http://your-server-ip` or `https://yourdomain.com`

3. **Test API:**
   - Visit `http://your-server-ip/api/v1/health` or `https://api.yourdomain.com/api/v1/health`

## 🔄 Updating Your Application

When you push new code to GitHub:

```bash
cd /var/www/nbaurum

# Pull latest changes
git pull origin main  # or your branch name

# Update backend
cd server
npm install
npm run migrate  # if there are new migrations
pm2 restart server

# Update frontend
cd ../client
npm install
npm run build
sudo systemctl reload nginx
```

## 📊 Useful Commands

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs server         # View logs
pm2 restart server      # Restart backend
pm2 stop server         # Stop backend
pm2 monit               # Monitor resources
```

### Nginx Commands
```bash
sudo nginx -t           # Test configuration
sudo systemctl reload nginx  # Reload configuration
sudo systemctl restart nginx # Restart Nginx
```

### MySQL Commands
```bash
sudo systemctl status mysql   # Check MySQL status
sudo mysql -u root -p        # Login to MySQL
```

## 🔒 Security Checklist

- [ ] Changed all default passwords
- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Configured CORS with specific domains
- [ ] Set up firewall rules
- [ ] Installed SSL certificate (if using domain)
- [ ] Database user has minimal required permissions
- [ ] `.env` files are not committed to Git
- [ ] PM2 is configured to auto-restart on failure

## 🐛 Troubleshooting

### Backend not starting
```bash
pm2 logs server
cd /var/www/nbaurum/server
node index.js  # Run directly to see errors
```

### Database connection issues
```bash
# Test MySQL connection
mysql -u nbaurum_user -p nbaurum_erp

# Check MySQL status
sudo systemctl status mysql
```

### Frontend not loading
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify build exists
ls -la /var/www/nbaurum/client/dist
```

### Port already in use
```bash
# Check what's using port 4000
sudo lsof -i :4000

# Or check with netstat
sudo netstat -tulpn | grep :4000
```

## 📝 Notes

- Replace all placeholder values (yourdomain.com, your-server-ip, etc.) with your actual values
- Keep your `.env` files secure and never commit them to Git
- Regularly update your system packages: `sudo apt update && sudo apt upgrade`
- Monitor your application logs regularly
- Set up automated backups for your database

## 🆘 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs server`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system logs: `sudo journalctl -xe`
4. Verify all environment variables are set correctly

---

**Deployment completed! Your application should now be live on your Neev cloud server.** 🎉

