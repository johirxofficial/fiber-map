# fiber-map — বাংলা ইনস্টলেশন গাইড

[English README](README.md) | **বাংলা**

**fiber-map** একটি Django + React ভিত্তিক ফাইবার নেটওয়ার্ক ম্যানেজমেন্ট ম্যাপ। POP, TJ Box, Reseller, Client, Cable এবং কাস্টম Network Point একই ম্যাপে দেখানো যায়। **MODEL & MAP FILTER** প্যানেলে **See Full Network** বেছে নিলে সব লেয়ার একসাথে দেখা যাবে; এরপর Branch/Zone ফিল্টার দিয়ে ম্যাপ ছোট করা যায়।

এই গাইডটি একদম নতুনদের জন্য লেখা। আপনি যদি আগে কখনো Django বা MySQL ইনস্টল না করে থাকেন, তবুও ধাপে ধাপে এগোলে সেটআপ করতে পারবেন।

> **জরুরি:** অ্যাপ চালানোর জন্য **Node.js বা npm লাগবে না**। React-এর রেডি বিল্ড `build/` ফোল্ডারে দেওয়া আছে। আপনার শুধু **Python** এবং **MySQL/MariaDB** লাগবে।

---

## ১. এক নজরে

মোট ৭টি কাজ:

1. Python ইনস্টল করুন।
2. MySQL/MariaDB চালু করুন।
3. GitHub থেকে প্রজেক্ট নামান।
4. একটি ডেটাবেস তৈরি করুন।
5. Python প্যাকেজ ইনস্টল করুন।
6. `site_config.json`-এ ডেটাবেসের তথ্য দিন।
7. `run.py` চালিয়ে ব্রাউজারে খুলুন।

ডেমো ডেটা চাইলে তারপর `demo/fiber-map-demo.sql` ইমপোর্ট করবেন।

---

## ২. যা যা লাগবে

| জিনিস | সর্বনিম্ন | ভালো ফলাফলের জন্য |
| --- | --- | --- |
| Python | 3.10 | **3.12** |
| ডেটাবেস | MySQL 8 / MariaDB 10.6 | MySQL 8 বা MariaDB 10.6+ |
| RAM | 1 GB | 2 GB+ |
| ডিস্ক | 500 MB | 2 GB |
| ব্রাউজার | Chrome / Edge / Firefox | সর্বশেষ ভার্সন |

Windows-এ সহজে টেস্ট করতে **XAMPP** ব্যবহার করতে পারেন। XAMPP-এর সাথে MySQL/MariaDB এবং phpMyAdmin দুটোই পাওয়া যায়।

পাবলিক সার্ভারে MySQL-এর `root` ইউজার ব্যবহার করবেন না। আলাদা ডেটাবেস ইউজার তৈরি করবেন।

---

## ৩. Windows ১০/১১-এ ইনস্টল

### ৩.১ Python ইনস্টল করুন

1. <https://www.python.org/downloads/windows/> খুলুন।
2. **Python 3.12 (64-bit)** ডাউনলোড করুন।
3. ইনস্টলার চালান।
4. ইনস্টলের আগে **“Add python.exe to PATH”**-এ টিক দিন।
5. Install শেষ করুন।

তারপর PowerShell খুলে লিখুন:

```powershell
py -3.12 --version
```

যদি `py` না পাওয়া যায়:

```powershell
python --version
```

যেটি কাজ করে, পুরো গাইডে সেটিই ব্যবহার করুন। দুটোই না চললে Python আবার ইনস্টল করুন এবং PATH-এ টিক দিন।

### ৩.২ MySQL চালু করুন (XAMPP)

1. <https://www.apachefriends.org/> থেকে XAMPP ডাউনলোড করুন।
2. ডিফল্ট জায়গায় ইনস্টল করুন: `C:\xampp`
3. **XAMPP Control Panel** খুলুন।
4. **MySQL**-এর পাশে **Start** ক্লিক করুন।
5. MySQL চালু হওয়া পর্যন্ত অপেক্ষা করুন।

