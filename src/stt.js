
/* ================= 음성 파일 → 텍스트 (브라우저 안에서 실행, 한국어 Zipformer) ================= */
const STT={ready:null,enc:null,dec:null,joi:null,tok:null,busy:false,abort:false};
const STT_BASE='stt/';
function sttLoadScript(src){return new Promise((ok,no)=>{if(window.ort)return ok();const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('script'));document.head.appendChild(s)})}
async function sttFetch(name,onp){const r=await fetch(STT_BASE+name);if(!r.ok)throw new Error('fetch '+name+' '+r.status);
  const len=+r.headers.get('content-length')||0;if(!r.body||!onp)return new Uint8Array(await r.arrayBuffer());
  const rd=r.body.getReader();const parts=[];let got=0;for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;onp(got,len)}
  const out=new Uint8Array(got);let o=0;parts.forEach(p=>{out.set(p,o);o+=p.length});return out}
function sttInit(onStatus){
  if(STT.ready)return STT.ready;
  STT.ready=(async()=>{
    onStatus&&onStatus('음성 인식 엔진 불러오는 중…',0);
    await sttLoadScript(STT_BASE+'ort.wasm.min.js');
    const ort=window.ort;ort.env.wasm.numThreads=1;ort.env.wasm.wasmPaths=new URL(STT_BASE,location.href).href;
    const man=JSON.parse(new TextDecoder().decode(await sttFetch('manifest.json')));
    const total=man.files.reduce((a,f)=>a+f.size,0);let done=0;const prog=f=>(g)=>onStatus&&onStatus(`한국어 음성 모델 내려받는 중… ${Math.round((done+g)/total*100)}% (최초 1회, 약 ${Math.round(total/1e6)}MB)`,(done+g)/total);
    const get=async(f)=>{let b=await sttFetch(f.name,prog(f));done+=f.size;if(/\.b64\.txt$/.test(f.name)){const bin=atob(new TextDecoder().decode(b).replace(/\s/g,''));b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i)}return b};
    const join=async(list)=>{const bufs=[];for(const f of list)bufs.push(await get(f));const n=bufs.reduce((a,b)=>a+b.length,0);const o=new Uint8Array(n);let p=0;bufs.forEach(b=>{o.set(b,p);p+=b.length});return o};
    const grp=k=>man.files.filter(f=>f.group===k);
    const encB=await join(grp('enc')),decB=await join(grp('dec')),joiB=await join(grp('joi')),tokB=await join(grp('tok'));
    onStatus&&onStatus('음성 인식 엔진 준비 중…',1);
    const opt={executionProviders:['wasm'],graphOptimizationLevel:'all'};
    STT.enc=await ort.InferenceSession.create(encB,opt);STT.dec=await ort.InferenceSession.create(decB,opt);STT.joi=await ort.InferenceSession.create(joiB,opt);
    STT.tok=new TextDecoder().decode(tokB).split('\n').map(l=>l.slice(0,l.lastIndexOf(' ')));
    return true})();
  STT.ready.catch(()=>{STT.ready=null});
  return STT.ready}

/* --- 음성 파일 디코딩 (16kHz mono) --- */
async function sttDecode(file){
  const buf=await file.arrayBuffer();
  const AC=window.AudioContext||window.webkitAudioContext;let ctx;
  try{ctx=new AC({sampleRate:16000})}catch(_){ctx=new AC()}
  const ab=await ctx.decodeAudioData(buf);try{ctx.close()}catch(_){}
  let x;if(ab.numberOfChannels===1)x=ab.getChannelData(0);else{const a=ab.getChannelData(0),b=ab.getChannelData(1);x=new Float32Array(a.length);for(let i=0;i<a.length;i++)x[i]=(a[i]+b[i])*.5}
  if(ab.sampleRate!==16000){const r=ab.sampleRate/16000,n=Math.floor(x.length/r),y=new Float32Array(n);for(let i=0;i<n;i++){const p=i*r,j=Math.floor(p),f=p-j;y[i]=x[j]*(1-f)+(x[j+1]||0)*f}x=y}
  return x}

