// ============================================
// SNAKKONG Server with Security Enhancements
// ============================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');
const winston = require('winston');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ============================================
// WINSTON LOGGER
// ============================================
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
        })
    ),
    transports: [
        // Ошибки в отдельный файл
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Все логи
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Заказы в отдельный файл
        new winston.transports.File({ 
            filename: 'logs/orders.log',
            level: 'info',
            maxsize: 5242880,
            maxFiles: 10
        })
    ]
});

// В development режиме также выводим в консоль
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PHONE = process.env.ADMIN_PHONE || '77085888664';
const TIMEZONE = process.env.TIMEZONE || 'Asia/Almaty';

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// GZIP Compression для производительности
app.use(compression());

// Helmet для безопасности заголовков (CSP отключен для совместимости)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
}));

// Rate Limiting для API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 20, // максимум 20 запросов
    message: { success: false, message: 'Слишком много запросов. Попробуйте через 15 минут.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Специальный лимит для заказов (более строгий)
const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // максимум 5 заказов
    message: { success: false, message: 'Слишком много заказов. Попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS настройки
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://snakkong.ru', 'https://www.snakkong.ru']
        : '*',
    credentials: true
}));

// Body parser с ограничением размера
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Статические файлы с кэшированием
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true
}));

// Применить rate limiting ко всем API роутам
app.use('/api/', apiLimiter);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Функция санитизации текста
const sanitize = (text) => {
    if (!text) return '';
    return sanitizeHtml(text, {
        allowedTags: [],
        allowedAttributes: {}
    }).trim();
};

// Функция валидации заказа
const validateOrder = (data) => {
    const errors = [];
    
    // Проверка наличия данных
    if (!data || typeof data !== 'object') {
        return ['Неверный формат данных'];
    }
    
    // Имя: 2-50 символов, только буквы, пробелы и дефисы
    if (!data.name || data.name.length < 2 || data.name.length > 50) {
        errors.push('Имя должно быть от 2 до 50 символов');
    } else if (!/^[а-яА-ЯёЁa-zA-Z\s\-]+$/.test(data.name)) {
        errors.push('Имя должно содержать только буквы');
    }
    
    // Телефон: валидный формат
    if (!data.phone) {
        errors.push('Укажите телефон');
    } else {
        const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
        // Проверка для казахстанских и российских номеров
        if (!/^(\+7|8|7)\d{10}$/.test(cleanPhone)) {
            errors.push('Неверный формат телефона');
        }
    }
    
    // Адрес: 10-200 символов
    if (!data.address || data.address.length < 10 || data.address.length > 200) {
        errors.push('Адрес должен быть от 10 до 200 символов');
    }
    
    // Товары: минимум 1, максимум 10
    if (!data.flavors || !Array.isArray(data.flavors) || data.flavors.length === 0) {
        errors.push('Выберите хотя бы один товар');
    } else if (data.flavors.length > 10) {
        errors.push('Максимум 10 позиций в заказе');
    } else {
        // Проверка каждого товара
        const validFlavors = ['Classic', 'Spicy', 'BBQ'];
        data.flavors.forEach((f, index) => {
            if (!f || typeof f !== 'object') {
                errors.push(`Неверный формат товара #${index + 1}`);
                return;
            }
            if (!validFlavors.includes(f.name)) {
                errors.push(`Неверный товар: ${f.name}`);
            }
            if (!Number.isInteger(f.qty) || f.qty < 1 || f.qty > 99) {
                errors.push(`Неверное количество для ${f.name} (должно быть 1-99)`);
            }
        });
    }
    
    // Комментарий: максимум 500 символов
    if (data.comment && data.comment.length > 500) {
        errors.push('Комментарий слишком длинный (максимум 500 символов)');
    }
    
    return errors;
};

// ============================================
// WHATSAPP CLIENT
// ============================================

let whatsappReady = false;
let whatsappClient = null;

console.log('🚀 Запуск сервера SNAKKONG...');
console.log('📱 Инициализация WhatsApp бота...\n');

// Инициализация WhatsApp клиента
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// QR код для авторизации
client.on('qr', (qr) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📲 ОТСКАНИРУЙТЕ QR-КОД В WHATSAPP:');
    console.log('   WhatsApp → Связанные устройства → Привязать устройство');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    qrcode.generate(qr, { small: true });
    console.log('\n');
});

