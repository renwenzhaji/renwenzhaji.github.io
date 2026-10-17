(function(){
"use strict";
var d=document,w=window;
var ROOT=d.body.dataset.root||"";
function $(s,c){return (c||d).querySelector(s);}
function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

/* ---------- 轻提示 ---------- */
var toastT;
function toast(msg){
  var t=$("#toast");
  if(!t)return;
  t.textContent=msg;t.classList.add("show");
  clearTimeout(toastT);
  toastT=setTimeout(function(){t.classList.remove("show");},2200);
}

/* ---------- 夜间模式 ---------- */
var tb=$("#theme-toggle");
if(tb){
  var applyTheme=function(t){
    tb.textContent=(t==="dark")?"日间":"夜间";
    var m=$('meta[name="theme-color"]');
    if(m)m.content=(t==="dark")?"#131217":"#F6F4EF";
  };
  applyTheme(d.documentElement.dataset.theme||"light");
  tb.addEventListener("click",function(){
    var t=(d.documentElement.dataset.theme==="dark")?"light":"dark";
    d.documentElement.dataset.theme=t;
    try{localStorage.setItem("rwzj_theme",t);}catch(e){}
    applyTheme(t);
  });
}

/* ---------- 收藏 ---------- */
function favs(){try{return JSON.parse(localStorage.getItem("rwzj_favs")||"[]");}catch(e){return[];}}
function setFavs(a){try{localStorage.setItem("rwzj_favs",JSON.stringify(a));}catch(e){}updateBadge();}
function updateBadge(){
  var b=$("#fav-badge");
  if(!b)return;
  var n=favs().length;
  b.textContent=n;
  b.hidden=(n===0);
}
updateBadge();
var fb=$("#fav-btn");
if(fb){
  var slug=fb.dataset.slug;
  var paint=function(){
    var on=favs().indexOf(slug)>-1;
    fb.classList.toggle("on",on);
    fb.innerHTML=on?"★ 已收藏":"☆ 收藏";
  };
  paint();
  fb.addEventListener("click",function(){
    var a=favs();
    var i=a.indexOf(slug);
    if(i>-1){a.splice(i,1);toast("已从收藏夹移除");}
    else{a.push(slug);toast("已加入收藏夹");}
    setFavs(a);paint();
  });
}
d.addEventListener("click",function(e){
  var b=e.target.closest("[data-unfav]");
  if(!b)return;
  var a=favs();
  var i=a.indexOf(b.dataset.unfav);
  if(i>-1)a.splice(i,1);
  setFavs(a);
  renderFavs();
  toast("已从收藏夹移除");
});
function renderFavs(){
  var box=$("#fav-list");
  if(!box)return;
  var a=favs();
  if(!a.length){
    box.innerHTML='<p class="empty-note">☆<br>收藏夹还是空的。<br>打开任意一篇文章，在工具栏点亮「☆ 收藏」，它就会出现在这里。<br><span class="tip">收藏保存在本机浏览器中，不会上传到任何服务器。</span></p>';
    return;
  }
  var bySlug={};
  ((w.SITE?SITE.articles:[]).concat((w.SITE&&SITE.essays)||[])).forEach(function(x){bySlug[x.slug]=x;});
  box.innerHTML=a.map(function(s){
    var x=bySlug[s];
    if(!x)return"";
    return '<div class="fav-row"><img class="fav-thumb" src="'+ROOT+(x.cover||"")+'" alt="" loading="lazy" width="1600" height="900"><div><a class="t link-anim" href="'+ROOT+x.url+'">'+esc(x.title)+'</a><p class="fav-meta num">'+esc(x.cat)+" · "+x.date+" · "+x.minutes+' 分钟</p></div><button class="tool-btn" type="button" data-unfav="'+s+'">移除</button></div>';
  }).join("");
}
if(d.body.dataset.page==="favorites")renderFavs();

/* ---------- 复制链接 / 复制引用 ---------- */
function copyText(text,okMsg,onFail){
  var ok=function(){toast(okMsg);};
  var fallback=function(){
    var ta=d.createElement("textarea");
    ta.value=text;d.body.appendChild(ta);ta.select();
    var done=false;
    try{done=d.execCommand("copy");}catch(e){}
    d.body.removeChild(ta);
    if(done){toast(okMsg);return;}
    if(onFail){onFail(text);return;}
    toast("复制失败，请手动选中复制");
  };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(ok,fallback);
  }else fallback();
}
/* 复制不了时，直接把文本摊开并选中，让读者手动复制 */
function showCopyBox(afterEl,text,label){
  var el=d.getElementById("copy-fallback");
  if(el&&el.parentNode)el.parentNode.removeChild(el);
  el=d.createElement("p");el.id="copy-fallback";el.className="copy-fallback";
  el.innerHTML=esc(label)+"（长按或点选复制）：<span>"+esc(text)+"</span>";
  afterEl.parentNode.insertBefore(el,afterEl.nextSibling);
  var sp=el.getElementsByTagName("span")[0];
  try{
    if(sp&&w.getSelection){var r=d.createRange();r.selectNodeContents(sp);var s=w.getSelection();s.removeAllRanges();s.addRange(r);}
  }catch(e){}
  setTimeout(function(){if(el&&el.parentNode)el.parentNode.removeChild(el);},45000);
}
var sb=$("#share-btn");
if(sb){
  sb.addEventListener("click",function(){copyText(location.href,"链接已复制，去分享吧",function(t){showCopyBox(sb,t,"文章链接");});});
}
/* 引用格式：作者：《篇名》，《人文札记》，年月日。链接（访问于 日期） */
var cb=$("#cite-btn");
if(cb){
  cb.addEventListener("click",function(){
    var slug=(location.pathname.split("/").pop()||"").replace(/\.html$/,"");
    var a=null;
    (((w.SITE&&SITE.articles)||[]).concat((w.SITE&&SITE.essays)||[])).forEach(function(x){if(x.slug===slug)a=x;});
    var dd=new Date(),p=function(n){return (n<10?"0":"")+n;};
    var today=dd.getFullYear()+"-"+p(dd.getMonth()+1)+"-"+p(dd.getDate());
    var title=a?a.title:(d.title||"").replace(/ · .*$/,"");
    var when=a?a.dateCN:"";
    var cite="洛安：《"+title+"》，《人文札记》，"+when+"。"+location.origin+location.pathname+"（访问于 "+today+"）";
    copyText(cite,"引用格式已复制："+title,function(t){showCopyBox(cb,t,"引用格式");});
  });
}

/* ---------- 分享文案 ---------- */
var pb=$("#promo-btn");
if(pb){
  pb.addEventListener("click",function(){
    var slug=(location.pathname.split("/").pop()||"").replace(/\.html$/,"");
    var a=null;
    (((w.SITE&&SITE.articles)||[]).concat((w.SITE&&SITE.essays)||[])).forEach(function(x){if(x.slug===slug)a=x;});
    var title=a?a.title:(d.title||"").replace(/ · .*$/,"");
    var sf=d.querySelector("p.standfirst");
    var desc=sf?sf.textContent.replace(/\s+/g," ").trim():"";
    var cat=a?a.cat:"";
    var txt=title+"\n"+desc+"\n—— 人文札记 · "+cat+"\n"+location.origin+location.pathname;
    copyText(txt,"分享文案已复制，可直接发到豆瓣、知乎或小红书",function(t){showCopyBox(pb,t,"分享文案");});
  });
}

/* ---------- 字号 ---------- */
function curFs(){var v=parseInt(d.documentElement.dataset.fs||"0",10);return isNaN(v)?0:v;}
function setFs(v){
  if(v==="0")delete d.documentElement.dataset.fs;
  else d.documentElement.dataset.fs=v;
  try{localStorage.setItem("rwzj_fs",v);}catch(e){}
}
var fmin=$("#fs-minus"),fplus=$("#fs-plus");
if(fmin)fmin.addEventListener("click",function(){setFs(String(Math.max(0,curFs()-1)));});
if(fplus)fplus.addEventListener("click",function(){setFs(String(Math.min(2,curFs()+1)));});

/* ---------- 滚动显现（交错入场） + 导航滚动态 ---------- */
var io=("IntersectionObserver"in w)?new IntersectionObserver(function(es){
  es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});
},{threshold:.08,rootMargin:"0px 0px -6% 0px"}):null;
$$(".reveal:not(.in)").forEach(function(el,i){
  el.style.transitionDelay=((i%6)*70)+"ms";
  if(io)io.observe(el);else el.classList.add("in");
});
var siteHead=$("#site-head");
if(siteHead){
  var headState=function(){siteHead.classList.toggle("scrolled",(w.scrollY||0)>10);};
  w.addEventListener("scroll",headState,{passive:true});
  headState();
}

