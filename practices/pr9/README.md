# Практическая работа 9

Фитнес-трекер. Вариант 15. Талгатулы Диас, ИИ-402.

## Запуск

Требуются Node.js 20.19+ и MongoDB. Команды выполняются в этой папке, рядом с package.json.

```powershell
npm ci
Copy-Item .env.example .env
# В .env задайте адрес MongoDB и случайный JWT_SECRET (для практик с JWT).
npm run seed
npm run build
npm start
```

Открыть http://127.0.0.1:3209. Сборка Vue обслуживается Express. В режиме разработки: npm run dev, во втором терминале npm start.

## API

GET /api/items и /api/workouts - список. POST - создание.
GET /api/items/stats - статистика. Для практик 11 и далее: GET, PUT, DELETE /api/items/:id.
Фильтры адаптированы к фитнесу: search, type, minDuration, maxDuration, minCalories, trainer, sort=duration_desc.
Для практики 15: page, limit (1-100), tag, X-Cache и gzip.
/health - состояние подключения к базе.

## Учебные данные

seed добавляет 15 тренировок, только если коллекция пуста. Ничего не удаляет.
Для практик с аккаунтами: client@example.test и trainer@example.test, пароль DemoPass123!.
Это демонстрационные аккаунты. Публичная регистрация создаёт только client. Выдать trainer локально: node scripts/promote-trainer.js email.
Практика 13 отдельно демонстрирует X-User-Role, как требует условие; её нельзя публиковать как защищённый сервер.
Практики 14 и далее используют подписанный JWT, не доверяют X-User-Role.

## Проверки

Импортировать postman_collection.json в Postman и запустить коллекцию. baseUrl по умолчанию http://127.0.0.1:3209.
MongoDB shell: mongosh "mongodb://127.0.0.1:27017/lab7_variant15" scripts/mongo-demo.js.
.env с реальными секретами и node_modules в комплект не входят.

## Облако

Для Vercel задать VITE_API_URL равным адресу Render без завершающего слеша.
Для Render: npm install, npm run build, npm start; переменные MONGO_URL, JWT_SECRET, ALLOWED_ORIGINS, NODE_ENV=production.
В ALLOWED_ORIGINS указать точный домен Vercel. Процесс один: проверка пересечений сериализует запись внутри процесса; для нескольких экземпляров нужны распределённые блокировки.