পরীক্ষা করুন:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT VERSION();"
```

ভার্সন দেখালে MySQL ঠিক আছে।

> XAMPP শুধু লোকাল টেস্টের জন্য সহজ। পাবলিক সার্ভারে MySQL 8 বা MariaDB 10.6+ এবং আলাদা ডেটাবেস ইউজার ব্যবহার করুন।

### ৩.৩ প্রজেক্ট নামান

**উপায় ১ — Git থাকলে:**

```powershell
cd $HOME
git clone https://github.com/johirxofficial/fiber-map.git
cd fiber-map
```

**উপায় ২ — ZIP:**

1. <https://github.com/johirxofficial/fiber-map> খুলুন।
2. **Code → Download ZIP** ক্লিক করুন।
3. ZIP এক্সট্রাক্ট করুন।
4. যে ফোল্ডারে `manage.py` এবং `run.py` আছে, সেখানে PowerShell খুলুন।

ফোল্ডারে PowerShell খুলতে: ফোল্ডারটি File Explorer-এ খুলুন, খালি জায়গায় **Shift + ডান ক্লিক** করুন, তারপর **Open PowerShell window here** নির্বাচন করুন।

সব কমান্ড সেই ফোল্ডার থেকে চালাতে হবে যেখানে `manage.py` আছে।

### ৩.৪ ডেটাবেস তৈরি করুন

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS fiber_map CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
```