/* ---------- 阅读进度 + 目录高亮 ---------- */
if(d.body.dataset.page==="article"){
  var bar=$("#progress");
  var onScroll=function(){
    var h=d.documentElement;
    var max=h.scrollHeight-w.innerHeight;
    var cur=h.scrollTop||d.body.scrollTop;
    bar.style.width=((max>0?cur/max*100:0))+"%";
  };
  w.addEventListener("scroll",onScroll,{passive:true});
  w.addEventListener("resize",onScroll);
  onScroll();
  var links=$$(".toc a,.toc-m a");
  var hs=$$(".sec-h");
  if(links.length&&hs.length&&"IntersectionObserver"in w){
    var spy=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(en.isIntersecting){
          var id="#"+en.target.id;
          links.forEach(function(a){a.classList.toggle("on",a.getAttribute("href")===id);});
        }
      });
    },{rootMargin:"-15% 0px -70% 0px"});
    hs.forEach(function(h){spy.observe(h);});
  }
}

/* ---------- 首页分类筛选 ---------- */
var filterBox=$("#filter");
if(filterBox){
  var btns=$$("button",filterBox);
  var items=$$("#list .item");
  var featured=$("#featured");
  var applyFilter=function(cat){
    btns.forEach(function(b){b.classList.toggle("on",b.dataset.cat===cat);});
    if(featured)featured.hidden=!!cat;
    items.forEach(function(it){
      it.hidden=cat?(it.dataset.cat!==cat&&!(cat==="交叉学科"&&it.dataset.cross==="1")):it.classList.contains("newest");
    });
  };
  btns.forEach(function(b){b.addEventListener("click",function(){applyFilter(b.dataset.cat);});});
  applyFilter("");
}

