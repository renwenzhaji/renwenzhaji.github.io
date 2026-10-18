const http=require('http');
const fs=require('fs');
const FILE='/var/lib/rwzj/messages.json';
const PORT=8081;
const ALLOWED=['https://renwenzhaji.cn','http://renwenzhaji.cn','https://www.renwenzhaji.cn','http://106.54.209.53'];
function cors(req,res){var o=req.headers.origin;if(o&&ALLOWED.indexOf(o)>=0){res.setHeader('Access-Control-Allow-Origin',o);res.setHeader('Vary','Origin');}res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
function readAll(){try{var a=JSON.parse(fs.readFileSync(FILE,'utf8'));return Array.isArray(a)?a:[];}catch(e){return [];}}
function writeAll(a){fs.writeFileSync(FILE,JSON.stringify(a,null,1));}
var rate=new Map();
http.createServer(function(req,res){
 cors(req,res);
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 if(req.url.indexOf('/list')===0&&req.method==='GET'){
  var a=readAll().slice(-200).map(function(m){return {name:m.name,text:m.text,time:m.time};});
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
  return res.end(JSON.stringify(a));
 }
 if(req.url.indexOf('/post')===0&&req.method==='POST'){
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
   list.push({name:name,text:text,time:new Date().toISOString()});
   writeAll(list);
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
   res.end(JSON.stringify({ok:true}));
  });
  return;
 }
 res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found');
}).listen(PORT,'127.0.0.1',function(){console.log('rwzj-api listening on '+PORT);});