চেক করুন:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "SHOW DATABASES LIKE 'fiber_map';"
```

অথবা XAMPP Control Panel থেকে Apache চালু করে <http://localhost/phpmyadmin> খুলুন, **New** ক্লিক করুন, ডেটাবেসের নাম `fiber_map` দিন এবং `utf8mb4_general_ci` নির্বাচন করুন।

### ৩.৫ Python প্যাকেজ ইনস্টল

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

শেষ কমান্ডে কয়েক মিনিট লাগতে পারে।

আলাদা করে virtual environment activate করার দরকার নেই। সরাসরি `.\.venv\Scripts\python.exe` ব্যবহার করলে PowerShell-এর script execution সমস্যাও এড়ানো যায়।

যদি `py` না থাকে, `py -3.12`-এর জায়গায় `python` লিখুন।

`mysqlclient` ইনস্টল না হলে নিচের **সমস্যা ও সমাধান** অংশ দেখুন।

### ৩.৬ `site_config.json` তৈরি করুন

```powershell
Copy-Item site_config.example.json site_config.json
notepad site_config.json
```

সাধারণ XAMPP সেটআপে গুরুত্বপূর্ণ অংশগুলো এমন হবে:

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

- XAMPP-এর ডিফল্ট root পাসওয়ার্ড সাধারণত খালি, তাই `"db_password": ""`।
- আপনার MySQL root-এ পাসওয়ার্ড থাকলে সেটি লিখুন।
- পাবলিক সার্ভারে `root` এবং খালি পাসওয়ার্ড ব্যবহার করবেন না।
- ফাইলটি UTF-8 হিসেবে সেভ করুন।

সেভ করে Notepad বন্ধ করুন।

### ৩.৭ ডেমো ডেটা ইমপোর্ট (প্রথম টেস্টের জন্য সুপারিশ)

```powershell
cmd /c '"C:\xampp\mysql\bin\mysql.exe" -h 127.0.0.1 -u root fiber_map < demo\fiber-map-demo.sql'
```

ডেমোতে কাল্পনিক POP, Client, Reseller, Cable এবং ইউজার আছে। বাস্তব ডেটা নয়।

ফাইল না পাওয়া গেলে নিশ্চিত করুন যে আপনি প্রজেক্ট ফোল্ডারে আছেন এবং `demo\fiber-map-demo.sql` ফাইলটি আছে।

চাইলে phpMyAdmin দিয়েও করতে পারেন:

1. `fiber_map` ডেটাবেস নির্বাচন করুন।
2. **Import** ক্লিক করুন।
3. `demo/fiber-map-demo.sql` ফাইল বেছে নিন।
4. **Go** ক্লিক করুন।

### ৩.৮ ডেমো লগইন ও পাসওয়ার্ড

বান্ডল করা ডেমো ডেটাবেসটি সরাসরি ব্যবহার করা যায়:

| ইউজারনেম | পাসওয়ার্ড |
| --- | --- |
| `admin` | `$uper` |

ডেমোতে **একটি** অ্যাডমিন অ্যাকাউন্ট আছে: `admin`। পাসওয়ার্ড **`$uper`** — ডলার চিহ্নসহ। পাবলিক সার্ভারে দেওয়ার আগে অবশ্যই বদলান:

```powershell
.\.venv\Scripts\python.exe manage.py changepassword admin
```

দুবার নতুন পাসওয়ার্ড লিখুন। পাবলিক সার্ভারে শক্ত পাসওয়ার্ড দিন।

> `manage.py admin` কোনো কমান্ড নয়। সঠিক কমান্ড হলো `manage.py changepassword admin`।

### ৩.৯ অ্যাপ চালু করুন

```powershell
.\.venv\Scripts\python.exe run.py
```

নিচের মতো লেখা দেখা পর্যন্ত অপেক্ষা করুন:

```text
Web:          http://127.0.0.1:5003/
Login:        http://127.0.0.1:5003/login
Management:   http://127.0.0.1:5003/management/
```

ব্রাউজারে খুলুন:

- অ্যাপ: <http://127.0.0.1:5003/>
- লগইন: <http://127.0.0.1:5003/login>
- ম্যানেজমেন্ট: <http://127.0.0.1:5003/management/>

ইউজারনেম `admin` এবং আপনি যে নতুন পাসওয়ার্ড দিয়েছেন সেটি দিয়ে লগইন করুন।

সার্ভার বন্ধ করতে PowerShell-এ **Ctrl+C** চাপুন।

পোর্ট 5003 ব্যস্ত থাকলে:

```powershell
.\.venv\Scripts\python.exe run.py --port 5004
```

তারপর <http://127.0.0.1:5004/> খুলুন।

### ৩.১০ ডেমো ছাড়া খালি ইনস্টল

ডেমো ডেটা না চাইলে:

1. শুধু ডেটাবেস তৈরি করুন (ধাপ ৩.৪)।
2. `site_config.json` তৈরি করুন (ধাপ ৩.৬)।
3. ডেমো ইমপোর্ট করবেন না।
4. `run.py` চালু করুন।
5. <http://127.0.0.1:5003/setup/> খুলুন।
6. সাইটের নাম, অ্যাডমিন ইউজার/পাসওয়ার্ড এবং MySQL-এর তথ্য দিন।
7. সাবমিট করুন এবং অ্যাপটি নিজে থেকে রিস্টার্ট হওয়া পর্যন্ত অপেক্ষা করুন।
8. `/login`-এ গিয়ে লগইন করুন।

Setup wizard প্রথম অ্যাডমিন তৈরি করবে। ডেটাবেস আগে থেকেই তৈরি থাকতে হবে।

---

## ৪. Linux (Ubuntu / Debian)-এ ইনস্টল

এই কমান্ডগুলো Ubuntu 22.04/24.04 এবং Debian 12-এর জন্য। সাধারণ ইউজার হিসেবে চালান, পুরো অ্যাপ `root` হিসেবে চালাবেন না।

### ৪.১ প্যাকেজ ইনস্টল

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip \
  build-essential pkg-config python3-dev default-libmysqlclient-dev \
  mysql-server
sudo systemctl enable --now mysql
```

### ৪.২ ডেটাবেস এবং আলাদা ইউজার তৈরি

```bash
sudo mysql
```

MySQL prompt-এ `StrongPassword123!`-এর জায়গায় নিজের শক্ত পাসওয়ার্ড দিন:

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

`sudo mysql` না চললে `sudo mysql -u root -p` ব্যবহার করুন।

পরীক্ষা:

```bash
mysql -h 127.0.0.1 -u fibermap -p fiber_map -e "SELECT 1;"
```

