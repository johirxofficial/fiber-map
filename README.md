# fiber-map

**A beginner-friendly install guide for a Django + React fiber-network management map.**

fiber-map puts POPs, TJ Boxes, Resellers, Clients, cables and custom network points on one map. Use **See Full Network** in the **MODEL & MAP FILTER** panel to show every layer at once, then narrow it with Branch/Zone filters. It also supports Google Satellite/Streets layers, place and coordinate search, GPON grouping, role-based users and a Management panel.

> 🇧🇩 **বাংলায় সম্পূর্ণ ইনস্টলেশন গাইড:** [README.bn.md](README.bn.md)

> **Read this first:** you **do not need Node.js** and you **do not need to build the React app**. The ready-to-use production UI is already inside `build/`. You only need **Python + MySQL/MariaDB**.

---

## 1. The shortest possible install

If you already have Python 3.12 and MySQL/MariaDB running:

```bash
# 1. Get the code
git clone https://github.com/johirxofficial/fiber-map.git
cd fiber-map

# 2. Create a database (MySQL administrator)
mysql -u root -p -e "CREATE DATABASE fiber_map CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# 3. Create the Python environment
python -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt

# 4. Create the config and set your MySQL username/password
cp site_config.example.json site_config.json
nano site_config.json

# 5. Import the optional demo data
mysql -u root -p fiber_map < demo/fiber-map-demo.sql

# 6. Give the demo administrator a password
.venv/bin/python manage.py changepassword admin

# 7. Start
.venv/bin/python run.py
```

Open **http://127.0.0.1:5003/**.

Windows users: follow section 3 instead. The commands are different.

---

## 2. What you need

| Item | Minimum | Recommended |
| --- | --- | --- |
| Python | 3.10 | **3.12** |
| Database | MySQL 8.0 / MariaDB 10.6 | MySQL 8.0 or MariaDB 10.6+ |
| RAM | 1 GB | 2 GB+ |
| Disk | 500 MB | 2 GB |
| Browser | Modern Chrome/Edge/Firefox | Latest Chrome/Edge |

You do **not** need:

- Node.js
- npm
- a React build step
- Google Maps API key for the default setup
- a paid hosting account to test locally

### Two ways to use fiber-map

1. **Local / laptop** — try it on your own computer, only you can open it.
2. **Public server** — a Linux VPS with a domain, so anyone on the internet can open it over HTTPS.

The local instructions are sections 3 and 4. The public-server instructions are section 6.

---

## 3. Windows 10 / 11 — step by step

This is the easiest path for a laptop. It uses **XAMPP** for MySQL/MariaDB and **Python 3.12**.

### 3.1 Install Python

1. Open <https://www.python.org/downloads/windows/>.
2. Download **Python 3.12** (64-bit).
3. Run the installer.
4. **Tick “Add python.exe to PATH”** before clicking Install.
5. Finish the installer.

Open **PowerShell** and check:

```powershell
py -3.12 --version
```

If `py` is not recognised, try:

```powershell
python --version
```

Use whichever command works in the rest of this guide. If neither works, reinstall Python and tick the PATH checkbox.

### 3.2 Install MySQL with XAMPP

1. Download XAMPP from <https://www.apachefriends.org/>.
2. Install it in the default location: `C:\xampp`.
3. Open **XAMPP Control Panel**.
4. Click **Start** next to **MySQL**. You do **not** need Apache unless you want phpMyAdmin.
5. Wait until MySQL shows as running.

Test MySQL in PowerShell:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT VERSION();"
```

If this prints a version, MySQL is ready.

> XAMPP is fine for a local test. For a public server, use MySQL 8 or MariaDB 10.6+ with a dedicated database user.

### 3.3 Download fiber-map

**Option A — Git (recommended if Git is installed):**

```powershell
cd $HOME
git clone https://github.com/johirxofficial/fiber-map.git
cd fiber-map
```

**Option B — ZIP:**

1. Open <https://github.com/johirxofficial/fiber-map>.
2. Click **Code → Download ZIP**.
3. Extract the ZIP.
4. Open PowerShell inside the extracted folder.

To open PowerShell in the right folder: open the folder in File Explorer, hold **Shift**, right-click an empty area, then choose **Open PowerShell window here**.

All remaining commands must be run from the folder that contains `manage.py` and `run.py`.

### 3.4 Create the database

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS fiber_map CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
```

