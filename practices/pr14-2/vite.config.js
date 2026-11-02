const {defineConfig}=require('vite');
const vue=require('@vitejs/plugin-vue');
module.exports=defineConfig({plugins:[vue()],build:{outDir:'dist'},server:{proxy:{'/api':`http://127.0.0.1:${require('./lab.json').port}`}}});