/* ---------- 标签页筛选 ---------- */
var tagList=$("#tag-list");
if(tagList&&w.SITE){
  var chips=$$(".chip");
  var cur=$("#tag-current");
  var row=function(x){
    return '<div class="arow"><a class="t link-anim" href="'+ROOT+x.url+'">'+esc(x.title)+'</a><span class="dots"></span><span class="d">'+x.date.slice(5)+"</span></div>";
  };
  var renderTag=function(label,list){
    cur.textContent=label+" · "+list.length+" 篇";
    tagList.innerHTML=list.length?list.map(row).join(""):'<p class="empty-note">这个分类或标签下暂时没有文章。</p>';
  };
  var POOL=(SITE.articles||[]).concat(SITE.essays||[]);
  var byCat=function(c){return POOL.filter(function(x){return c==="交叉学科"?!!x.cross:x.cat===c;});};
  var byTag=function(t){return SITE.articles.filter(function(x){return x.tags.indexOf(t)>-1;});};
  chips.forEach(function(ch){
    ch.addEventListener("click",function(){
      chips.forEach(function(c){c.classList.remove("on");});
      ch.classList.add("on");
      var v=ch.dataset.val;
      var list=(ch.dataset.kind==="cat")?(v?byCat(v):POOL):byTag(v);
      renderTag(ch.dataset.label,list);
    });
  });
  var h=decodeURIComponent(location.hash||"");
  if(h.indexOf("#cat-")===0){
    var c=h.slice(5);
    chips.forEach(function(ch){if(ch.dataset.kind==="cat"&&ch.dataset.val===c)ch.click();});
  }else if(h.indexOf("#tag-")===0){
    var t2=h.slice(5);
    chips.forEach(function(ch){if(ch.dataset.kind==="tag"&&ch.dataset.val===t2)ch.click();});
  }
}