Check it:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "SHOW DATABASES LIKE 'fiber_map';"
```

Alternatively, open `http://localhost/phpmyadmin` (start Apache in XAMPP first), click **New**, create a database named `fiber_map`, and choose `utf8mb4_general_ci`.

### 3.5 Create the Python environment

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The last command may take a few minutes. You do **not** need to activate the environment; using `.\.venv\Scripts\python.exe` directly avoids PowerShell activation problems.

If `py` is not recognised, replace `py -3.12` with `python`.

If `mysqlclient` fails to install, see section 9.

### 3.6 Create `site_config.json`

```powershell
Copy-Item site_config.example.json site_config.json
notepad site_config.json
```

For a default XAMPP installation, the important values are:

```json
{
  "port": 5003,
  "db_engine": "mysql",
  "db_name": "fiber_map",
  "db_user": "root",
  "db_password": "",
  "db_host": "127.0.0.1",
  "db_port": "3306"
}
```

Save the file and close Notepad.

- If your MySQL root account has a password, put it in `db_password`.
- Do not use `root` with a blank password on a public server.
- On Windows, save as **UTF-8**, not “ANSI”.

### 3.7 Import demo data (recommended for the first test)

```powershell
cmd /c '"C:\xampp\mysql\bin\mysql.exe" -h 127.0.0.1 -u root fiber_map < demo\fiber-map-demo.sql'
```

The demo contains fictional POPs, clients, resellers, cables and users. It is safe for a first look.

If the command says the file cannot be found, make sure you are in the project folder and that `demo\fiber-map-demo.sql` exists.

You can also import it with phpMyAdmin: select the `fiber_map` database → **Import** → choose `demo/fiber-map-demo.sql` → **Go**.

### 3.8 Demo login and password

The bundled demo database is ready to use:

| Username | Password |
| --- | --- |
| `admin` | `$uper` |

The demo has **one** administrator account, `admin`. The password is **`$uper`** — with a dollar sign. Change it before putting the app on a public server:

```powershell
.\.venv\Scripts\python.exe manage.py changepassword admin
```

Enter the new password twice. Use a strong password, especially on a public server.

> `manage.py admin` is **not** a command. The correct command is `manage.py changepassword admin`.

### 3.9 Start the app

```powershell
.\.venv\Scripts\python.exe run.py
```

Wait until you see:

```text
Web:          http://127.0.0.1:5003/
Login:        http://127.0.0.1:5003/login
Management:   http://127.0.0.1:5003/management/
```

Open:

- **App:** <http://127.0.0.1:5003/>
- **Login:** <http://127.0.0.1:5003/login>
- **Management:** <http://127.0.0.1:5003/management/>

Log in with username `admin` and the password you just set.

To stop the server, press **Ctrl+C** in PowerShell.

If port 5003 is busy:

```powershell
.\.venv\Scripts\python.exe run.py --port 5004
```

Then open `http://127.0.0.1:5004/`.

### 3.10 Empty install without demo data

If you do **not** want the fictional demo records:

1. Create the database as in section 3.4.
2. Create `site_config.json` as in section 3.6.
3. Skip the demo import.
4. Start the app with `run.py`.
5. Open <http://127.0.0.1:5003/setup/>.
6. Enter the site name, your administrator username/password, and the same MySQL details.
7. Submit and wait for the automatic restart.
8. Log in at `/login`.

The setup wizard creates the tables and your first administrator. It requires the database to exist first.

---

## 4. Linux — Ubuntu / Debian step by step

These commands work on Ubuntu 22.04/24.04 and Debian 12. Run them as a normal user with `sudo` access; do not run the whole app as root.

### 4.1 Install packages

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip \
  build-essential pkg-config python3-dev default-libmysqlclient-dev \
  mysql-server
sudo systemctl enable --now mysql
```

### 4.2 Create the database and a dedicated user

```bash
sudo mysql
```

In the MySQL prompt, replace `StrongPassword123!` with a real password:

```sql
CREATE DATABASE fiber_map
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

CREATE USER 'fibermap'@'localhost' IDENTIFIED BY 'StrongPassword123!';
CREATE USER 'fibermap'@'127.0.0.1' IDENTIFIED BY 'StrongPassword123!';

