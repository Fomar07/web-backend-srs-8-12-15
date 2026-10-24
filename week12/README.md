# СРС 12 Фитнес-трекер

## Запуск
1. Установить Node.js 22 или новее.
2. Выполнить npm install.
3. Скопировать .env.example в .env.
4. Запустить MongoDB и указать MONGO_URI. Для подготовленной локальной базы порт 27128, стандартный порт MongoDB 27017.

Запустить npm start. Адрес API http://127.0.0.1:3112.

## Проверка
В .env задать TEST_MONGO_URI отдельной тестовой базы, например mongodb://127.0.0.1:27017/fitness_srs12_test.
Выполнить npm test. Проверено HTTP-сценариев: 19. Тест сам запускает и останавливает сервер, создаёт только учебные записи.

postman_collection.json импортируется в Postman. В переменной baseUrl установить адрес запущенного API.

## MongoDB Compass
Подключение: mongodb://127.0.0.1:27017, база fitness_srs12. Для подготовленной среды использовать порт 27128. Коллекция workouts. Проверить Documents и Indexes.

## GitHub
Не помещать JWT_SECRET, пароли и дампы личных данных в Git. Репозиторий: https://github.com/Fomar07/web-backend-srs-8-12-15/tree/main/week12.