### ৪.৩ প্রজেক্ট নামান

```bash
cd /opt
sudo git clone https://github.com/johirxofficial/fiber-map.git /opt/fiber-map
sudo chown -R "$USER":"$USER" /opt/fiber-map
cd /opt/fiber-map
```

নিজের ল্যাপটপে চাইলে home directory-তেও করতে পারেন:

```bash
cd ~
git clone https://github.com/johirxofficial/fiber-map.git
cd fiber-map
```

### ৪.৪ Python environment তৈরি

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

### ৪.৫ `site_config.json` তৈরি

```bash
cp site_config.example.json site_config.json
nano site_config.json
```

এভাবে সেট করুন:

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

সেভ করতে **Ctrl+O**, Enter, তারপর **Ctrl+X**।

ফাইলটি সুরক্ষিত করুন:

```bash
chmod 600 site_config.json
```

### ৪.৬ ডেমো ডেটা অথবা খালি ইনস্টল

**ডেমো ডেটা (প্রথম টেস্টের জন্য):**

```bash
mysql -h 127.0.0.1 -u fibermap -p fiber_map < demo/fiber-map-demo.sql
```

ডেমো লগইন: `admin` / `$uper`। পাবলিক সার্ভারে দেওয়ার আগে বদলান:

```bash
.venv/bin/python manage.py changepassword admin
```

**খালি ইনস্টল:** ডেমো ইমপোর্ট করবেন না। অ্যাপ চালু করে `/setup/` খুলুন।

> `No module named 'django'` দেখালে আপনি system Python ব্যবহার করছেন।
> `.venv/bin/python manage.py ...` ব্যবহার করুন অথবা আগে
> `source .venv/bin/activate` চালান।
> `manage.py admin` কোনো কমান্ড নয়; সঠিক কমান্ড `manage.py changepassword admin`।

### ৪.৭ অ্যাপ চালু

```bash
.venv/bin/python run.py
```

একই মেশিনে `http://127.0.0.1:5003/`, অন্য কম্পিউটার থেকে `http://SERVER-IP:5003/` খুলুন।

VPS-এ টেস্ট করার সময় পোর্ট খুলতে:

```bash
sudo ufw allow 5003/tcp
```

পাবলিক সাইটের জন্য 5003 পোর্ট ইন্টারনেটে খুলবেন না। Nginx + HTTPS ব্যবহার করবেন (সেকশন ৬)।

বন্ধ করতে **Ctrl+C**।

### ৪.৮ রিবুটের পর অটো চালু (systemd)

আগে হাতে টেস্ট করে দেখুন। তারপর সার্ভিস হিসেবে ইনস্টল করুন:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin fibermap
sudo chown -R fibermap:fibermap /opt/fiber-map
sudo bash deploy/install-service.sh /opt/fiber-map fibermap 5003
```

চেক:

```bash
sudo systemctl status fiber-map
sudo journalctl -u fiber-map -f
```

খুলুন: `http://SERVER-IP:5003/`

ইনস্টলার `.venv` তৈরি, প্যাকেজ ইনস্টল, migration, `collectstatic`, systemd unit লেখা এবং সার্ভিস চালু—সব করে। ক্র্যাশ বা রিবুটের পর `Restart=always` অ্যাপ আবার চালু করবে।

---

## ৫. প্রথম লগইন

| পাতা | URL |
| --- | --- |
| অ্যাপ | `http://127.0.0.1:5003/` |
| লগইন | `http://127.0.0.1:5003/login` |
| ম্যানেজমেন্ট | `http://127.0.0.1:5003/management/` |
| Setup wizard | `http://127.0.0.1:5003/setup/` |

ডেমো লগইন:

- ইউজারনেম: `admin`
- পাসওয়ার্ড: `$uper` (প্রথম লগইনের পরেই বদলে নিন)
- ডেমোতে এটিই একমাত্র অ্যাডমিন অ্যাকাউন্ট।

লগইনের পর **Management → Site & branding**-এ যান এবং বদলান:

- সাইটের নাম ও tagline
- লোগো
- ম্যাপের কেন্দ্র (latitude/longitude)
- default zoom
- GPS radius
- প্রয়োজনে web port

তারপর **Management → Users & permissions**-এ নিজের আসল ইউজার তৈরি করুন। ডেমো ইউজার ও ডেমো রেকর্ড শুধু উদাহরণ; আসল ব্যবহারের আগে বদলে নিন।

---

## ৬. পাবলিক ইনস্টল: Linux VPS + ডোমেইন + HTTPS

এই অংশে `https://your-domain.com` সবার জন্য খোলা হবে।

### ৬.১ ডোমেইন সার্ভারের দিকে নিন

ডোমেইন প্রোভাইডারের DNS-এ **A record** তৈরি করুন:

```text
your-domain.com      →  YOUR_SERVER_IPV4
www.your-domain.com  →  YOUR_SERVER_IPV4
```

DNS ছড়ানো পর্যন্ত অপেক্ষা করুন। চেক:

```bash
ping your-domain.com
```

### ৬.২ সার্ভারে অ্যাপ ইনস্টল

সেকশন ৪ সম্পূর্ণ অনুসরণ করুন। তবে আসল ডোমেইন এবং শক্ত ডেটাবেস পাসওয়ার্ড ব্যবহার করুন।

তারপর `.env` তৈরি করুন:

```bash
cd /opt/fiber-map
nano .env
```

এটি পেস্ট করে `your-domain.com` বদলান:

```dotenv
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com
DJANGO_CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

সেভ করে সুরক্ষিত করুন:

```bash
chmod 600 .env site_config.json
```

systemd সার্ভিস ইনস্টল করুন:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin fibermap
sudo chown -R fibermap:fibermap /opt/fiber-map
sudo bash deploy/install-service.sh /opt/fiber-map fibermap 5003
```

### ৬.৩ Nginx reverse proxy

```bash
sudo apt install -y nginx
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/fiber-map
sudo nano /etc/nginx/sites-available/fiber-map
```

ফাইলের ভেতরে সব `example.com` / `www.example.com`-এর জায়গায় নিজের ডোমেইন দিন। তারপর:

```bash
sudo ln -s /etc/nginx/sites-available/fiber-map /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### ৬.৪ ফ্রি HTTPS সার্টিফিকেট

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

`www` না ব্যবহার করলে দ্বিতীয় `-d` বাদ দিন।

টেস্ট:

```text
https://your-domain.com
```

### ৬.৫ ফায়ারওয়াল

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw deny 5003/tcp
sudo ufw enable
sudo ufw status
```

শুধু **22**, **80** এবং **443** পাবলিক থাকবে। Nginx নিজেই সার্ভারের ভেতরে অ্যাপের সাথে কথা বলবে; 5003 ইন্টারনেটে খোলা লাগবে না।

---

## ৭. আপডেট করার নিয়ম

আপডেটের আগে `site_config.json`, `.env`, `media/` এবং ডেটাবেসের ব্যাকআপ রাখুন।

### Linux + systemd

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

আপডেটের সময় `site_config.json` বা `media/` ফোল্ডার ডিলিট করবেন না।

---

## ৮. সমস্যা ও সমাধান

### `python` বা `py` পাওয়া যাচ্ছে না

- python.org থেকে Python আবার ইনস্টল করুন।
- **Add python.exe to PATH**-এ টিক দিন।
- PowerShell বন্ধ করে আবার খুলুন।
- চেষ্টা করুন: `py -3.12 --version`, `python --version`, `python3 --version`।

### `No module named 'django'`

আপনি system Python ব্যবহার করছেন, প্রজেক্টের `.venv` নয়। Linux-এ:

```bash
cd ~/fiber-map
.venv/bin/python manage.py check
```

অথবা আগে virtual environment চালু করুন:

```bash
source .venv/bin/activate
python manage.py check
```

Windows-এ:

```powershell
.\.venv\Scripts\python.exe manage.py check
```

