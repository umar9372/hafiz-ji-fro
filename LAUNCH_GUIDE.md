# HFZ - Hafiz JI Launch & Production Guide 🚀

This file contains EVERY step you need to take your application live using your **GitHub Student Pack** benefits.

---

## 🏗 Phase 1: Infrastructure (Domain & Server)

### 1. Domain Registration (Free for 1 Year)
*   Go to **GitHub Student Developer Pack** > [Namecheap](https://nc.me/github).
*   Register a domain (e.g., `hafiz-ji.me`).

### 2. DigitalOcean (Free Hosting with $200 Credit)
*   Login to DigitalOcean via GitHub.
*   **Create a Droplet**:
    *   **OS**: Ubuntu 22.04 LTS (x64)
    *   **Plan**: Basic (Regular Intel, $4/mo or $6/mo).
    *   **Region**: Bangalore (closest to you).
    *   **Password/SSH**: Set a strong root password.
*   Once created, copy the **IP Address** (e.g., `159.203.xx.xx`).

### 3. Connect Namecheap to DigitalOcean
*   Go to Namecheap **Advanced DNS**.
*   Add an **A Record**:
    *   **Host**: `api`
    *   **Value**: Paste your Droplet IP.
    *   *This makes `api.yourdomain.com` the address for your backend.*

---

## 🛠 Phase 2: App Preparation (JAR Build)

### 1. Build the Backend
On your laptop terminal (inside the `confession` folder), run:
```bash
mvn clean package -DskipTests
```
*Wait for it to finish. It will create a file in `target/confessions-0.0.1-SNAPSHOT.jar`.*

### 2. Upload to Server
Use **FileZilla** or this command to send the file to your server:
```bash
scp target/confessions-0.0.1-SNAPSHOT.jar root@YOUR_SERVER_IP:/root/
```

---

## 🚀 Phase 3: Launching Live

### 1. Setup MySQL on Server
Connect to your server via Terminal (SSH) and run:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql
```
Inside MySQL:
```sql
CREATE DATABASE workshop;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourSecurePasswordHere';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Run the Backend (Stay Online Forever)
Install **PM2** on the server to keep your app alive:
```bash
sudo apt install npm
sudo npm install pm2 -g
pm2 start "java -jar confessions-0.0.1-SNAPSHOT.jar" --name "hafiz-backend"
```

### 3. Deploy Frontend (Vercel)
*   Push your React code to **GitHub**.
*   Connect GitHub to [Vercel](https://vercel.com).
*   **Add Environment Variable** in Vercel Settings:
    *   **Name**: `VITE_API_URL`
    *   **Value**: `http://api.yourdomain.com:8080`
*   Click **Deploy**.

---

## 🏁 Final Check: Mobile Access
1.  Open Chrome/Safari on your phone.
2.  Type your domain name.
3.  **"Add to Home Screen"** to get your **Hafiz JI** icon!
4.  Everything is now stored on the cloud. You can delete the code from your laptop and it will still work on your phone!

---

### Need help with a specific step? Just ask!
*(Created for Hafiz JI Traders - Industrial Scrap Management)*