/* ---------- 留言板（后端可切换：Supabase / 自建 API · 断线可暂存补发） ---------- */
var gbForm=$("#gb-form");
if(gbForm){
  var GB=(w.SITE&&SITE.guestbook)||null;
  var gbName=$("#gb-name"),gbText=$("#gb-text"),gbCnt=$("#gb-count"),gbBox=$("#gb-list"),gbBtn=gbForm.querySelector('button[type="submit"]'),gbQNote=$("#gb-queue-note");
  var gbRows=[];
  var GB_Q="rwzj_gb_queue",GB_S="rwzj_gb_sent";
  var gbRd=function(k,d){try{var v=JSON.parse(localStorage.getItem(k)||"");return (v&&v.length!==undefined)?v:d;}catch(e){return d;}};
  var gbWr=function(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  var gbQ=function(){return gbRd(GB_Q,[]);};
  var gbQNote2=function(){
    if(!gbQNote)return;
    var n=gbQ().length;
    if(!n){gbQNote.hidden=true;gbQNote.textContent="";return;}
    gbQNote.hidden=false;
    gbQNote.textContent="⏳ 有 "+n+" 条留言暂存在本机，联网后会自动补发（请不要清除浏览器数据）。";
  };
  var gbQSet=function(q){gbWr(GB_Q,q);gbQNote2();};
  var gbWasSent=function(n,m){var f=n+"|"+m,now=Date.now();return gbRd(GB_S,[]).some(function(x){return x.f===f&&now-(x.t||0)<1800000;});};
  var gbMarkSent=function(n,m){var now=Date.now();var arr=gbRd(GB_S,[]).filter(function(x){return now-(x.t||0)<86400000;});arr.push({f:n+"|"+m,t:now});gbWr(GB_S,arr);};
  var fmtGb=function(t){var dt=new Date(t);var p=function(x){return (x<10?"0":"")+x;};return dt.getFullYear()+"."+p(dt.getMonth()+1)+"."+p(dt.getDate())+" "+p(dt.getHours())+":"+p(dt.getMinutes());};
  var gbRender=function(){
    if(!(gbRows&&gbRows.length)){gbBox.innerHTML='<p class="empty-note">还没有留言。<br>来做第一个吧。</p>';return;}
    gbBox.innerHTML=gbRows.map(function(m){
      var nick=m.nickname||"匿名的读者";
      return '<div class="gb-item"><span class="gb-ava" aria-hidden="true">'+esc(nick.charAt(0))+'</span><div class="gb-main"><p class="gb-meta"><strong>'+esc(nick)+"</strong> · "+fmtGb(m.created_at)+'</p><p class="gb-c">'+esc(m.message)+"</p></div></div>";
    }).join("");
  };
  var gbFetch=function(url,opt,ms){
    opt=opt||{};
    var ctl=(typeof AbortController!=="undefined")?new AbortController():null;
    if(ctl)opt.signal=ctl.signal;
    var tid=setTimeout(function(){if(ctl)ctl.abort();},ms||10000);
    return fetch(url,opt).then(function(r){clearTimeout(tid);return r;},function(e){clearTimeout(tid);throw e;});
  };
  var gbHandleFail=function(r){
    if(r.ok)return true;
    var st=r.status;
    return r.text().then(function(t){
      if(st>=500)throw {net:true};
      throw {net:false,code:st,detail:String(t).slice(0,120)};
    });
  };
  var gbProvider=function(){
    if(!GB)return null;
    if(GB.type==="api"&&GB.endpoint){
      var base=String(GB.endpoint).replace(/\/+$/,"");
      var hd={"Content-Type":"application/json"};
      if(GB.token)hd["Authorization"]="Bearer "+GB.token;
      return {
        kind:"api",
        load:function(limit){
          return gbFetch(base+"?limit="+(limit||200)+"&_="+Date.now(),{headers:hd},9000)
            .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();})
            .then(function(d){return (d&&d.messages)?d.messages:((d&&d.rows)?d.rows:(d instanceof Array?d:[]));});
        },
        add:function(nick,msg){
          return gbFetch(base,{method:"POST",headers:hd,body:JSON.stringify({nickname:nick,message:msg})},12000).then(gbHandleFail);
        }
      };
    }
    if(GB.url&&GB.key){
      var table=GB.table||"guestbook";
      var api=GB.url.replace(/\/+$/,"")+"/rest/v1/"+table;
      var h1={"apikey":GB.key,"Authorization":"Bearer "+GB.key,"Content-Type":"application/json"};
      var h2={"apikey":GB.key,"Authorization":"Bearer "+GB.key,"Content-Type":"application/json","Prefer":"return=minimal"};
      return {
        kind:"supabase",
        load:function(limit){
          return gbFetch(api+"?select=id,nickname,message,created_at&order=created_at.desc&limit="+(limit||200),{headers:h1},9000)
            .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();});
        },
        add:function(nick,msg){
          return gbFetch(api,{method:"POST",headers:h2,body:JSON.stringify({nickname:nick,message:msg})},12000).then(gbHandleFail);
        }
      };
    }
    return null;
  };
  var GBACK=gbProvider();
  if(!GBACK){
    gbBox.innerHTML='<p class="empty-note">留言板后端尚未配置：请在 config.js 里填入后端地址（支持 Supabase 或自建 API）。</p>';
    if(gbBtn)gbBtn.disabled=true;
  }else{
    var gbLoading=false,gbFlushing=false;
    var gbLoad=function(){
      if(gbLoading)return;
      gbLoading=true;
      GBACK.load(200).then(function(rows){
        gbLoading=false;
        gbRows=rows||[];
        gbRender();
        var cl=$("#gb-count-line");
        if(cl)cl.textContent="最新留言 · 共 "+gbRows.length+" 条";
        if(gbQ().length)gbFlush();
      }).catch(function(){
        gbLoading=false;
        var q=gbQ().length;
        gbBox.innerHTML='<p class="empty-note">暂时连不上留言服务器（可能正在唤醒或网络不稳）。<br>'+(q?("本机已暂存 "+q+" 条，联网后会自动补发。"):"你写的内容会先存到本机，联网后自动补发。")+'</p>';
      });
    };
    var gbFlush=function(){
      if(gbFlushing)return;
      if(!gbQ().length)return;
      gbFlushing=true;
      var next=function(){
        var item=gbQ()[0];
        if(!item){gbFlushing=false;gbQNote2();gbLoad();return;}
        if(gbWasSent(item.n,item.m)){gbQSet(gbQ().filter(function(x){return x.i!==item.i;}));next();return;}
        GBACK.add(item.n,item.m).then(function(){
          gbMarkSent(item.n,item.m);
          gbQSet(gbQ().filter(function(x){return x.i!==item.i;}));
          toast("已补发 1 条暂存的留言");
          next();
        }).catch(function(){gbFlushing=false;gbQNote2();});
      };
      next();
    };
    var gbQueueAdd=function(nick,msg){
      var arr=gbQ();
      arr.push({i:String(Date.now())+Math.random().toString(16).slice(2,6),n:nick,m:msg,t:Date.now()});
      gbQSet(arr);
    };
    gbQNote2();
    gbLoad();
    w.addEventListener("online",function(){toast("网络恢复了，正在补发暂存的留言");gbFlush();});
    setInterval(function(){if(gbQ().length)gbFlush();},30000);
    gbText.addEventListener("input",function(){gbCnt.textContent=gbText.value.length+"/500";});
    gbForm.addEventListener("submit",function(e){
      e.preventDefault();
      var msg=gbText.value.trim();
      if(!msg){toast("先写点什么再发布");return;}
      if(msg.length>500)msg=msg.slice(0,500);
      var last=0;
      try{last=parseInt(localStorage.getItem("rwzj_gb_last")||"0",10)||0;}catch(err){}
      if(Date.now()-last<30000){toast("慢一点，两次留言间隔 30 秒");return;}
      var nick=(gbName.value.trim()||"匿名").slice(0,20);
      if(gbBtn){gbBtn.disabled=true;gbBtn.textContent="发布中…";}
      var done=function(){if(gbBtn){gbBtn.disabled=false;gbBtn.textContent="发布留言";}};
      var keep=function(netBroken){
        try{localStorage.setItem("rwzj_gb_last",String(Date.now()));}catch(err){}
        gbText.value="";gbCnt.textContent="0/500";
        if(netBroken){
          gbQueueAdd(nick,msg);
          toast("服务器暂时联系不上，已暂存在本机，稍后自动补发");
          gbQNote2();
          setTimeout(gbFlush,6000);
        }else{
          gbMarkSent(nick,msg);
          toast("已发布，谢谢留言");
          gbLoad();
        }
      };
      GBACK.add(nick,msg).then(function(){keep(false);}).catch(function(err){
        if(err&&err.net===false){toast("服务器拒绝了这条留言（"+err.code+"），请检查内容后重试");return;}
        keep(true);
      }).then(done);
    });
  }
}