GRANT ALL PRIVILEGES ON fiber_map.* TO 'fibermap'@'localhost';
GRANT ALL PRIVILEGES ON fiber_map.* TO 'fibermap'@'127.0.0.1';

FLUSH PRIVILEGES;
EXIT;
```

If `sudo mysql` does not work, use `sudo mysql -u root -p`.

Test the new account:

```bash
mysql -h 127.0.0.1 -u fibermap -p fiber_map -e "SELECT 1;"
```

### 4.3 Download the project

```bash
cd /opt
sudo git clone https://github.com/johirxofficial/fiber-map.git /opt/fiber-map
sudo chown -R "$USER":"$USER" /opt/fiber-map
cd /opt/fiber-map
```

For a personal laptop, you can clone into your home directory instead:

```bash
cd ~
git clone https://github.com/johirxofficial/fiber-map.git
cd fiber-map
```

### 4.4 Create the Python environment

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

You do not need to activate the environment; `.venv/bin/python` is enough.

### 4.5 Create `site_config.json`

```bash
cp site_config.example.json site_config.json
nano site_config.json
```

Set:

```json
{
  "port": 5003,
  "db_engine": "mysql",
  "db_name": "fiber_map",
  "db_user": "fibermap",
  "db_password": "StrongPassword123!",
  "db_host": "127.0.0.1",
  "db_port": "3306"
}
```

Save with **Ctrl+O**, Enter, then **Ctrl+X**.

Protect the file:

```bash
chmod 600 site_config.json
```

### 4.6 Import demo data or start empty

**Demo data (recommended for the first test):**

```bash
mysql -h 127.0.0.1 -u fibermap -p fiber_map < demo/fiber-map-demo.sql
```

The demo login is `admin` / `$uper`. Change it before a public launch:

```bash
.venv/bin/python manage.py changepassword admin
```

**Empty install:**

Skip the import. Start the app and open `/setup/` as described below.

> If you see `No module named 'django'`, you are using the system Python. Use
> `.venv/bin/python manage.py ...` or run `source .venv/bin/activate` first.
> `manage.py admin` is not a valid command; use `manage.py changepassword admin`.

### 4.7 Start the app

```bash
.venv/bin/python run.py
```

Open `http://127.0.0.1:5003/` on the same machine, or `http://SERVER-IP:5003/` from another computer.

If you are testing on a VPS and cannot open it, allow the port temporarily:

```bash
sudo ufw allow 5003/tcp
```

For a real public site, do **not** expose port 5003. Use Nginx and HTTPS as shown in section 6.

Stop with **Ctrl+C**.

### 4.8 Run automatically after reboot

After you have tested the app, install it as a systemd service:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin fibermap
sudo chown -R fibermap:fibermap /opt/fiber-map
sudo bash deploy/install-service.sh /opt/fiber-map fibermap 5003
```

Check it:

```bash
sudo systemctl status fiber-map
sudo journalctl -u fiber-map -f
```

Open `http://SERVER-IP:5003/`.

The installer creates `.venv`, installs dependencies, runs migrations, collects static files, writes the systemd unit and starts the service. `Restart=always` brings the app back after a crash or reboot.

---

## 5. First login and first things to change

After starting:

| Page | URL |
| --- | --- |
| Application | `http://127.0.0.1:5003/` |
| Login | `http://127.0.0.1:5003/login` |
| Management | `http://127.0.0.1:5003/management/` |
| Setup wizard | `http://127.0.0.1:5003/setup/` |

Demo login:

- Username: `admin`
- Password: `$uper` (change it immediately after the first login)
- This is the only administrator account in the demo.

Open **Management → Site & branding** and change:

- Site name and tagline
- Logo
- Map centre latitude/longitude
- Default zoom
- GPS radius
- Web port, if needed

Then open **Management → Users & permissions** and create your real users. The demo users and demo records are only examples; replace them before real use.

---

## 6. Public install: Linux VPS + domain + HTTPS

Use this when you want `https://your-domain.com` to work for everyone.

### 6.1 Point a domain to the server

At your domain provider, create an **A record**:

```text
your-domain.com      →  YOUR_SERVER_IPV4
www.your-domain.com  →  YOUR_SERVER_IPV4
```

Wait for DNS to propagate. You can check with:

```bash
ping your-domain.com
```