/* --- Kaldi 호환 Fbank (80 mel, 25ms/10ms, povey, snip_edges=false) --- */
const FB=(()=>{const N=400,S=160,NF=512;const win=new Float32Array(N);for(let i=0;i<N;i++)win[i]=Math.pow(0.5-0.5*Math.cos(2*Math.PI*i/(N-1)),0.85);
  const mel=f=>1127*Math.log(1+f/700);const ml=mel(20),mh=mel(8000-400),d=(mh-ml)/81;const nb=NF/2+1;const W=[];
  for(let b=0;b<80;b++){const l=ml+b*d,c=ml+(b+1)*d,r=ml+(b+2)*d;const row=[];let s=-1;for(let k=0;k<nb;k++){const m=mel(k*16000/NF);if(m>l&&m<r){const w=m<=c?(m-l)/(c-l):(r-m)/(r-c);if(s<0)s=k;row.push(w)}else if(s>=0&&!row.length)s=-1}W.push({s,w:Float32Array.from(row)})}
  // radix-2 FFT
  const rev=new Uint16Array(NF);for(let i=0,j=0;i<NF;i++){rev[i]=j;let bit=NF>>1;while(j&bit){j^=bit;bit>>=1}j|=bit}
  const cs=new Float64Array(NF/2),sn=new Float64Array(NF/2);for(let i=0;i<NF/2;i++){cs[i]=Math.cos(2*Math.PI*i/NF);sn[i]=-Math.sin(2*Math.PI*i/NF)}
  const re=new Float64Array(NF),im=new Float64Array(NF),fr=new Float64Array(N),pw=new Float64Array(nb);
  function fft(){for(let i=0;i<NF;i++){const j=rev[i];if(j>i){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}
    for(let len=2;len<=NF;len<<=1){const h=len>>1,st=NF/len;for(let i=0;i<NF;i+=len)for(let k=0;k<h;k++){const c=cs[k*st],s=sn[k*st],a=i+k,b=a+h;const tr=re[b]*c-im[b]*s,ti=re[b]*s+im[b]*c;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti}}}
  return function(x){const n=x.length,T=Math.floor((n+S/2)/S),pad=N/2-S/2;const out=new Float32Array(T*80);
    for(let t=0;t<T;t++){const s0=t*S-pad;let mean=0;for(let i=0;i<N;i++){let j=s0+i;if(j<0)j=-j-1;else if(j>=n)j=2*n-j-1;fr[i]=x[j]||0;mean+=fr[i]}mean/=N;
      for(let i=0;i<N;i++)fr[i]-=mean;for(let i=N-1;i>0;i--)fr[i]-=0.97*fr[i-1];fr[0]-=0.97*fr[0];
      for(let i=0;i<NF;i++){re[i]=i<N?fr[i]*win[i]:0;im[i]=0}fft();for(let k=0;k<nb;k++)pw[k]=re[k]*re[k]+im[k]*im[k];
      for(let b=0;b<80;b++){const {s,w}=W[b];let e=0;for(let k=0;k<w.length;k++)e+=w[k]*pw[s+k];out[t*80+b]=Math.log(Math.max(e,1.1920929e-07))}}
    return{data:out,T}}})();

/* --- 구간 나누기: 최대 25초, 15초 이후 가장 조용한 지점에서 자름 --- */
function sttSegments(x){const SR=16000,hop=1600;const nf=Math.ceil(x.length/hop);const en=new Float32Array(nf);
  for(let f=0;f<nf;f++){let e=0;const a=f*hop,b=Math.min(x.length,a+hop);for(let i=a;i<b;i++)e+=x[i]*x[i];en[f]=e/(b-a||1)}
  const segs=[];let st=0;const MIN=150,MAX=250;
  while(st<nf){if(nf-st<=MAX){segs.push([st,nf]);break}let best=st+MIN,bv=Infinity;for(let f=st+MIN;f<st+MAX;f++)if(en[f]<bv){bv=en[f];best=f}segs.push([st,best]);st=best}
  const thr=1e-6;return segs.map(([a,b])=>{let s=0;for(let f=a;f<b;f++)s+=en[f];return{a:a*hop,b:Math.min(x.length,b*hop),silent:s/(b-a)<thr}})}

/* --- 인식 (greedy transducer) --- */
async function sttRecognize(x){const ort=window.ort;const {data,T}=FB(x);if(T<10)return'';
  const eo=await STT.enc.run({x:new ort.Tensor('float32',data,[1,T,80]),x_lens:new ort.Tensor('int64',BigInt64Array.from([BigInt(T)]),[1])});
  const E=eo.encoder_out,L=Number(eo.encoder_out_lens.data[0]);const D=E.dims[2];
  const hyp=[0,0];const dec=async()=>(await STT.dec.run({y:new ort.Tensor('int64',BigInt64Array.from([BigInt(hyp[hyp.length-2]),BigInt(hyp[hyp.length-1])]),[1,2])})).decoder_out;
  let dout=await dec();
  for(let t=0;t<L;t++){const e=new ort.Tensor('float32',E.data.subarray(t*D,(t+1)*D),[1,D]);const lg=(await STT.joi.run({encoder_out:e,decoder_out:dout})).logit.data;
    let k=0,m=-Infinity;for(let i=0;i<lg.length;i++)if(lg[i]>m){m=lg[i];k=i}
    if(k!==0){hyp.push(k);dout=await dec()}}
  return hyp.slice(2).map(i=>STT.tok[i]).join('').replace(/▁/g,' ').trim()}
const sttTs=s=>{s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60;return(h?h+':':'')+String(m).padStart(2,'0')+':'+String(ss).padStart(2,'0')};
async function sttTranscribe(file,onStatus,onText){
  await sttInit(onStatus);onStatus('음성 파일 읽는 중…',0);
  const x=await sttDecode(file);const dur=x.length/16000;const segs=sttSegments(x);const out=[];const t0=performance.now();
  for(let i=0;i<segs.length;i++){if(STT.abort)break;const s=segs[i];
    const el=(performance.now()-t0)/1000,eta=i?el/i*(segs.length-i):0;
    onStatus(`텍스트로 바꾸는 중… ${Math.round(i/segs.length*100)}% (${sttTs(s.a/16000)} / ${sttTs(dur)})${eta?' · 남은 시간 약 '+Math.ceil(eta/60)+'분':''}`,i/segs.length);
    if(s.silent)continue;
    const txt=await sttRecognize(x.subarray(s.a,s.b));if(txt){const line=`[${sttTs(s.a/16000)}] ${txt}`;out.push(line);onText&&onText(line)}
    await new Promise(r=>setTimeout(r,0))}
  return{text:out.join('\n'),dur,stopped:STT.abort}}