/* ---------- 全站检索 ---------- */
var overlay=$("#search-overlay");
if(overlay&&w.SITE){
  var sInput=$("#search-input"),sResults=$("#search-results");
  var INDEX=((SITE.articles||[]).concat(SITE.essays||[])).map(function(a){
    return {slug:a.slug,title:a.title,cat:a.cat,date:a.date,tags:a.tags,stand:a.stand,url:ROOT+a.url,text:a.text||""};
  });
  var SPECIALS={"\\":"\\\\","(":"\\(",")":"\\)","[":"\\[","]":"\\]","{":"\\{","}":"\\}","*":"\\*","+":"\\+","?":"\\?",".":"\\.","|":"\\|","^":"\\^","$":"\\$"};
  var reEsc=function(k){var o="";for(var i=0;i<k.length;i++){var c=k.charAt(i);o+=(SPECIALS[c]||c);}return o;};
  var hl=function(s,keys){
    var out=esc(s);
    keys.forEach(function(k){
      if(!k)return;
      out=out.replace(new RegExp("("+reEsc(k)+")","gi"),"<mark>$1</mark>");
    });
    return out;
  };
  var runSearch=function(q){
    var keys=q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if(!keys.length)return[];
    return INDEX.map(function(a){
      var score=0,ok=true,first=-1;
      var title=a.title.toLowerCase(),cat=(a.cat+(a.cross?" 交叉学科":"")).toLowerCase(),stand=a.stand.toLowerCase(),tags=a.tags.join(" ").toLowerCase(),text=a.text.toLowerCase();
      keys.forEach(function(k){
        var hit=false;
        if(title.indexOf(k)>-1){score+=10;hit=true;}
        if(cat.indexOf(k)>-1){score+=4;hit=true;}
        if(tags.indexOf(k)>-1){score+=3;hit=true;}
        if(stand.indexOf(k)>-1){score+=3;hit=true;}
        var ti=text.indexOf(k);
        if(ti>-1){score+=1;hit=true;if(first<0)first=ti;}
        if(!hit)ok=false;
      });
      if(!ok)return null;
      var snippet="";
      if(first>-1){
        var st=Math.max(0,first-42);
        snippet=(st>0?"……":"")+a.text.slice(st,first+84)+"……";
      }
      return {a:a,score:score,snippet:snippet};
    }).filter(Boolean).sort(function(x,y){return y.score-x.score;});
  };
  var sel=0;
  var EXAMPLES=["附近","不平等","群体","记忆"];
  var renderResults=function(q){
    var keys=q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if(!keys.length){
      sel=0;
      sResults.innerHTML='<p class="search-empty">输入关键词，检索全部 '+INDEX.length+' 篇札记。试试 '+EXAMPLES.map(function(wd){return '<button type="button" data-word="'+wd+'">'+wd+"</button>";}).join("、")+"。</p>";
      return;
    }
    var res=runSearch(q);
    if(!res.length){
      sel=0;
      sResults.innerHTML='<p class="search-empty">没有找到与「'+esc(q)+'」相关的文章，换个更短的关键词试试。</p>';
      return;
    }
    sel=0;
    sResults.innerHTML='<p class="search-count">找到 '+res.length+" 篇</p>"+res.map(function(r,i){
      return '<a class="sr-item'+(i===sel?" sel":"")+'" href="'+r.a.url+'">'
        +'<p class="kicker"><span class="cat">'+esc(r.a.cat)+'</span><span class="dot">·</span><span class="num">'+r.a.date+"</span></p>"
        +"<h3>"+hl(r.a.title,keys)+"</h3>"
        +(r.snippet?'<p class="snippet">'+hl(r.snippet,keys)+"</p>":"")
        +"</a>";
    }).join("");
  };
  var openSearch=function(){
    overlay.classList.add("open");
    d.body.style.overflow="hidden";
    sInput.value="";
    renderResults("");
    setTimeout(function(){sInput.focus();},0);
  };
  var closeSearch=function(){
    overlay.classList.remove("open");
    d.body.style.overflow="";
  };
  $("#search-open").addEventListener("click",openSearch);
  overlay.addEventListener("click",function(e){if(e.target===overlay)closeSearch();});
  d.addEventListener("keydown",function(e){
    if(e.key==="Escape"&&overlay.classList.contains("open")){closeSearch();return;}
    if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==="k"){
      e.preventDefault();
      if(overlay.classList.contains("open"))closeSearch();else openSearch();
      return;
    }
    var tag=(e.target.tagName||"").toLowerCase();
    if(!overlay.classList.contains("open")&&e.key==="/"&&tag!=="input"&&tag!=="textarea"){
      e.preventDefault();openSearch();
    }
  });
  sInput.addEventListener("input",function(){renderResults(sInput.value);});
  sInput.addEventListener("keydown",function(e){
    var els=sResults.querySelectorAll(".sr-item");
    if(e.key==="ArrowDown"&&els.length){e.preventDefault();sel=Math.min(sel+1,els.length-1);}
    else if(e.key==="ArrowUp"&&els.length){e.preventDefault();sel=Math.max(sel-1,0);}
    else if(e.key==="Enter"&&els.length){e.preventDefault();els[sel].click();return;}
    else return;
    els.forEach(function(el,i){el.classList.toggle("sel",i===sel);});
    if(els[sel])els[sel].scrollIntoView({block:"nearest"});
  });
  sResults.addEventListener("click",function(e){
    var wd=e.target.closest("[data-word]");
    if(wd){sInput.value=wd.dataset.word;renderResults(sInput.value);sInput.focus();return;}
    if(e.target.closest(".sr-item"))closeSearch();
  });
}

