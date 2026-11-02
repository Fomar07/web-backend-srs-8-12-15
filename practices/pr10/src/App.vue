<script setup>
import {ref,reactive,onMounted} from 'vue';
import lab from '../lab.json';
const API=import.meta.env.VITE_API_URL||'';
const items=ref([]),stats=ref([]),error=ref(''),notice=ref(''),busy=ref(false),profile=ref(null);
const token=ref(localStorage.getItem('fitness-token-'+lab.number)||'');
const filters=reactive({search:'',type:'',minDuration:'',sort:'duration_desc',page:1,limit:5});
const pagination=ref({total:0,page:1,pages:0});
const form=reactive({id:'',type:'',duration:40,calories:250,date:'2026-12-01T10:00',trainer:'Самостоятельно'});
const credentials=reactive({email:'client@example.test',password:'DemoPass123!'});
const role=ref('client'); const counters=reactive({ok:0,limited:0});
async function request(path,options={}){
 const headers={...options.headers};
 if(options.body)headers['Content-Type']='application/json';
 if(token.value)headers.Authorization='Bearer '+token.value;
 if(lab.stage===13)headers['X-User-Role']=role.value;
 const res=await fetch(API+path,{...options,headers});
 if(res.status===204)return null;
 const data=await res.json();if(!res.ok)throw new Error(data.error||'Ошибка '+res.status);return data;
}
async function load(){
 busy.value=true;error.value='';
 try{
  const query=new URLSearchParams(Object.entries(filters).filter(([k,v])=>v!==''));
  const data=await request('/api/items?'+query);
  items.value=Array.isArray(data)?data:data.items;
  pagination.value=data.pagination||{total:items.value.length,page:1,pages:1};
  stats.value=await request('/api/items/stats');
 }catch(e){error.value=e.message;}finally{busy.value=false;}
}
function reset(){Object.assign(form,{id:'',type:'',duration:40,calories:250,date:'2026-12-01T10:00',trainer:'Самостоятельно'});}
async function save(){error.value='';notice.value='';try{
 const {id,...data}=form;data.date=new Date(data.date).toISOString();
 await request('/api/items'+(id?'/'+id:''),{method:id?'PUT':'POST',body:JSON.stringify(data)});
 notice.value=id?'Изменения сохранены':'Тренировка добавлена';reset();await load();
}catch(e){error.value=e.message;}}
function edit(w){Object.assign(form,{id:w._id,type:w.type,duration:w.duration,calories:w.calories,date:new Date(+new Date(w.date)-new Date(w.date).getTimezoneOffset()*60000).toISOString().slice(0,16),trainer:w.trainer||'Самостоятельно'});}
async function remove(w){try{await request('/api/items/'+w._id,{method:'DELETE'});notice.value='Тренировка удалена';await load();}catch(e){error.value=e.message;}}
async function login(register=false){error.value='';try{
 const result=await request('/api/auth/'+(register?'register':'login'),{method:'POST',body:JSON.stringify(credentials)});
 if(register){notice.value='Регистрация выполнена. Теперь войдите';return;}
 profile.value=result.user||result;
 if(result.token){token.value=result.token;localStorage.setItem('fitness-token-'+lab.number,result.token);}
 notice.value='Вход выполнен';
}catch(e){error.value=e.message;}}
function logout(){token.value='';profile.value=null;localStorage.removeItem('fitness-token-'+lab.number);notice.value='Выход выполнен';}
async function assign(){try{const d=await request('/api/workouts/assign',{method:'POST',body:JSON.stringify({program:'Кардио и мобильность'})});notice.value=d.message;}catch(e){error.value=e.message;}}
async function burst(){counters.ok=0;counters.limited=0;for(let i=0;i<8;i++){const r=await fetch(API+'/api/config');if(r.status===429)counters.limited++;else if(r.ok)counters.ok++;}}
function find(){filters.page=1;load();}
onMounted(async()=>{await load();if(token.value){try{profile.value=await request('/api/auth/profile');}catch{logout();}}});
</script>
<template>
 <header><div class="brand"><span class="mark">F</span>FITNESS<span class="muted">/ дневник активности</span></div><span class="pill">Практика {{lab.number}} · Фитнес</span></header>
 <main><div class="intro"><div><div class="eyebrow">ТРЕНИРОВКИ И ПРОГРЕСС</div><h1>Каждая тренировка имеет значение</h1><p>Планируйте занятия, следите за нагрузкой и выбирайте подходящий ритм.</p></div><div class="metric"><strong>{{pagination.total}}</strong><span>тренировок в выборке</span></div></div>
 <div v-if="error" role="alert" class="alert">{{error}}</div><div v-if="notice" role="status" class="notice">{{notice}}</div>
 <section v-if="lab.stage>=13" class="auth panel"><div><h2>{{profile?'Личный кабинет':'Вход в аккаунт'}}</h2><p>{{profile?profile.email+' · '+profile.role:'Аккаунт открывает доступ к управлению тренировками'}}</p></div>
 <template v-if="!profile"><label>Email<input v-model="credentials.email" type="email"></label><label>Пароль<input v-model="credentials.password" type="password"></label><button @click="login()">Войти</button><button class="secondary" @click="login(true)">Регистрация</button></template>
 <template v-else><button class="secondary" @click="assign">Назначить программу</button><button class="secondary" @click="logout">Выйти</button></template>
 <label v-if="lab.stage===13">Учебная роль<select v-model="role"><option>client</option><option>trainer</option></select></label></section>
 <section v-if="lab.stage>=11" class="panel"><h2>{{form.id?'Редактирование':'Новая тренировка'}}</h2><form @submit.prevent="save" class="form"><label>Тип<input v-model="form.type" required minlength="2" placeholder="Например, плавание"></label><label>Минуты<input v-model.number="form.duration" type="number" min="1" max="300" required></label><label>Калории<input v-model.number="form.calories" type="number" min="0"></label><label>Дата и время<input v-model="form.date" type="datetime-local" required></label><label>Тренер<input v-model="form.trainer"></label><button>{{form.id?'Сохранить':'Добавить'}}</button><button v-if="form.id" type="button" class="secondary" @click="reset">Отмена</button></form></section>
 <section class="panel"><div class="section-title"><h2>Журнал тренировок</h2><button class="secondary" @click="load">{{busy?'Загрузка…':'Обновить'}}</button></div>
 <form v-if="lab.stage>=9" @submit.prevent="find" class="filters"><label>Поиск<input v-model="filters.search" placeholder="Тип тренировки"></label><label>Тип<select v-model="filters.type"><option value="">Все типы</option><option>Бег</option><option>Плавание</option><option>Силовая</option><option>Йога</option><option>Велосипед</option></select></label><label>От, минут<input v-model="filters.minDuration" type="number" min="0" placeholder="0"></label><label>Порядок<select v-model="filters.sort"><option value="duration_desc">Сначала длинные</option><option value="duration_asc">Сначала короткие</option><option value="type">По типу</option></select></label><button>Найти</button></form>
 <table><thead><tr><th>Тренировка</th><th>Длительность</th><th>Энергия</th><th>Дата</th><th>Тренер</th><th v-if="lab.stage>=11">Действия</th></tr></thead><tbody><tr v-for="w in items" :key="w._id"><td><span class="activity-dot"></span><b>{{w.type}}</b><small v-if="w.exercises?.length">{{w.exercises.join(', ')}}</small></td><td>{{w.duration}} мин</td><td>{{w.calories}} ккал</td><td>{{new Date(w.date).toLocaleDateString('ru-RU')}}</td><td>{{w.trainerData?.name||w.trainer||'Самостоятельно'}}</td><td v-if="lab.stage>=11"><button class="text" @click="edit(w)">Изменить</button><button class="text danger" @click="remove(w)">Удалить</button></td></tr></tbody></table><p v-if="!items.length&&!busy">По этим условиям тренировок нет.</p>
 <div v-if="lab.stage>=15" class="pager"><button class="secondary" :disabled="filters.page<=1" @click="filters.page--;load()">Назад</button><span>Страница {{pagination.page}} из {{pagination.pages||1}} · Всего {{pagination.total}}</span><button class="secondary" :disabled="filters.page>=pagination.pages" @click="filters.page++;load()">Вперёд</button></div>
 </section><div class="stats"><div v-for="s in stats" :key="s._id" class="stat"><span>{{s._id}}</span><strong>{{Math.round(s.avgDuration)}} <small>мин в среднем</small></strong><p>{{s.count}} занятий · {{s.totalCalories||0}} ккал</p></div></div>
 <section v-if="lab.stage===14.1" class="panel section-title"><div><h2>Проверка ограничения запросов</h2><p>Успешно: {{counters.ok}} · Ограничено (429): {{counters.limited}}</p></div><button @click="burst">Отправить 8 запросов</button></section>
 <footer>Фитнес-трекер · Талгатулы Диас · ИИ-402</footer>
 </main>
</template>
