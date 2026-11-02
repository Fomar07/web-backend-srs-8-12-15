// Выполнить: mongosh "mongodb://127.0.0.1:27017/ИМЯ_БД" scripts/mongo-demo.js
print('База: '+db.getName());
printjson(db.workouts.find().limit(5).toArray());
const created=db.workouts.insertOne({type:'Тест CRUD',duration:25,calories:100,date:new Date()});
printjson(created);
printjson(db.workouts.updateOne({_id:created.insertedId},{$set:{duration:30}}));
printjson(db.workouts.findOne({_id:created.insertedId}));
printjson(db.workouts.deleteOne({_id:created.insertedId}));
printjson(db.workouts.find({duration:{$gt:30}}).limit(3).toArray());
printjson(db.workouts.find({exercises:{$in:['Планка']}}).limit(2).toArray());
printjson(db.workouts.getIndexes());
printjson(db.workouts.aggregate([{$group:{_id:'$type',count:{$sum:1},avgDuration:{$avg:'$duration'}}}]).toArray());
printjson(db.workouts.aggregate([{$lookup:{from:'trainers',localField:'trainerId',foreignField:'_id',as:'trainerData'}},{$limit:2}]).toArray());