/* ---------- 阅读进度记忆（回到上次位置） ---------- */
if(d.body.dataset.page==="article"){
  var slugP=d.body.dataset.slug;
  var savedP=null;
  try{savedP=(JSON.parse(localStorage.getItem("rwzj_progress")||"{}"))[slugP]||null;}catch(e){}
  var resumeBar=null;
  if(savedP&&savedP.pct>0.05&&savedP.pct<0.95){
    resumeBar=d.createElement("div");
    resumeBar.className="resume";
    resumeBar.setAttribute("role","status");
    resumeBar.innerHTML='<span>上次读到 '+Math.round(savedP.pct*100)+'%</span><button type="button" id="resume-go">回到上次位置</button><button type="button" id="resume-x" aria-label="忽略">×</button>';
    d.body.appendChild(resumeBar);
    $("#resume-go").addEventListener("click",function(){
      var h=d.documentElement;var max=h.scrollHeight-w.innerHeight;
      if(w.scrollTo)w.scrollTo({top:max*savedP.pct,behavior:"smooth"});
      resumeBar.remove();resumeBar=null;
    });
    $("#resume-x").addEventListener("click",function(){if(resumeBar){resumeBar.remove();resumeBar=null;}});
  }
  var lastSave=0;
  var saveProgress=function(){
    var nowT=Date.now();
    if(nowT-lastSave<600)return;
    lastSave=nowT;
    var h=d.documentElement;var max=h.scrollHeight-w.innerHeight;
    if(max<=0)return;
    var pct=Math.min(1,Math.max(0,(h.scrollTop||d.body.scrollTop)/max));
    try{
      var all=JSON.parse(localStorage.getItem("rwzj_progress")||"{}");
      all[slugP]={pct:Math.round(pct*1000)/1000,t:nowT};
      var ks=Object.keys(all);
      if(ks.length>30){ks.sort(function(a,b){return all[a].t-all[b].t;});delete all[ks[0]];}
      localStorage.setItem("rwzj_progress",JSON.stringify(all));
    }catch(e){}
  };
  w.addEventListener("scroll",saveProgress,{passive:true});
}

/* ---------- 阅读历史 ---------- */
(function(){
  function loadH(){try{return JSON.parse(localStorage.getItem("rwzj_history")||"[]");}catch(e){return[];}}
  function saveH(a){try{localStorage.setItem("rwzj_history",JSON.stringify(a));}catch(e){}}
  if(d.body.dataset.page==="article"){
    var list=loadH();
    list.unshift({slug:d.body.dataset.slug,t:Date.now()});
    var seen={},out=[];
    list.forEach(function(x){if(x&&x.slug&&!seen[x.slug]&&out.length<20){seen[x.slug]=1;out.push(x);}});
    saveH(out);
  }
  var histPage=$("#history-list");
  if(histPage){
    var bySlug={};
    ((w.SITE?SITE.articles:[]).concat((w.SITE&&SITE.essays)||[])).forEach(function(x){bySlug[x.slug]=x;});
    var fmtH=function(t){
      var dt=new Date(t);
      var p=function(x){return (x<10?"0":"")+x;};
      return dt.getFullYear()+"."+p(dt.getMonth()+1)+"."+p(dt.getDate())+" "+p(dt.getHours())+":"+p(dt.getMinutes());
    };
    var renderH=function(){
      var list=loadH();
      if(!list.length){
        histPage.innerHTML='<p class="empty-note">还没有阅读记录。<br>打开任意一篇文章开始，它会自动出现在这里。</p>';
        return;
      }
      histPage.innerHTML=list.map(function(x){
        var a=bySlug[x.slug];
        if(!a)return"";
        return '<div class="fav-row"><img class="fav-thumb" src="'+ROOT+(a.cover||"")+'" alt="" loading="lazy"><div><a class="t" href="'+ROOT+a.url+'">'+esc(a.title)+'</a><p class="fav-meta num">读过 · '+fmtH(x.t)+'</p></div><a class="tool-btn" href="'+ROOT+a.url+'">再读</a></div>';
      }).join("");
    };
    renderH();
    var clr=$("#history-clear");
    if(clr)clr.addEventListener("click",function(){saveH([]);renderH();toast("已清空阅读记录");});
  }
})();

/* ---------- 收藏导出 / 导入 ---------- */
var exBtn=$("#fav-export");
if(exBtn){
  exBtn.addEventListener("click",function(){
    var data={site:"人文札记",type:"favorites",exported:new Date().toISOString().slice(0,10),items:favs()};
    var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    var a=d.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="人文札记-收藏.json";
    d.body.appendChild(a);a.click();d.body.removeChild(a);
    setTimeout(function(){try{URL.revokeObjectURL(a.href);}catch(e){}},4000);
    toast("已导出收藏");
  });
  var imBtn=$("#fav-import"),imFile=$("#fav-import-file");
  imBtn.addEventListener("click",function(){imFile.click();});
  imFile.addEventListener("change",function(){
    var f=imFile.files&&imFile.files[0];
    if(!f)return;
    var rd=new FileReader();
    rd.onload=function(){
      try{
        var j=JSON.parse(rd.result);
        var items=Array.isArray(j)?j:j.items;
        if(!Array.isArray(items))throw new Error("bad");
        var valid={};
        ((w.SITE?SITE.articles:[]).concat((w.SITE&&SITE.essays)||[])).forEach(function(x){valid[x.slug]=1;});
        var ok=items.filter(function(s){return valid[s];});
        setFavs(ok);
        renderFavs();
        toast("已导入 "+ok.length+" 篇收藏");
      }catch(e){toast("导入失败：文件格式不对");}
      imFile.value="";
    };
    rd.readAsText(f);
  });
}
/* ---------- 站点日期（由 data.js 的 generated 自动渲染，避免忘记手改） ---------- */
(function(){
  var g=(w.SITE&&SITE.generated)||"";
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(g);
  if(!m)return;
  var CN=["〇","一","二","三","四","五","六","七","八","九"];
  var c2=function(v){return String(v).split("").map(function(ch){return CN[+ch];}).join("");};
  var y=+m[1],mo=+m[2],dy=+m[3];
  var d2=new Date(y,mo-1,dy);
  var wk="日一二三四五六".charAt(d2.getDay());
  var cnNum=function(n){if(n<10)return CN[n];if(n===10)return "十";if(n<20)return "十"+CN[n-10];var t2=Math.floor(n/10);return CN[t2]+"十"+(n%10?CN[n%10]:"");};
  var text="二〇"+c2(y%100)+"年"+cnNum(mo)+"月"+cnNum(dy)+"日 · 星期"+wk;
  var els=d.querySelectorAll("[data-site-date]");
  for(var i=0;i<els.length;i++)els[i].textContent=text;
})();