### 6.2 Install the app on the server

Follow section 4 completely, but use your real domain and a strong database password. Stop before section 4.8 if you want to configure Nginx first.

Create `.env` for the public hostname:

```bash
cd /opt/fiber-map
nano .env
```

Paste this and replace `your-domain.com`:

```dotenv
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com
DJANGO_CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

Save and protect it:

```bash
chmod 600 .env site_config.json
```

Install the systemd service:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin fibermap
sudo chown -R fibermap:fibermap /opt/fiber-map
sudo bash deploy/install-service.sh /opt/fiber-map fibermap 5003
```

### 6.3 Nginx reverse proxy

```bash
sudo apt install -y nginx
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/fiber-map
sudo nano /etc/nginx/sites-available/fiber-map
```

Replace every `example.com` / `www.example.com` with your real domain. Then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/fiber-map /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.4 Free HTTPS certificate

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

If you do not use `www`, omit the second `-d`.

Test:

```text
https://your-domain.com
```

### 6.5 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw deny 5003/tcp
sudo ufw enable
sudo ufw status
```

Only ports **22**, **80** and **443** should be public. Nginx talks to the app on the server itself; port 5003 does not need to be open to the internet.

---

## 7. Updating an existing installation

Always back up `site_config.json`, `.env`, `media/` and the database before updating.

### Linux with systemd

```bash
cd /opt/fiber-map
sudo -u fibermap git pull
sudo -u fibermap .venv/bin/python -m pip install -r requirements.txt
sudo -u fibermap .venv/bin/python manage.py migrate --noinput
sudo -u fibermap .venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart fiber-map
```

### Windows

```powershell
git pull
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate --noinput
.\.venv\Scripts\python.exe manage.py collectstatic --noinput
.\.venv\Scripts\python.exe run.py
```

Do not delete `site_config.json` or the `media/` folder during an update.

---

## 8. Optional: Docker

Docker is for advanced users. The container needs a reachable MySQL/MariaDB server.

```bash
docker build -t fiber-map .
docker run -d --name fiber-map \
  -p 5003:5003 \
  -e DB_HOST=host.docker.internal \
  -e DB_NAME=fiber_map \
  -e DB_USER=fibermap \
  -e DB_PASSWORD='StrongPassword123!' \
  -v "$PWD/media:/app/media" \
  -v "$PWD/staticfiles:/app/staticfiles" \
  fiber-map
```

On Linux, add:

```bash
--add-host=host.docker.internal:host-gateway
```

For production, put Nginx + HTTPS in front. Do not publish MySQL or port 5003 directly.

---

## 9. Troubleshooting

### `python` or `py` is not recognised

- Reinstall Python from python.org.
- Tick **Add python.exe to PATH**.
- Close and reopen PowerShell.
- Try `py -3.12 --version`, `python --version`, or `python3 --version`.

### `No module named 'django'`

You are using the system Python instead of the project environment. On Linux:

```bash
cd ~/fiber-map
.venv/bin/python manage.py check
```

Or activate the environment first:

```bash
source .venv/bin/activate
python manage.py check
```

On Windows use:

```powershell
.\.venv\Scripts\python.exe manage.py check
```

`manage.py` now automatically re-runs itself with `.venv` when it exists, but using the commands above is still the most reliable way.

### `Unknown command: 'admin'`

There is no `manage.py admin` command. Set a password with:

```bash
.venv/bin/python manage.py changepassword admin
```

Windows:

```powershell
.\.venv\Scripts\python.exe manage.py changepassword admin
```

Use the same command with another username to change that account.

### PowerShell says “running scripts is disabled”

You do not need to activate the environment. Use the full path instead:

```powershell
.\.venv\Scripts\python.exe run.py
```

Or allow scripts for this PowerShell window only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### `mysqlclient` fails to install

Linux:

```bash
sudo apt install -y build-essential pkg-config python3-dev default-libmysqlclient-dev
.venv/bin/python -m pip install mysqlclient==2.3.0
```

Windows:

- Install **Microsoft C++ Build Tools** with **Desktop development with C++**, then retry.
- Or use Python 3.12, which has a prebuilt `mysqlclient` wheel.
- Make sure you are using the project’s `.venv` Python, not a system Python.

### Cannot connect to MySQL

Check that the database service is running:

```bash
# Linux
sudo systemctl status mysql
```

Windows: open XAMPP Control Panel and start **MySQL**.

Check:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -h 127.0.0.1 -u root -e "SELECT 1;"
```

