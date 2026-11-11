(function(g){
  'use strict';
  let instance;
  function create(){
    if(instance)return instance;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!g.MediaRecorder)return null;
    const handlers={partial:new Set(),final:new Set(),state:new Set()};
    let state='idle',recorder,stream,chunks=[],pending,timer,serial=0;
    const emit=(kind,data)=>{for(const fn of handlers[kind]){try{fn(data);}catch(e){console.error(e);}}};
    const setState=(value,reason='')=>{state=value;emit('state',{state,reason});};
    const release=()=>{clearTimeout(timer);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;};
    const on=(kind,fn)=>{handlers[kind].add(fn);if(kind==='state')fn({state,reason:''});return()=>handlers[kind].delete(fn);};
    async function start(){
      if(state!=='idle')return;
      const token=++serial;setState('starting');
      try{
        const input=await navigator.mediaDevices.getUserMedia({audio:true});
        if(token!==serial){input.getTracks().forEach(t=>t.stop());return;}
        stream=input;chunks=[];pending=null;
        const type=['audio/webm;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
        recorder=new MediaRecorder(stream,type?{mimeType:type}:undefined);
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        recorder.start(1000);setState('listening');
        emit('partial',{text:'녹음 중입니다. 멈추면 브라우저에서 음성을 인식합니다.'});
        timer=setTimeout(()=>stop('time_limit').catch(console.error),3600000);
      }catch(e){release();setState('idle',e.name==='NotAllowedError'?'not_granted':'unavailable');throw e;}
    }
    function stop(reason=''){
      if(pending)return pending;
      if(!recorder||recorder.state==='inactive'){
        serial++;release();setState('idle',reason);return Promise.resolve();
      }
      const current=recorder;
      pending=new Promise((resolve,reject)=>{
        current.addEventListener('stop',async()=>{
          release();setState('processing');
          try{
            if(!g.SalesPilotStt)throw new Error('음성 인식 엔진을 불러오지 못했습니다. 새로고침해 주세요.');
            const blob=new Blob(chunks,{type:current.mimeType});
            if(!blob.size){setState('idle',reason);resolve();return;}
            emit('partial',{text:'녹음한 음성을 브라우저에서 인식하고 있습니다.'});
            await g.SalesPilotStt.init(progress=>emit('partial',{text:typeof progress==='string'?progress:'음성 모델 준비 중'}));
            const pcm=await g.SalesPilotStt.decode(blob);
            const text=await g.SalesPilotStt.recognize(pcm,progress=>emit('partial',{text:typeof progress==='string'?progress:'음성 인식 처리 중'}));
            emit('final',{text});setState('idle',reason);resolve({text});
          }catch(error){setState('idle','upstream_error');reject(error);}
          finally{chunks=[];recorder=null;pending=null;}
        },{once:true});
        current.addEventListener('error',event=>{release();setState('idle','upstream_error');reject(event.error||new Error('녹음 오류'));},{once:true});
        current.stop();
      });
      return pending;
    }
    instance={start,stop,onPartial:fn=>on('partial',fn),onFinal:fn=>on('final',fn),onState:fn=>on('state',fn)};
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='listening')stop('hidden').catch(console.error);});
    return instance;
  }
  g.SalesPilotDictation={create};
})(window);