/* ---------- 小节锚点 + 打印用原文地址 ---------- */
(function(){
  var body=d.querySelector(".body");
  if(!body)return;
  var hs=body.querySelectorAll("h2[id]");
  for(var i=0;i<hs.length;i++)(function(h){
    var a=d.createElement("a");
    a.className="h-anchor";a.href="#"+h.id;a.textContent="#";
    a.setAttribute("aria-label","这一节的链接");
    a.addEventListener("click",function(){copyText(location.origin+location.pathname+"#"+h.id,"本节链接已复制");});
    h.insertBefore(a,h.firstChild);
  })(hs[i]);
  var ps=d.createElement("p");
  ps.className="print-only";
  ps.textContent="原文链接："+location.origin+location.pathname+(d.title?"　｜　"+(d.title||""):"");
  body.appendChild(ps);
})();



/* ---------- 首页公告：展开/收起，并记住状态 ---------- */
var noticeBtn=$("#notice-toggle");
if(noticeBtn){
  var nBody=$("#notice-body"),NKEY="rwzj_notice_open";
  var setOpen=function(open){
    if(nBody)nBody.hidden=!open;
    noticeBtn.setAttribute("aria-expanded",open?"true":"false");
    var ar=noticeBtn.querySelector(".notice-arrow");
    if(ar)ar.textContent=open?"－":"＋";
    try{localStorage.setItem(NKEY,open?"1":"0");}catch(e){}
  };
  var initOpen=false;
  try{initOpen=localStorage.getItem(NKEY)==="1";}catch(e){}
  setOpen(initOpen);
  noticeBtn.addEventListener("click",function(){ setOpen(!!(nBody&&nBody.hidden)); });
}
/* ---------- 投稿（先审核、不公开 · 断线暂存自动重试） ---------- */
var subForm=$("#sub-form");
if(subForm){
  var SUB_Q="rwzj_sub_queue",SUB_LAST="rwzj_sub_last";
  var sT=$("#sub-title"),sN=$("#sub-name"),sC=$("#sub-contact"),sB=$("#sub-body"),sA=$("#sub-agree");
  var sBtn=subForm.querySelector('button[type="submit"]'),sNote=$("#sub-note"),sQNote=$("#sub-queue-note"),sTC=$("#sub-title-count"),sBC=$("#sub-body-count");
  var subRd=function(){try{var v=JSON.parse(localStorage.getItem(SUB_Q)||"[]");return (v&&v.length!==undefined)?v:[];}catch(e){return [];}};
  var subWr=function(a){try{localStorage.setItem(SUB_Q,JSON.stringify(a));}catch(e){}};
  var subQNote2=function(){
    if(!sQNote)return;
    var n=subRd().length;
    if(!n){sQNote.hidden=true;sQNote.textContent="";return;}
    sQNote.hidden=false;
    sQNote.textContent="⏳ 有 "+n+" 篇投稿暂存在本机，联网后会自动重试（请不要清除浏览器数据）。";
  };
  var subFetch=function(url,opt,ms){
    opt=opt||{};
    var ctl=(typeof AbortController!=="undefined")?new AbortController():null;
    if(ctl)opt.signal=ctl.signal;
    var tid=setTimeout(function(){if(ctl)ctl.abort();},ms||20000);
    return fetch(url,opt).then(function(r){clearTimeout(tid);return r;},function(e){clearTimeout(tid);throw e;});
  };
  var subEndpoint=function(){
    var G=(w.SITE&&SITE.guestbook)||null;
    if(G&&G.type==="api"&&G.endpoint)return String(G.endpoint).replace(/\/+$/,"");
    return "";
  };
  var subSend=function(item){
    var ep=subEndpoint();
    if(!ep)return Promise.reject({net:true});
    return subFetch(ep,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({type:"submission",title:item.t,nickname:item.n,contact:item.c,body:item.b})},20000)
      .then(function(r){
        if(r.ok)return true;
        if(r.status>=500)throw {net:true};
        return r.text().then(function(txt){throw {net:false,code:r.status};});
      });
  };
  var subFlushing=false;
  var subFlush=function(){
    if(subFlushing)return;
    if(!subRd().length){subQNote2();return;}
    if(!subEndpoint()){subQNote2();return;}
    subFlushing=true;
    (function next(){
      var q=subRd();
      if(!q.length){
        subFlushing=false;subQNote2();
        if(sNote)sNote.textContent="此前暂存的投稿已全部送达，谢谢。";
        return;
      }
      var item=q[0];
      subSend(item).then(function(){
        subWr(subRd().filter(function(x){return x.i!==item.i;}));
        toast("已补投 1 篇暂存的稿子");
        next();
      }).catch(function(){subFlushing=false;subQNote2();});
    })();
  };
  subQNote2();
  subFlush();
  w.addEventListener("online",function(){if(subRd().length){toast("网络恢复，正在重试投稿");subFlush();}});
  setInterval(function(){if(subRd().length)subFlush();},30000);
  var subCnt=function(el,n,max){if(el)el.textContent=n+"/"+max;};
  if(sT)sT.addEventListener("input",function(){subCnt(sTC,sT.value.length,60);});
  if(sB)sB.addEventListener("input",function(){subCnt(sBC,sB.value.length,8000);});
  subForm.addEventListener("submit",function(e){
    e.preventDefault();
    var tt=(sT.value||"").trim(),nn=(sN.value||"").trim(),cc=(sC.value||"").trim(),bb=(sB.value||"").trim();
    if(tt.length<2){toast("先写个标题（至少 2 个字）");return;}
    if(!nn){toast("请填一个署名");return;}
    if(bb.length<50){toast("正文至少 50 字，再补一点吧");return;}
    if(sA&&!sA.checked){toast("请先勾选许可同意");return;}
    var last=0;try{last=parseInt(localStorage.getItem(SUB_LAST)||"0",10)||0;}catch(err){}
    if(Date.now()-last<60000){toast("慢一点，两次投稿间隔 1 分钟");return;}
    var item={i:String(Date.now())+Math.random().toString(16).slice(2,6),t:tt,n:nn,c:cc,b:bb};
    if(sBtn){sBtn.disabled=true;sBtn.textContent="提交中…";}
    var done=function(){if(sBtn){sBtn.disabled=false;sBtn.textContent="提交给编者";}};
    var okUi=function(){
      try{localStorage.setItem(SUB_LAST,String(Date.now()));}catch(err){}
      sT.value="";sN.value="";sC.value="";sB.value="";if(sA)sA.checked=false;
      subCnt(sTC,0,60);subCnt(sBC,0,8000);
      toast("已收到，谢谢；编者读完后会回复你");
      if(sNote)sNote.textContent="投稿已送达编者的待读箱。若被采用，会编入站内并注明你的署名。";
    };
    var keepUi=function(hasEndpoint){
      try{localStorage.setItem(SUB_LAST,String(Date.now()));}catch(err){}
      subWr(subRd().concat([item]));
      subQNote2();
      toast(hasEndpoint?"投稿箱暂时联系不上，已暂存在本机，稍后自动重试":"投稿箱还没接通，已暂存在本机");
      if(sNote)sNote.textContent="你的稿子已暂存在本机，接通后会自动补投。稳妥起见，你可以先复制一份留底：";
      showCopyBox(sBtn,"标题："+tt+"\n署名："+nn+(cc?"\n联系方式："+cc:"")+"\n\n"+bb,"投稿全文");
      if(hasEndpoint)setTimeout(subFlush,8000);
    };
    subSend(item).then(function(){okUi();}).catch(function(err){
      if(err&&err.net===false){toast("提交被拒绝（"+err.code+"），请检查内容后重试");return;}
      keepUi(!!subEndpoint());
    }).then(done);
  });
}
})();

