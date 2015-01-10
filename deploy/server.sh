# Enter right directory
cd /var/www/gamekeller.net/src

# Fetch from origin
git fetch origin

# Reset git repo to upstream state
git reset --hard origin/live

# Install node deps
npm install

# Update git revision info in footer view
grunt revupdate

# Perform 0s downtime reload
sudo /usr/local/bin/pm2 reload main