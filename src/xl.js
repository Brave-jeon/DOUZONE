/* 미니 엑셀 수식 엔진 (견적 양식 전용) */
const XL=(function(){
const ERR=e=>({e});const isErr=v=>v&&typeof v==='object'&&'e' in v;
function colNum(s){let n=0;for(const ch of s)n=n*26+(ch.charCodeAt(0)-64);return n}
function colStr(n){let s='';while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s}
/* ---------- tokenizer ---------- */
function tokenize(src){
  const t=[];let i=0;const s=src;
  const isRefStart=()=>/[A-Za-z$'가-힣\[_]/.test(s[i]);
  while(i<s.length){
    const ch=s[i];
    if(ch===' '||ch==='\n'||ch==='\r'){i++;continue}
    if(ch==='"'){let j=i+1,v='';while(j<s.length){if(s[j]==='"'){if(s[j+1]==='"'){v+='"';j+=2;continue}break}v+=s[j++]}t.push({k:'str',v});i=j+1;continue}
    if(/[0-9.]/.test(ch)){const m=/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i));if(m){
        // could be a row range like 5:5 (rare) - ignore
        t.push({k:'num',v:parseFloat(m[0])});i+=m[0].length;continue}}
    if(ch==='#'){const m=/^#(REF!|N\/A|VALUE!|DIV\/0!|NAME\?|NUM!|NULL!)/.exec(s.slice(i));if(m){t.push({k:'err',v:m[0]});i+=m[0].length;continue}}
    if('+-*/^&%(),;:'.includes(ch)){t.push({k:'op',v:ch});i++;continue}
    if(ch==='<'||ch==='>'||ch==='='){let v=ch;if((ch==='<'&&(s[i+1]==='='||s[i+1]==='>'))||(ch==='>'&&s[i+1]==='=')){v+=s[i+1];i++}t.push({k:'op',v});i++;continue}
    // sheet-qualified or name/ref/function
    let sheet=null;
    if(ch==="'"){let j=i+1,v='';while(j<s.length){if(s[j]==="'"){if(s[j+1]==="'"){v+="'";j+=2;continue}break}v+=s[j++]}i=j+1;if(s[i]==='!'){sheet=v;i++}}
    else{const m=/^(\[\d+\])?([^\s!(),:;=<>+\-*/&^"']+)!/.exec(s.slice(i));if(m){sheet=m[2];i+=m[0].length}}
    const m=/^\$?([A-Za-z]{1,3})\$?(\d+)(?::\$?([A-Za-z]{1,3})\$?(\d+))?/.exec(s.slice(i));
    const mc=/^\$?([A-Za-z]{1,3}):\$?([A-Za-z]{1,3})(?![\w(])/.exec(s.slice(i));
    if(mc&&!/^\$?[A-Za-z]{1,3}\d/.test(s.slice(i))){t.push({k:'ref',sheet,c1:colNum(mc[1].toUpperCase()),r1:1,c2:colNum(mc[2].toUpperCase()),r2:1e9});i+=mc[0].length;continue}
    if(m&&!/[A-Za-z0-9_(]/.test(s[i+m[0].length]||'')){
      const c1=colNum(m[1].toUpperCase()),r1=+m[2];const c2=m[3]?colNum(m[3].toUpperCase()):c1,r2=m[4]?+m[4]:r1;
      t.push({k:'ref',sheet,c1:Math.min(c1,c2),r1:Math.min(r1,r2),c2:Math.max(c1,c2),r2:Math.max(r1,r2),range:!!m[3]});i+=m[0].length;continue}
    const n=/^[A-Za-z_][A-Za-z0-9_.]*/.exec(s.slice(i));
    if(n){i+=n[0].length;const up=n[0].toUpperCase();if(s[i]==='('){t.push({k:'fn',v:up})}else if(up==='TRUE'||up==='FALSE')t.push({k:'bool',v:up==='TRUE'});else t.push({k:'err',v:'#NAME?'});continue}
    if(sheet!==null){t.push({k:'err',v:'#REF!'});continue}
    i++;
  }
  return t;
}
/* ---------- parser ---------- */
function parse(src){
  const t=tokenize(src);let p=0;const peek=()=>t[p],next=()=>t[p++];
  const isOp=(v)=>t[p]&&t[p].k==='op'&&t[p].v===v;
  function primary(){
    const k=next();if(!k)return{t:'err',v:'#VALUE!'};
    if(k.k==='num')return{t:'num',v:k.v};if(k.k==='str')return{t:'str',v:k.v};if(k.k==='bool')return{t:'bool',v:k.v};if(k.k==='err')return{t:'err',v:k.v};
    if(k.k==='ref')return{t:'ref',...k};
    if(k.k==='op'&&k.v==='('){const e=expr(0);if(isOp(')'))p++;return e}
    if(k.k==='op'&&(k.v==='-'||k.v==='+')){const a=unary();return k.v==='-'?{t:'neg',a}:a}
    if(k.k==='fn'){p++;const args=[];if(isOp(')')){p++;return{t:'fn',n:k.v,args}}
      while(true){if(isOp(',')||isOp(')')){args.push({t:'empty'})}else args.push(expr(0));if(isOp(',')){p++;continue}if(isOp(')')){p++;break}break}
      return{t:'fn',n:k.v,args}}
    return{t:'err',v:'#VALUE!'};
  }
  function unary(){if(isOp('-')){p++;return{t:'neg',a:unary()}}if(isOp('+')){p++;return unary()}let a=primary();while(isOp('%')){p++;a={t:'pct',a}}return a}
  const PREC={'=':1,'<>':1,'<':1,'>':1,'<=':1,'>=':1,'&':2,'+':3,'-':3,'*':4,'/':4,'^':5};
  function expr(min){let a=unary();while(true){const k=peek();if(!k||k.k!=='op'||!(k.v in PREC))break;const pr=PREC[k.v];if(pr<min)break;p++;const b=expr(pr+1);a={t:'bin',op:k.v,a,b}}return a}
  return expr(0);
}
/* ---------- formatting ---------- */
function splitSections(f){const out=[];let cur='',q=false;for(let i=0;i<f.length;i++){const c=f[i];if(c==='"')q=!q;if(c==='\\'&&!q){cur+=c+(f[i+1]||'');i++;continue}if(c===';'&&!q){out.push(cur);cur='';continue}cur+=c}out.push(cur);return out}
function serialToDate(n){const d=new Date(Date.UTC(1899,11,30)+Math.round(n*86400000));return{y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()}}
function dateToSerial(y,m,d){return(Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/86400000}
function fmtNumber(v,f){
  if(f==null||f===''||/^general$/i.test(f)){if(typeof v==='number'){return(Math.round(v*1e10)/1e10).toString()}return v==null?'':String(v)}
  const secs=splitSections(f);
  if(typeof v!=='number'){const tsec=secs.length>=4?secs[3]:secs.find(s=>s.includes('@'));if(tsec)return render(tsec,v,true);return v==null?'':String(v)}
  let sec=secs[0],val=v;
  if(secs.length>=2&&v<0){sec=secs[1];val=-v}else if(secs.length>=3&&v===0){sec=secs[2]}
  return render(sec,val,false);
  function render(sec,val,isText){
    sec=sec.replace(/\[[^\]]*\]/g,'');
    // date?
    const plain=sec.replace(/"[^"]*"/g,'').replace(/\\./g,'');
    if(!isText&&/[ymd]/i.test(plain)&&!/[#0]/.test(plain)){const D=serialToDate(val);let o='';let i=0;
      while(i<sec.length){const c=sec[i];if(c==='"'){const j=sec.indexOf('"',i+1);o+=sec.slice(i+1,j);i=j+1;continue}if(c==='\\'){o+=sec[i+1];i+=2;continue}
        const m=/^(yyyy|yy|mm|m|dd|d)/i.exec(sec.slice(i));if(m){const k=m[1].toLowerCase();o+=k==='yyyy'?D.y:k==='yy'?String(D.y).slice(2):k==='mm'?String(D.m).padStart(2,'0'):k==='m'?D.m:k==='dd'?String(D.d).padStart(2,'0'):D.d;i+=m[1].length;continue}
        if(c==='_'){o+=' ';i+=2;continue}if(c==='*'){i+=2;continue}if(c==='@'){i++;continue}o+=c;i++}return o}
    // number
    let pct=0;const numPart=plain.match(/[#0,.]+/);let dec=0,comma=false,minInt=0;
    if(numPart){const np=numPart[0];const dp=np.indexOf('.');dec=dp>=0?(np.slice(dp+1).match(/[0#]/g)||[]).length:0;comma=/[#0],[#0]/.test(np);minInt=((dp>=0?np.slice(0,dp):np).match(/0/g)||[]).length}
    pct=(plain.match(/%/g)||[]).length;let x=val*Math.pow(100,pct);
    let s=x.toFixed(dec);if(dec===0)s=String(Math.round(x+ (x>=0?1e-9:-1e-9)));
    let [ip,fp]=s.split('.');if(minInt===0&&ip==='0'&&numPart)ip=numPart[0].replace(/^[^0#]*/,'').startsWith('0')?'0':'';
    if(comma)ip=ip.replace(/\B(?=(\d{3})+(?!\d))/g,',');
    const numStr=ip+(fp?'.'+fp:'');
    let o='',i=0,placed=false;
    while(i<sec.length){const c=sec[i];
      if(c==='"'){const j=sec.indexOf('"',i+1);o+=sec.slice(i+1,j<0?sec.length:j);i=j<0?sec.length:j+1;continue}
      if(c==='\\'){const nx=sec[i+1];o+=(nx===' '?'₩ ':nx||'');i+=2;continue}
      if(c==='_'){o+=' ';i+=2;continue}if(c==='*'){i+=2;continue}
      if(c==='@'){o+=isText?String(val??''):'';i++;continue}
      if('#0,.'.includes(c)){if(!placed){o+=numStr;placed=true}i++;continue}
      if(c==='%'){o+='%';i++;continue}
      o+=c;i++}
    if(isText&&!sec.includes('@'))o=o;
    return o.replace(/^\s+|\s+$/g,m=>m.length>1?' ':m);
  }
}
function krw(n){n=Math.trunc(Math.abs(n));if(!n)return'영';const d='영일이삼사오육칠팔구'.split(''),u=['','십','백','천'],big=['','만','억','조','경'];let s='',i=0;while(n>0){const ch=n%10000;if(ch){let c='',cc=ch,k=0;while(cc>0){const x=cc%10;if(x)c=d[x]+u[k]+c;cc=Math.floor(cc/10);k++}s=c+big[i]+s}n=Math.floor(n/10000);i++}return s}
/* ---------- evaluation ---------- */
const num=v=>{if(isErr(v))return v;if(v==null||v==='')return 0;if(typeof v==='number')return v;if(typeof v==='boolean')return v?1:0;const s=String(v).replace(/,/g,'').trim();if(s!==''&&!isNaN(+s))return+s;return ERR('#VALUE!')};
const str=v=>{if(v==null)return'';if(typeof v==='boolean')return v?'TRUE':'FALSE';if(typeof v==='number')return fmtNumber(v,null);return String(v)};
function cmp(a,b){
  const ta=a==null?'e':typeof a,tb=b==null?'e':typeof b;
  if(ta==='e'&&tb==='e')return 0;
  if(ta==='e')return tb==='number'?cmp(0,b):tb==='string'?cmp('',b):cmp(false,b);
  if(tb==='e')return ta==='number'?cmp(a,0):ta==='string'?cmp(a,''):cmp(a,false);
  if(ta==='number'&&tb==='number')return a<b?-1:a>b?1:0;
  if(ta==='string'&&tb==='string'){const x=a.toLowerCase(),y=b.toLowerCase();return x<y?-1:x>y?1:0}
  const rank={number:0,string:1,boolean:2};return rank[ta]-rank[tb];
}
class Book{
  constructor(data){this.d=data;this.inputs={};this.cache=new Map();this.asts=new Map();this.today=null;this.stack=0}
  setInput(sheet,a,v){this.inputs[sheet+'!'+a]=v;this.cache.clear()}
  clearInputs(){this.inputs={};this.cache.clear()}
  rec(sheet,a){const sh=this.d.sheets[sheet];return sh&&sh.cells[a]}
  value(sheet,r,c){
    const a=colStr(c)+r,key=sheet+'!'+a;
    if(key in this.inputs)return this.inputs[key];
    if(this.cache.has(key))return this.cache.get(key);
    const rc=this.rec(sheet,a);let v=null;
    if(!this.d.sheets[sheet])v=ERR('#REF!');
    else if(rc){if('f' in rc){if(this.stack>400)return ERR('#CIRC');this.cache.set(key,ERR('#CIRC'));this.stack++;try{v=this.evalF(sheet,rc.f)}catch(e){v=ERR('#VALUE!')}this.stack--}else if('v' in rc)v=rc.v}
    if(Array.isArray(v))v=v[0]&&v[0][0];
    this.cache.set(key,v);return v;
  }
  evalF(sheet,f){let ast=this.asts.get(f);if(!ast){ast=parse(f);this.asts.set(f,ast)}const v=this.ev(ast,sheet);return isRange(v)?this.first(v):v}
  first(rg){return this.value(rg.sheet,rg.r1,rg.c1)}
  ev(n,sh){
    switch(n.t){
      case'num':return n.v;case'str':return n.v;case'bool':return n.v;case'err':return ERR(n.v);case'empty':return null;
      case'ref':{const s=n.sheet==null?sh:n.sheet;if(!this.d.sheets[s])return ERR('#REF!');
        if(n.c1===n.c2&&n.r1===n.r2&&!n.range)return this.value(s,n.r1,n.c1);
        return{rg:1,sheet:s,r1:n.r1,c1:n.c1,r2:Math.min(n.r2,this.d.sheets[s].maxr||n.r2),c2:n.c2}}
      case'neg':{const a=num(this.sc(n.a,sh));return isErr(a)?a:-a}
      case'pct':{const a=num(this.sc(n.a,sh));return isErr(a)?a:a/100}
      case'bin':{const a=this.sc(n.a,sh),b=this.sc(n.b,sh);
        if(n.op==='&'){if(isErr(a))return a;if(isErr(b))return b;return str(a)+str(b)}
        if(['=','<>','<','>','<=','>='].includes(n.op)){if(isErr(a))return a;if(isErr(b))return b;const c=cmp(a,b);return{'=':c===0,'<>':c!==0,'<':c<0,'>':c>0,'<=':c<=0,'>=':c>=0}[n.op]}
        const x=num(a),y=num(b);if(isErr(x))return x;if(isErr(y))return y;
        switch(n.op){case'+':return x+y;case'-':return x-y;case'*':return x*y;case'/':return y===0?ERR('#DIV/0!'):x/y;case'^':return Math.pow(x,y)}return ERR('#VALUE!')}
      case'fn':return this.fn(n.n,n.args,sh);
    }return ERR('#VALUE!');
  }
  sc(n,sh){const v=this.ev(n,sh);return isRange(v)?this.first(v):v}
  vals(rg){const out=[];for(let r=rg.r1;r<=rg.r2;r++)for(let c=rg.c1;c<=rg.c2;c++)out.push(this.value(rg.sheet,r,c));return out}
  flat(args,sh){const out=[];args.forEach(a=>{const v=this.ev(a,sh);if(isRange(v))this.vals(v).forEach(x=>out.push({v:x,ref:1}));else out.push({v,ref:0})});return out}
  fn(name,args,sh){
    const A=i=>args[i]?this.sc(args[i],sh):null;
    switch(name){
      case'IF':{const c=A(0);if(isErr(c))return c;const t=typeof c==='string'?(c===''?false:ERR('#VALUE!')):!!num(c);if(isErr(t))return t;return t?(args.length>1?A(1):true):(args.length>2?A(2):false)}
      case'IFERROR':{const v=A(0);return isErr(v)?A(1):v}
      case'IFNA':{const v=A(0);return isErr(v)&&v.e==='#N/A'?A(1):v}
      case'AND':case'OR':{const xs=this.flat(args,sh);let r=name==='AND';for(const {v} of xs){if(isErr(v))return v;if(v==null||typeof v==='string')continue;const b=!!num(v);if(name==='AND')r=r&&b;else r=r||b}return r}
      case'NOT':{const v=A(0);return isErr(v)?v:!num(v)}
      case'SUM':{let s=0;for(const {v,ref} of this.flat(args,sh)){if(isErr(v))return v;if(typeof v==='number')s+=v;else if(!ref&&v!=null&&v!==''){const x=num(v);if(isErr(x))return x;s+=x}}return s}
      case'MAX':case'MIN':{const ns=this.flat(args,sh).map(x=>x.v).filter(v=>typeof v==='number');if(!ns.length)return 0;return name==='MAX'?Math.max(...ns):Math.min(...ns)}
      case'TRUNC':case'ROUNDDOWN':case'ROUND':case'ROUNDUP':{const x=num(A(0)),d=args.length>1?num(A(1)):0;if(isErr(x))return x;if(isErr(d))return d;const p=Math.pow(10,d);const y=x*p;
        let r=name==='ROUND'?Math.sign(y)*Math.round(Math.abs(y)+1e-9):name==='ROUNDUP'?Math.sign(y)*Math.ceil(Math.abs(y)-1e-9):Math.trunc(y+(y>=0?1e-9:-1e-9));return r/p}
      case'ABS':{const x=num(A(0));return isErr(x)?x:Math.abs(x)}
      case'ISNUMBER':return typeof A(0)==='number';
      case'ISBLANK':{const v=A(0);return v==null||v===''}
      case'ISERROR':return isErr(A(0));
      case'CHAR':{const x=num(A(0));return isErr(x)?x:String.fromCharCode(x)}
      case'CONCATENATE':{let s='';for(let i=0;i<args.length;i++){const v=A(i);if(isErr(v))return v;s+=str(v)}return s}
      case'LEN':return str(A(0)).length;
      case'LEFT':return str(A(0)).slice(0,args.length>1?num(A(1)):1);
      case'RIGHT':{const s=str(A(0)),k=args.length>1?num(A(1)):1;return k?s.slice(-k):''}
      case'MID':return str(A(0)).substr(num(A(1))-1,num(A(2)));
      case'TODAY':return this.today!=null?this.today:Math.floor((Date.now()+9*3600e3)/86400000)+25569;
      case'TEXT':{const v=A(0),f=str(A(1));if(isErr(v))return v;return fmtNumber(typeof v==='string'&&v!==''&&!isNaN(+v)?+v:v,f)}
      case'NUMBERSTRING':{const v=num(A(0));if(isErr(v))return v;return krw(v)}
      case'VLOOKUP':{const key=A(0);if(isErr(key))return key;const rg=this.ev(args[1],sh);if(!isRange(rg))return ERR('#N/A');const col=num(A(2));const approx=args.length<4?true:!!num(A(3));
        if(key==null||key==='')return ERR('#N/A');
        if(!approx){for(let r=rg.r1;r<=rg.r2;r++){const v=this.value(rg.sheet,r,rg.c1);if(v!=null&&v!==''&&cmp(v,key)===0)return this.value(rg.sheet,r,rg.c1+col-1)??0}return ERR('#N/A')}
        let hit=-1;for(let r=rg.r1;r<=rg.r2;r++){const v=this.value(rg.sheet,r,rg.c1);if(v==null||v==='')continue;if(typeof v!==typeof key)continue;if(cmp(v,key)<=0)hit=r;else break}
        if(hit<0)return ERR('#N/A');const out=this.value(rg.sheet,hit,rg.c1+col-1);return out==null?0:out}
      case'COUNTIF':{const rg=this.ev(args[0],sh);const crit=A(1);const vs=isRange(rg)?this.vals(rg):[rg];let n=0;
        let op='=',cv=crit;if(typeof crit==='string'){const m=/^(<=|>=|<>|=|<|>)(.*)$/.exec(crit);if(m){op=m[1];cv=m[2];if(cv!==''&&!isNaN(+cv))cv=+cv}}
        const wild=typeof cv==='string'&&/[*?]/.test(cv)?new RegExp('^'+cv.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$','i'):null;
        for(const v of vs){if(wild&&op==='='){if(typeof v==='string'&&wild.test(v))n++;continue}if(op==='='&&(v==null||v==='')&&cv!=='')continue;const c=cmp(v,cv);if({'=':c===0,'<>':c!==0,'<':c<0,'>':c>0,'<=':c<=0,'>=':c>=0}[op]&&(op==='='||op==='<>'||typeof v===typeof cv))n++}return n}
      case'SUMPRODUCT':return ERR('#NAME?');
    }
    return ERR('#NAME?');
  }
}
function isRange(v){return v&&typeof v==='object'&&v.rg===1}
return{Book,parse,fmtNumber,colNum,colStr,krw,isErr,serialToDate,dateToSerial};
})();
if(typeof module!=='undefined')module.exports=XL;
