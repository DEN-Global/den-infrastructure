self.addEventListener('push',event=>{
 let payload={};
 try{payload=event.data?.json()??{};}catch{}
 const target=new URL(typeof payload.url==='string'?payload.url:'/consumer/',self.location.origin);
 if(target.origin!==self.location.origin)target.href='/consumer/';
 const options={body:payload.body??'You have a new DEN update.',icon:'/den-pet-icon.jpg',badge:'/den-pet-icon.jpg',tag:payload.tag??'den-alert',data:{url:target.href}};
 event.waitUntil(self.registration.showNotification(payload.title??'DEN update',options));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=new URL(event.notification.data?.url??'/consumer/',self.location.origin);
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(client=>new URL(client.url).origin===self.location.origin);
  if(existing){await existing.navigate(target.href);return existing.focus();}
  return self.clients.openWindow(target.href);
 })());
});