`manage.py` এখন `.venv` থাকলে নিজে থেকেই সেই Python দিয়ে আবার চালু হয়, তবু উপরের কমান্ডগুলো সবচেয়ে নিরাপদ।

### `Unknown command: 'admin'`

`manage.py admin` নামে কোনো কমান্ড নেই। পাসওয়ার্ড বদলাতে:

```bash
.venv/bin/python manage.py changepassword admin
```

Windows:

```powershell
.\.venv\Scripts\python.exe manage.py changepassword admin
```

অন্য ইউজারের জন্য একইভাবে `changepassword <username>` লিখুন।

### PowerShell বলছে “running scripts is disabled”

Virtual environment activate করার দরকার নেই। সরাসরি লিখুন:

```powershell
.\.venv\Scripts\python.exe run.py
```

অথবা শুধু এই PowerShell উইন্ডোর জন্য অনুমতি দিন:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### `mysqlclient` ইনস্টল হচ্ছে না

Linux:

```bash
sudo apt install -y build-essential pkg-config python3-dev default-libmysqlclient-dev
.venv/bin/python -m pip install mysqlclient==2.3.0
```

Windows:

- **Microsoft C++ Build Tools** ইনস্টল করুন, **Desktop development with C++** নির্বাচন করুন, তারপর আবার চেষ্টা করুন।
- অথবা Python 3.12 ব্যবহার করুন; এতে prebuilt `mysqlclient` wheel পাওয়া যায়।
- প্রজেক্টের `.venv` Python ব্যবহার করছেন—এটা নিশ্চিত করুন।

### MySQL-এ কানেক্ট হচ্ছে না

Linux:

```bash
sudo systemctl status mysql
```

Windows: XAMPP Control Panel খুলে **MySQL** Start করুন।

চেক:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -h 127.0.0.1 -u root -e "SELECT 1;"
```

```bash
mysql -h 127.0.0.1 -u fibermap -p -e "SELECT 1;"
```

### `Access denied for user` বা `Unknown database`

- `site_config.json`-এ ইউজারনেম, পাসওয়ার্ড, ডেটাবেসের নাম ঠিক আছে কি না দেখুন।
- ডেটাবেস তৈরি আছে কি না দেখুন।
- Linux-এ ডেটাবেসের নাম case-sensitive।
- XAMPP লোকাল টেস্টে root পাসওয়ার্ড সাধারণত খালি: `"db_password": ""`।
- পাবলিক সার্ভারে `localhost` এবং `127.0.0.1`—দুই হোস্টের জন্যই ইউজার তৈরি করুন।

### `Port 5003 is already in use`

```bash
python run.py --port 5004
```

Windows:

```powershell
.\.venv\Scripts\python.exe run.py --port 5004
```

Management → Site & branding থেকেও পোর্ট বদলানো যায়। supervisor নিজে রিস্টার্ট হবে।

### পেজ খুলছে কিন্তু CSS/JS নেই

```bash
.venv/bin/python manage.py collectstatic --noinput
```

Windows:

```powershell
.\.venv\Scripts\python.exe manage.py collectstatic --noinput
```

তারপর অ্যাপ রিস্টার্ট করুন।

### ডোমেইনে দেওয়ার পর `DisallowedHost` / Bad Request

`.env`-এ ডোমেইন যোগ করুন:

```dotenv
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com,127.0.0.1
```

তারপর সার্ভিস রিস্টার্ট করুন।

### ম্যাপের টাইল লোড হচ্ছে না

ব্রাউজার থেকে `google.com`-এ যাওয়া যাচ্ছে কি না দেখুন। কর্পোরেট ফায়ারওয়াল, অ্যাড-ব্লকার বা কিছু নেটওয়ার্ক Google টাইল ব্লক করতে পারে। অ্যাপের বাকি অংশ তখনও কাজ করবে।

### জায়গার নাম সার্চে কিছু আসছে না

লোকাল রেকর্ড সার্চ এবং coordinate সার্চ ইন্টারনেট ছাড়াও কাজ করে। বিশ্বের জায়গার সার্চের জন্য সার্ভার থেকে `nominatim.openstreetmap.org`-এ যাওয়া যেতে হবে। সার্ভারের আউটবাউন্ড ইন্টারনেট ও ফায়ারওয়াল চেক করুন।

### অ্যাডমিন পাসওয়ার্ড ভুলে গেছি

```bash
.venv/bin/python manage.py changepassword admin
```

Windows:

```powershell
.\.venv\Scripts\python.exe manage.py changepassword admin
```

### `admin` / `$uper` দিয়ে লগইন হচ্ছে না

**বর্তমান** `demo/fiber-map-demo.sql`-এ একটিই অ্যাডমিন আছে, `admin`; পাসওয়ার্ড `$uper`। পুরনো ডেমো ফাইলে অচল পাসওয়ার্ড বা অতিরিক্ত `$uperadmin` থাকতে পারে, তাই পুরনো ফাইল ইমপোর্ট করলে `$uper` কাজ করবে না।

অ্যাপ কোন ডেটাবেস ব্যবহার করছে এবং ইউজারটি আছে কি না দেখুন:

```bash
grep db_name site_config.json