```bash
mysql -h 127.0.0.1 -u fibermap -p -e "SELECT 1;"
```

### `Access denied for user` or `Unknown database`

- Check `site_config.json` spelling and password.
- Make sure the database exists.
- MySQL database names are case-sensitive on Linux.
- On XAMPP local testing, the default root password is usually blank: `"db_password": ""`.
- On a public server, create the user with both `localhost` and `127.0.0.1` host entries.

### `Port 5003 is already in use`

```bash
python run.py --port 5004
```

or on Windows:

```powershell
.\.venv\Scripts\python.exe run.py --port 5004
```

Management → Site & branding can also change the port. The supervisor restarts automatically.

### Page loads but CSS/JS is missing

```bash
.venv/bin/python manage.py collectstatic --noinput
```

Windows:

```powershell
.\.venv\Scripts\python.exe manage.py collectstatic --noinput
```

Then restart the app. In production `DJANGO_DEBUG=0` and WhiteNoise serves `staticfiles/`.

### `DisallowedHost` / bad request after putting it on a domain

Add the domain to `.env`:

```dotenv
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com,127.0.0.1
```

Restart the service.

### Map tiles do not load

The browser must be able to reach `google.com`. Corporate firewalls, ad-blockers and some networks block Google tile hosts. The rest of the app still works.

### Worldwide place search shows no results

Local record search and coordinate search work offline. Worldwide place search needs the server to reach `nominatim.openstreetmap.org`. Check the server’s outbound internet and firewall.

### I forgot the administrator password

```bash
.venv/bin/python manage.py changepassword admin
```

Windows:

```powershell
.\.venv\Scripts\python.exe manage.py changepassword admin
```

### The demo login `admin` / `$uper` does not work

The **current** `demo/fiber-map-demo.sql` has one administrator, `admin`, with the password `$uper`. An older demo dump had an unusable password or an extra `$uperadmin` account, so re-importing the old file will not work.

Check which database the app is using and whether the user exists:

```bash
grep db_name site_config.json

.venv/bin/python manage.py shell -c 'from django.contrib.auth import get_user_model; U=get_user_model(); print(list(U.objects.filter(username="admin").values_list("username", "is_active", "is_superuser")))'
```

If the list is empty, import the demo or run the `/setup/` wizard. If the user exists, reset the password:

```bash
.venv/bin/python manage.py changepassword admin
```

Type `$uper` twice. Then test the API directly:

```bash
curl -i -X POST http://127.0.0.1:5003/api/login/ \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"$uper"}'
```

- **200 + token** → the password is correct; clear the browser's site data / `localStorage` and log in again.
- **400 Bad Request** → wrong password, inactive user, missing user, or the app is connected to a different database.
- **Connection refused** → the app is not running on that port.

On Windows, replace `.venv/bin/python` with `.\.venv\Scripts\python.exe`. If `site_config.json` points to another database, the user must exist in **that** database.

### The setup page keeps showing

- Make sure MySQL is running and the database exists.
- Check `site_config.json` for the correct database/user/password.
- Restart the app once.
- Look at the terminal output; `run.py` prints the migration error if it cannot connect.

### Linux service fails to start

```bash
sudo systemctl status fiber-map
sudo journalctl -u fiber-map -n 100 --no-pager
```

Common causes: wrong `site_config.json`, MySQL not running, or the project folder is not owned by the `fibermap` user.

### Backup and restore

UI: **Management → Database → Download .sql backup**.

Command line:

```bash
mysqldump -u fibermap -p --default-character-set=utf8mb4 \
  --single-transaction --routines --triggers fiber_map > backup-$(date +%F).sql

mysql -u fibermap -p fiber_map < backup-2026-10-27.sql
```

---

## 10. Configuration reference

`site_config.json` is the easiest configuration file. `.env` is optional and takes priority for the values it contains.

