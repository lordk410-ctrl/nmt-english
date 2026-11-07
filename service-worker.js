"use strict";
const CACHE_NAME="nmt-english-v1.9.2";
const APP_FILES=["./","./index.html","./styles.css","./app.js","./questions.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await Promise.all(APP_FILES.map(async path=>{
   try{const response=await fetch(path,{cache:"reload"});if(response.ok)await cache.put(path,response);}
   catch(error){console.warn("Не удалось обновить файл:",path,error);}
  }));
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith("nmt-english-")&&key!==CACHE_NAME).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  try{
   const response=await fetch(request);
   if(response&&response.ok){
    const url=new URL(request.url);url.search="";
    const key=url.pathname==="/"?"./":url.pathname;
    await cache.put(key,response.clone());
   }
   return response;
  }catch(error){
   const url=new URL(request.url);const key=url.pathname.endsWith("/")?"./":url.pathname;
   const cached=await cache.match(key)||await cache.match(request);
   if(cached)return cached;
   if(request.mode==="navigate")return (await cache.match("./index.html"))||Response.error();
   return Response.error();
  }
 })());
});
