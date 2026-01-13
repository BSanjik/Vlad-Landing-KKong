# 🔥 SNAKKONG — Лендинг с WhatsApp интеграцией

Современный лендинг для продажи куриных джерки с автоматическими уведомлениями в WhatsApp.

![SNAKKONG](https://img.shields.io/badge/Made%20with-Node.js-green)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Bot-25D366)
![SEO](https://img.shields.io/badge/SEO-Optimized-blue)

---

## 🚀 Быстрый старт

```bash
# 1. Установите зависимости
npm install

# 2. Настройте номер телефона в server.js (строка 13)
const ADMIN_PHONE = '77085888664';

# 3. Запустите сервер
npm start

# 4. Отсканируйте QR-код в WhatsApp

# 5. Откройте http://localhost:3000
```

---

## 📁 Структура проекта

```
Vlad-Landing-KKong/
├── 📂 public/                  # Статические файлы
│   ├── 📂 css/
│   │   └── styles.css         # Стили сайта
│   ├── 📂 js/
│   │   └── script.js          # Клиентский JavaScript
│   ├── 📂 images/             # Изображения
│   ├── 📂 assets/             # Другие ресурсы
│   ├── index.html             # Главная страница
│   ├── sitemap.xml            # Карта сайта
│   ├── robots.txt             # Правила для поисковиков
│   ├── manifest.json          # PWA манифест
│   └── .htaccess              # Настройки Apache
│
├── 📂 docs/                    # Документация
│   ├── README.md              # Полная документация
│   └── SEO-CHECKLIST.md       # SEO чек-лист
│
├── 📂 config/                  # Конфигурация (будущее)
│
├── server.js                  # Node.js сервер
├── package.json               # Зависимости
├── .gitignore                 # Git исключения
└── README.md                  # Этот файл
```

---

## 🎯 Возможности

### ✨ Лендинг:
- Современный дизайн с анимациями
- Адаптивная вёрстка
- Форма заказа
- SEO оптимизация

### 📱 WhatsApp:
- Автоматические уведомления
- Бесплатная отправка
- Работа 24/7

### 🔍 SEO:
- Meta теги
- Open Graph
- Structured Data
- Sitemap
- PWA

---

## 🛠 Технологии

- **Node.js** — Backend
- **Express** — Web framework
- **whatsapp-web.js** — WhatsApp API
- **HTML5 / CSS3 / JS** — Frontend

---

## 📖 Документация

Полная документация в папке **`docs/`**:

- **[docs/README.md](docs/README.md)** — Установка, настройка, деплой
- **[docs/SEO-CHECKLIST.md](docs/SEO-CHECKLIST.md)** — План продвижения

---

## ⚙️ Настройки

### Изменить номер телефона:
`server.js` строка 13:
```javascript
const ADMIN_PHONE = '77085888664';
```

### Изменить порт:
`server.js` строка 10:
```javascript
const PORT = process.env.PORT || 3000;
```

### Изменить часовой пояс:
`server.js` строка 91:
```javascript
timeZone: 'Asia/Almaty',
```

---

## 📊 API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/` | GET | Главная страница |
| `/api/status` | GET | Статус WhatsApp |
| `/api/order` | POST | Создать заказ |
| `/api/test` | POST | Тестовое сообщение |

---

## 🐛 Troubleshooting

### Ошибка: "EADDRINUSE port 3000"
```bash
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### WhatsApp не подключается
1. Проверьте интернет
2. Перезапустите сервер
3. Удалите `.wwebjs_auth/` и сканируйте заново

---

## 📞 Контакты

**Email:** info@snakkong.ru  
**WhatsApp:** +7 708 588-86-64

---

## 📄 Лицензия

Made with ❤️ by BSanjik  
© 2026 SNAKKONG

**Удачи! 🚀**