| Value | Default | Meaning |
| --- | --- | --- |
| `port` | `5003` | Web port used by `run.py` |
| `db_name` | `fiber_map` | MySQL database name |
| `db_user` | `root` | MySQL user |
| `db_password` | empty | MySQL password |
| `db_host` | `127.0.0.1` | MySQL host |
| `db_port` | `3306` | MySQL port |
| `secret_key` | generated | Keep private; do not commit |
| `DJANGO_DEBUG` | `0` | Set to `0` in production |
| `DJANGO_ALLOWED_HOSTS` | `*` | Set your real domain in production |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | empty | Set your HTTPS origin |
| `REACT_APP_MAP_CENTER_LAT` | `23.8103` | Fallback map centre latitude |
| `REACT_APP_MAP_CENTER_LNG` | `90.4125` | Fallback map centre longitude |
| `REACT_APP_MAP_ZOOM` | `13` | Fallback zoom |
| `REACT_APP_MAX_GPS_DISTANCE_KM` | `500` | GPS guard; `0` disables |

Useful `run.py` options:

```bash
python run.py                     # normal production start
python run.py --port 8080         # change the saved port and restart
python run.py --host 127.0.0.1    # local only / behind Nginx
python run.py --debug             # local development
python run.py --no-migrate        # skip automatic migrations
python run.py --once              # no supervisor/auto-restart
```

Never commit these files:

- `site_config.json`
- `.env`
- database dumps
- `media/` uploads
- logs and caches

---

## 11. Features

- Google Satellite (default) and Google Streets base layers, zoom up to 22.
- POP, TJ Box, Reseller, Client and custom Network Point markers.
- Real-time category filter and `?category=` deep links.
- Dashboard cards that open the matching filtered map view.
- Place/address search through OpenStreetMap Nominatim, with Bangladesh-first results.
- Coordinate search, including DMS (`23°48'37.1"N 90°24'45.0"E`).
- Free-text POP device types.
- Cable, core, splitter and connection management.
- Branch and Zone hierarchy.
- Role-based users with add/edit/delete/manage permissions.
- Site branding, map centre, default zoom and GPS radius.
- MySQL connection test, SQL import and backup export.
- Responsive layout for phone, tablet and desktop.
- First-run setup wizard.

The map uses only Google tile layers. Google tile endpoints are subject to Google’s terms and may require an API key or billing account for production use. Check the current Google Maps Platform terms before a public launch.

---

## 12. cPanel / shared hosting

1. Upload the project **without** `.venv`, `frontend/node_modules`, `test`, `tmp`, ZIPs, logs or local backups.
2. Create a Python application in cPanel and point it at the project directory.
3. Use `passenger_wsgi.py` as the startup file.
4. Install `requirements.txt` from the cPanel Python app interface or terminal.
5. Create the MySQL database/user in cPanel, import `demo/fiber-map-demo.sql` if wanted, and put the credentials in `site_config.json`.
6. Run:

```bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
```

7. Restart the application from cPanel after changing `site_config.json` or the port.

Passenger/cPanel controls the public port; the **Web port** field applies to `run.py`/Waitress only.

---

## 13. Developers: rebuild the frontend

Only needed when changing files in `frontend/src`:

```bash
cd frontend
npm install
REACT_APP_MAP_CENTER_LAT=23.8103 \
REACT_APP_MAP_CENTER_LNG=90.4125 \
REACT_APP_MAP_ZOOM=13 \
REACT_APP_MAX_GPS_DISTANCE_KM=500 \
npm run build
```

Then copy `frontend/build/static` and `frontend/build/index.html` into the root `build/` folder, keeping the custom `build/management.html`. Deployment scripts run `collectstatic` automatically.

---

## 14. Project structure

```text
fiber-map/
├── fibermap/                 # Django project
├── map/                      # Django app and API
├── build/                    # Ready-to-use React production build
├── frontend/                 # React source (developers only)
├── templates/                # Setup wizard templates
├── deploy/                   # systemd, installer and Nginx example
├── demo/                     # Sanitized demo SQL
├── media/                    # Uploaded logos
├── run.py                    # Waitress supervisor
├── bootstrap_venv.py         # Re-runs commands with .venv when needed
├── serve_wsgi.py             # Waitress entry point
├── passenger_wsgi.py         # Passenger/cPanel entry point
├── manage.py
├── requirements.txt
├── site_config.example.json  # Copy to site_config.json
├── README.md                 # This guide
└── README.bn.md              # Bengali install guide
```

# Important: MySQL Installation and Database Setup on Ubuntu Linux Server