/* ---------- PWA：离线缓存 ---------- */
try{
  if("serviceWorker" in navigator && location.protocol==="https:"){
    var swPath=location.pathname.indexOf("/article/")>=0?"../sw.js":"sw.js";
    navigator.serviceWorker.register(swPath).then(function(){
          navigator.serviceWorker.addEventListener("controllerchange",function(){
            if(!navigator.serviceWorker.controller)return;
            if(document.getElementById("sw-bar"))return;
            var bar=document.createElement("div");
            bar.id="sw-bar";bar.className="sw-bar";
            bar.innerHTML='<span>本站已更新</span><button type="button">刷新查看</button>';
            bar.querySelector("button").addEventListener("click",function(){location.reload();});
            document.body.appendChild(bar);
          });
        }).catch(function(){});
  }
}catch(e){}

/* ---------- 订阅页：feed 地址 ---------- */
var fc=$("#feed-copy");
function feedUrl(){return location.href.replace(/[^\/]*$/,"")+"rss.xml";}
if(fc){
  fc.addEventListener("click",function(){var u=feedUrl();copyText(u,"订阅地址已复制，粘到阅读器里即可",function(t){showCopyBox(fc,t,"订阅地址");});});
  var fu=$("#feed-url");if(fu)fu.textContent=feedUrl();
  var fi=$("#feed-inoreader"),ff=$("#feed-feedly");
  if(fi)fi.href="https://www.inoreader.com/?add_feed="+encodeURIComponent(feedUrl());
  if(ff)ff.href="https://feedly.com/i/subscription/feed/"+encodeURIComponent(feedUrl());
}

/* ---------- 回到顶部（仅文章页） ---------- */
(function(){
  try{
    if(document.body.getAttribute("data-page")!=="article")return;
    var b=document.createElement("button");
    b.type="button";b.className="to-top";b.setAttribute("aria-label","回到顶部");b.textContent="↑";b.hidden=true;
    b.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});
    document.body.appendChild(b);
    var on=function(){b.hidden=window.scrollY<900;};
    window.addEventListener("scroll",on,{passive:true});on();
  }catch(e){}
})();