.venv/bin/python manage.py shell -c 'from django.contrib.auth import get_user_model; U=get_user_model(); print(list(U.objects.filter(username="admin").values_list("username", "is_active", "is_superuser")))'
```

তালিকা খালি হলে ডেমো ইমপোর্ট করুন অথবা `/setup/` চালান। ইউজার থাকলে পাসওয়ার্ড রিসেট করুন:

```bash
.venv/bin/python manage.py changepassword admin
```

দুবার `$uper` লিখুন। তারপর সরাসরি API পরীক্ষা করুন:

```bash
curl -i -X POST http://127.0.0.1:5003/api/login/ \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"$uper"}'
```

- **200 + token** → পাসওয়ার্ড ঠিক; ব্রাউজারের site data / `localStorage` পরিষ্কার করে আবার লগইন করুন।
- **400 Bad Request** → পাসওয়ার্ড ভুল, ইউজার inactive/নেই, অথবা অ্যাপ অন্য ডেটাবেসে যুক্ত।
- **Connection refused** → অ্যাপটি ওই পোর্টে চলছে না।

Windows-এ `.venv/bin/python`-এর জায়গায় `.\.venv\Scripts\python.exe` ব্যবহার করুন। `site_config.json`-এ অন্য ডেটাবেসের নাম থাকলে ইউজারটি **সেই** ডেটাবেসে থাকতে হবে।

### Setup page বারবার আসছে

- MySQL চালু আছে এবং ডেটাবেস তৈরি আছে কি না দেখুন।
- `site_config.json`-এ সঠিক ডেটাবেস/ইউজার/পাসওয়ার্ড দিন।
- অ্যাপ একবার রিস্টার্ট করুন।
- টার্মিনালের এরর মেসেজ দেখুন; `run.py` migration ব্যর্থ হলে কারণ দেখায়।

### Linux সার্ভিস চালু হচ্ছে না

```bash
sudo systemctl status fiber-map
sudo journalctl -u fiber-map -n 100 --no-pager
```

সাধারণ কারণ: ভুল `site_config.json`, MySQL বন্ধ, অথবা প্রজেক্ট ফোল্ডার `fibermap` ইউজারের মালিকানায় নেই।

### ব্যাকআপ ও রিস্টোর

UI: **Management → Database → Download .sql backup**।

কমান্ড লাইন:

```bash
mysqldump -u fibermap -p --default-character-set=utf8mb4 \
  --single-transaction --routines --triggers fiber_map > backup-$(date +%F).sql