// Успешная авторизация
client.on('ready', () => {
    whatsappReady = true;
    whatsappClient = client;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ WhatsApp подключен и готов к работе!');
    console.log(`📞 Уведомления будут отправляться на: +${ADMIN_PHONE}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Ошибка авторизации
client.on('auth_failure', (msg) => {
    console.error('❌ Ошибка авторизации WhatsApp:', msg);
});

// Отключение с автопереподключением
client.on('disconnected', (reason) => {
    whatsappReady = false;
    console.log('⚠️ WhatsApp отключен:', reason);
    
    // Попытка переподключения через 5 секунд
    setTimeout(() => {
        console.log('🔄 Попытка переподключения...');
        try {
            client.initialize();
        } catch (error) {
            console.error('❌ Ошибка переподключения:', error.message);
        }
    }, 5000);
});

// Запуск клиента
client.initialize();

// Функция отправки сообщения с таймаутом
const sendWhatsAppMessage = async (chatId, message, timeout = 10000) => {
    return Promise.race([
        whatsappClient.sendMessage(chatId, message),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WhatsApp timeout')), timeout)
        )
    ]);
};

// ============================================
// API ENDPOINTS
// ============================================

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Статус WhatsApp
app.get('/api/status', (req, res) => {
    res.json({
        whatsapp: whatsappReady,
        message: whatsappReady ? 'WhatsApp подключен' : 'WhatsApp не подключен',
        server: 'online',
        timestamp: new Date().toISOString()
    });
});

// Health Check для мониторинга
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: Math.floor(process.uptime()),
        timestamp: Date.now(),
        whatsapp: whatsappReady,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

// Прием заказа (с rate limiting и валидацией)
app.post('/api/order', orderLimiter, async (req, res) => {
    try {
        // Валидация данных
        const errors = validateOrder(req.body);
        if (errors.length > 0) {
            console.log('⚠️ Ошибка валидации:', errors.join(', '));
            return res.status(400).json({
                success: false,
                message: errors.join(', '),
                errors: errors
            });
        }

        // Санитизация данных
        const sanitizedData = {
            name: sanitize(req.body.name),
            phone: sanitize(req.body.phone),
            address: sanitize(req.body.address),
            flavors: req.body.flavors.map(f => ({
                name: sanitize(f.name),
                qty: parseInt(f.qty, 10)
            })),
            comment: req.body.comment ? sanitize(req.body.comment) : ''
        };

        // Формируем сообщение для WhatsApp
        const orderDate = new Date().toLocaleString('ru-RU', {
            timeZone: TIMEZONE,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const flavorsText = sanitizedData.flavors
            .map(f => `  • ${f.name}: ${f.qty} шт.`)
            .join('\n');

        const totalQty = sanitizedData.flavors.reduce((sum, f) => sum + f.qty, 0);

        const message = `
🔥 *НОВЫЙ ЗАКАЗ SNAKKONG* 🔥

📅 *Дата:* ${orderDate}

👤 *Клиент:* ${sanitizedData.name}
📞 *Телефон:* ${sanitizedData.phone}
📍 *Адрес:* ${sanitizedData.address}

🍖 *Заказ:*
${flavorsText}

📦 *Всего:* ${totalQty} шт.

${sanitizedData.comment ? `💬 *Комментарий:* ${sanitizedData.comment}` : ''}
━━━━━━━━━━━━━━━━━━━━━
        `.trim();

        console.log('\n📥 Получен новый заказ:');
        console.log(`   Клиент: ${sanitizedData.name}`);
        console.log(`   Телефон: ${sanitizedData.phone}`);
        console.log(`   Товаров: ${totalQty} шт.`);
        
        // Логируем заказ в файл
        logger.info('Новый заказ', {
            name: sanitizedData.name,
            phone: sanitizedData.phone,
            address: sanitizedData.address,
            items: sanitizedData.flavors,
            totalQty: totalQty,
            comment: sanitizedData.comment || '',
            ip: req.ip
        });

        // Отправляем в WhatsApp с таймаутом
        if (whatsappReady && whatsappClient) {
            try {
                const chatId = `${ADMIN_PHONE}@c.us`;
                await sendWhatsAppMessage(chatId, message);
                console.log('✅ Уведомление отправлено в WhatsApp\n');
            } catch (whatsappError) {
                console.error('❌ Ошибка отправки в WhatsApp:', whatsappError.message);
                logger.error('Ошибка WhatsApp', { error: whatsappError.message });
                // Продолжаем работу, даже если WhatsApp не работает
            }
        } else {
            console.log('⚠️ WhatsApp не подключен, уведомление не отправлено\n');
        }

        // Всегда возвращаем успех (заказ принят)
        res.json({
            success: true,
            message: 'Заказ успешно отправлен!',
            orderId: Date.now()
        });

    } catch (error) {
        console.error('❌ Ошибка обработки заказа:', error);
        logger.error('Ошибка обработки заказа', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при отправке заказа'
        });
    }
});

// Тестовое сообщение
app.post('/api/test', async (req, res) => {
    if (!whatsappReady || !whatsappClient) {
        return res.status(503).json({
            success: false,
            message: 'WhatsApp не подключен. Отсканируйте QR-код.'
        });
    }

    try {
        const chatId = `${ADMIN_PHONE}@c.us`;
        await sendWhatsAppMessage(
            chatId, 
            '🧪 Тестовое сообщение от SNAKKONG бота!\n\nЕсли вы видите это сообщение, значит всё работает! ✅'
        );
        res.json({
            success: true,
            message: 'Тестовое сообщение отправлено!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ошибка отправки: ' + error.message
        });
    }
});

// ============================================
// ERROR HANDLERS
// ============================================

// 404 Handler
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'API endpoint не найден'
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err.stack);
    logger.error('Ошибка сервера', { 
        error: err.message, 
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    // Не показываем детали ошибки в production
    const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Внутренняя ошибка сервера'
        : err.message;
    
    res.status(500).json({
        success: false,
        message: errorMessage
    });
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
    console.log(`\n🌐 Сервер запущен: http://localhost:${PORT}`);
    console.log(`📋 API статус: http://localhost:${PORT}/api/status`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Тест WhatsApp: POST http://localhost:${PORT}/api/test`);
    console.log(`🔒 Security: Helmet ✅ | Rate Limiting ✅ | Sanitization ✅`);
    console.log(`📦 Performance: Compression ✅ | Caching ✅`);
    console.log(`📝 Logging: Winston ✅ (logs/)`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Timezone: ${TIMEZONE}\n`);
    
    logger.info('Сервер запущен', { port: PORT, env: process.env.NODE_ENV || 'development' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Остановка сервера...');
    if (whatsappClient) {
        try {
            await whatsappClient.destroy();
            console.log('✅ WhatsApp клиент остановлен');
        } catch (error) {
            console.error('❌ Ошибка при остановке WhatsApp:', error.message);
        }
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Получен SIGTERM. Остановка сервера...');
    if (whatsappClient) {
        try {
            await whatsappClient.destroy();
        } catch (error) {
            console.error('❌ Ошибка при остановке WhatsApp:', error.message);
        }
    }
    process.exit(0);
});