Follow these steps one by one to install MySQL, set the root password, log in, create a database, and configure a dedicated database user.

## Step 1: Install MySQL

Run the following commands in your terminal:

```bash
sudo apt update
sudo apt install mysql-server -y
```

Enable and start MySQL:

```bash
sudo systemctl enable --now mysql
```

Check the service status:

```bash
sudo systemctl status mysql
```

If you see `active (running)`, MySQL is running successfully. Press `q` to exit the status screen.

## Step 2: Log in to MySQL for the First Time

Run:

```bash
sudo mysql
```

If successful, you will see the MySQL prompt:

```text
mysql>
```

On Ubuntu, you can usually log in as the MySQL root user using `sudo mysql` without entering a MySQL password initially.

## Step 3: Set the MySQL Root Password

Inside the MySQL prompt, run:

```sql
ALTER USER 'root'@'localhost'
IDENTIFIED BY 'MyStrongPass123!';
```

Replace `MyStrongPass123!` with your own strong password.

**Important:** This is the MySQL root account password, not the password for a specific database.

The command uses the MySQL server's supported authentication configuration. If you encounter an error, check the exact error message before attempting to change the authentication method.

## Step 4: Test Root Login with the Password

Exit MySQL:

```sql
EXIT;
```

Now log in using the root account:

```bash
mysql -u root -p
```

When prompted:

```text
Enter password:
```

Enter the password you set in Step 3 and press Enter.

**Note:** Password characters will not appear on the screen while typing. This is normal.

If you see `mysql>`, the login was successful.

If the login fails, use `sudo mysql` to regain access and check the root account's authentication configuration.

## Step 5: Create a New Database

After logging in, run:

```sql
CREATE DATABASE myapp_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Verify that the database exists:

```sql
SHOW DATABASES;
```

You should see `myapp_db` in the list.

## Step 6: Create a Dedicated Database User

For applications, it is better to use a separate database account instead of the root account.

Create a user:

```sql
CREATE USER 'myapp_user'@'localhost'
IDENTIFIED BY 'AppStrongPass456!';
```

Grant the user permissions on the application database:

```sql
GRANT ALL PRIVILEGES ON myapp_db.*
TO 'myapp_user'@'localhost';
```

Replace `AppStrongPass456!` with a different, strong password of your own.

**Security note:** Store your actual passwords securely. Never commit real passwords to a public GitHub repository or README file.

Exit MySQL:

```sql
EXIT;
```

Test the new database user's login:

```bash
mysql -u myapp_user -p myapp_db
```

Enter the password you configured in Step 6.

## Step 7: Verify the Database Connection

After logging in successfully, run:

```sql
SELECT DATABASE();
SHOW TABLES;
```

The first command should return:

```text
myapp_db
```

The second command may return an empty result because the database does not contain any tables yet. This is normal.

## Setup Summary

| Item | Configuration |
|---|---|
| MySQL Server | Installed on Ubuntu |
| MySQL root username | `root` |
| Root login command | `mysql -u root -p` |
| Database name | `myapp_db` |
| Application database user | `myapp_user` |
| Application database login | `mysql -u myapp_user -p myapp_db` |

## Important Notes

- Replace example passwords with your own strong passwords.
- Keep the MySQL root account for administrative tasks.
- Use a dedicated database user for your applications.
- Do not share or expose actual passwords.
- If any command produces an error, read the complete error message before proceeding.

**Recommended workflow:** Complete Steps 1 and 2 first. Once `sudo mysql` opens the `mysql>` prompt, proceed to the next steps in order. If an error occurs, resolve it before continuing.


---

## 15. Security checklist

- Change the demo administrator password.
- Use a dedicated MySQL user, not `root`.
- Set `DJANGO_DEBUG=0`.
- Set `DJANGO_ALLOWED_HOSTS` to your real domain.
- Set `DJANGO_CSRF_TRUSTED_ORIGINS` and `DJANGO_CORS_ALLOWED_ORIGINS`.
- Enable HTTPS with a valid certificate.
- Keep `site_config.json`, `.env`, database dumps and `media/` private.
- Do not expose MySQL or port 5003 to the internet.
- Take regular database backups.

---

## 16. Licence and credits

MIT licence. See `LICENSE`.

Made and maintained by **johirxofficial**.