mysql -u fibermap -p fiber_map < backup-2026-10-27.sql
```

---

## ৯. কনফিগারেশন

সহজ উপায় হলো `site_config.json`। `.env` ঐচ্ছিক; সেখানে থাকা মান আগে 적용 হয়।

| মান | ডিফল্ট | অর্থ |
| --- | --- | --- |
| `port` | `5003` | `run.py`-এর web port |
| `db_name` | `fiber_map` | MySQL ডেটাবেস |
| `db_user` | `root` | MySQL ইউজার |
| `db_password` | খালি | MySQL পাসওয়ার্ড |
| `db_host` | `127.0.0.1` | MySQL হোস্ট |
| `db_port` | `3306` | MySQL পোর্ট |
| `secret_key` | নিজে তৈরি হয় | গোপন রাখুন |
| `DJANGO_DEBUG` | `0` | প্রোডাকশনে `0` |
| `DJANGO_ALLOWED_HOSTS` | `*` | প্রোডাকশনে নিজের ডোমেইন দিন |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | খালি | HTTPS origin দিন |
| `REACT_APP_MAP_CENTER_LAT` | `23.8103` | ম্যাপের ডিফল্ট অক্ষাংশ |
| `REACT_APP_MAP_CENTER_LNG` | `90.4125` | ম্যাপের ডিফল্ট দ্রাঘিমাংশ |
| `REACT_APP_MAP_ZOOM` | `13` | ডিফল্ট জুম |
| `REACT_APP_MAX_GPS_DISTANCE_KM` | `500` | GPS সীমা; `0` দিলে বন্ধ |
| `DJANGO_TRUST_X_FORWARDED_PROTO` | বন্ধ | TLS প্রক্সির পেছনে থাকলে চালু করুন |
| `DJANGO_SECURE_COOKIES` | বন্ধ | শুধু HTTPS-এ cookie পাঠাবে |
| `DJANGO_SECURE_SSL_REDIRECT` | বন্ধ | HTTP → HTTPS রিডাইরেক্ট |
| `DJANGO_SECURE_HSTS_SECONDS` | `0` | HSTS সময়; `0` মানে বন্ধ |

শেষ চারটি শুধু HTTPS-এ চলা ইনস্টলেশনের জন্য (Nginx/Apache সামনে থাকলে)।
সাধারণ HTTP ইনস্টলেশনে এগুলো খালি রাখুন।

### টেস্ট চালানো

টেস্টগুলো in-memory SQLite ব্যবহার করে, তাই আপনার MySQL ডেটা স্পর্শ করে না:

```bash
python manage.py test --settings=fibermap.test_settings
```

`run.py`-এর দরকারি অপশন:

```bash
python run.py                     # সাধারণ প্রোডাকশন স্টার্ট
python run.py --port 8080         # পোর্ট বদলে সেভ করবে
python run.py --host 127.0.0.1    # শুধু লোকাল / Nginx-এর পেছনে
python run.py --debug             # ডেভেলপমেন্ট মোড
python run.py --no-migrate        # migration ছাড়া
python run.py --once              # auto-restart supervisor ছাড়া
```

এই ফাইলগুলো কখনো পাবলিক করবেন না:

- `site_config.json`
- `.env`
- ডেটাবেস ডাম্প
- `media/`-এর আপলোড
- লগ ও ক্যাশ

---

## ১০. নিরাপত্তা চেকলিস্ট

- ডেমো অ্যাডমিনের পাসওয়ার্ড বদলান।
- `root`-এর বদলে আলাদা MySQL ইউজার ব্যবহার করুন।
- `DJANGO_DEBUG=0` রাখুন।
- `DJANGO_ALLOWED_HOSTS`-এ আসল ডোমেইন দিন।
- `DJANGO_CSRF_TRUSTED_ORIGINS` এবং `DJANGO_CORS_ALLOWED_ORIGINS` সেট করুন।
- HTTPS চালু করুন।
- `site_config.json`, `.env`, ডেটাবেস ব্যাকআপ এবং `media/` গোপন রাখুন।
- MySQL বা 5003 পোর্ট ইন্টারনেটে খুলবেন না।
- নিয়মিত ডেটাবেস ব্যাকআপ নিন।

---

## ১১. লাইসেন্স

MIT। বিস্তারিত `LICENSE` ফাইলে।

তৈরি ও maintained by **johirxofficial**।
