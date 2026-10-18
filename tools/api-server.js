const http=require('http');
const fs=require('fs');
const FILE='/var/lib/rwzj/messages.json';
const PORT=8081;
const ADMIN='rwzj-adm-7c41e9b2';
const ALLOWED=['https://renwenzhaji.cn','http://renwenzhaji.cn','https://www.renwenzhaji.cn','http://106.54.209.53'];
function cors(req,res){var o=req.headers.origin;if(o&&ALLOWED.indexOf(o)>=0){res.setHeader('Access-Control-Allow-Origin',o);res.setHeader('Vary','Origin');}res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-Admin-Token');}
function readAll(){try{var a=JSON.parse(fs.readFileSync(FILE,'utf8'));return Array.isArray(a)?a:[];}catch(e){return [];}}
function writeAll(a){fs.writeFileSync(FILE,JSON.stringify(a,null,1));}
function isAdmin(req){return String(req.headers['x-admin-token']||'')===ADMIN;}
var rate=new Map();
http.createServer(function(req,res){
 cors(req,res);
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 var url=req.url.split('?')[0];
 if(url==='/list'&&req.method==='GET'){
  var all=req.url.indexOf('all=1')>0&&isAdmin(req);
  var a=readAll().slice(-300).map(function(m){
   return all?{id:m.id,name:m.name,text:m.text,time:m.time}:{name:m.name,text:m.text,time:m.time};
  });
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  return res.end(JSON.stringify(a));
 }
 if(url==='/del'&&req.method==='POST'){
  if(!isAdmin(req)){res.writeHead(401,{'Content-Type':'application/json'});return res.end('{"error":"auth"}');}
  var b='';
  req.on('data',function(c){b+=c;if(b.length>2000)req.destroy();});
  req.on('end',function(){
   var d={};try{d=JSON.parse(b);}catch(e){}
   var id=String(d.id||'');
   var list=readAll();
   var n=list.length;
   list=list.filter(function(m){return String(m.id)!==id;});
   writeAll(list);
   res.writeHead(200,{'Content-Type':'application/json'});
   res.end(JSON.stringify({ok:true,removed:n-list.length}));
  });
  return;
 }
 if(url==='/post'&&req.method==='POST'){
  var body='';
  req.on('data',function(c){body+=c;if(body.length>4000)req.destroy();});
  req.on('end',function(){
   var d={};try{d=JSON.parse(body);}catch(e){}
   var name=String(d.name||'').replace(/[<>]/g,'').trim().slice(0,20)||'一位读者';
   var text=String(d.text||'').replace(/[<>]/g,'').trim();
   if(text.length<2||text.length>300){res.writeHead(400,{'Content-Type':'application/json'});return res.end('{"error":"length"}');}
   if(/https?:\/\/|www\./i.test(text)){res.writeHead(400,{'Content-Type':'application/json'});return res.end('{"error":"links"}');}
   var ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0];
   var now=Date.now(),last=rate.get(ip)||0;
   if(now-last<60000){res.writeHead(429,{'Content-Type':'application/json'});return res.end('{"error":"slow"}');}
   rate.set(ip,now);
   var list=readAll();
   list.push({id:'m'+now,name:name,text:text,time:new Date().toISOString()});
   writeAll(list);
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
   res.end(JSON.stringify({ok:true}));
  });
  return;
 }
 res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found');
}).listen(PORT,'127.0.0.1',function(){console.log('rwzj-api on '+PORT);});