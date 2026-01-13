# ⚙️ Config — Конфигурационные файлы

Папка для хранения конфигураций проекта.

## Планируемые файлы:

### 🔐 Переменные окружения:
```javascript
// config/env.js
module.exports = {
    PORT: process.env.PORT || 3000,
    ADMIN_PHONE: process.env.ADMIN_PHONE || '77085888664',
    NODE_ENV: process.env.NODE_ENV || 'development',
    TIMEZONE: 'Asia/Almaty'
};
```

### 📱 WhatsApp настройки:
```javascript
// config/whatsapp.js
module.exports = {
    authStrategy: 'local',
    puppeteerOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    sessionPath: '.wwebjs_auth'
};
```

### 📧 Email настройки:
```javascript
// config/email.js (для будущего)
module.exports = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};
```

### 🗄 База данных (для будущего):
```javascript
// config/database.js
module.exports = {
    development: {
        host: 'localhost',
        database: 'snakkong_dev',
        username: 'root',
        password: ''
    },
    production: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASS
    }
};
```

---

## 🔒 Безопасность:

**ВАЖНО:** Не храните секретные данные в git!

Создайте `.env` файл в корне проекта:

```bash
# .env (не коммитить!)
PORT=3000
ADMIN_PHONE=77085888664
NODE_ENV=production

# Email (для будущего)
EMAIL_USER=info@snakkong.ru
EMAIL_PASS=your_password

# Database (для будущего)
DB_HOST=localhost
DB_NAME=snakkong
DB_USER=admin
DB_PASS=secret_password
```

Затем используйте через `dotenv`:
```javascript
require('dotenv').config();
const phone = process.env.ADMIN_PHONE;
```

---

Пока папка пустая — файлы будут добавлены по мере развития проекта.
