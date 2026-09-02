(()=>{
  const helperForGrade=grade=>grade===1
    ? 'Baca pelan-pelan. Pilih jawaban yang paling tepat.'
    : grade===2
      ? 'Baca informasi pentingnya, lalu pilih jawaban yang tepat.'
      : 'Perhatikan informasi dengan teliti sebelum menjawab.';

  function currentGrade(){
    const kicker=document.querySelector('.pm-hero .pm-kicker');
    const match=kicker?.textContent?.match(/Kelas\s+(\d)/i);
    return Number(match?.[1]||3);
  }

  function patchCard(card){
    const h2=card.querySelector('h2');
    if(!h2||h2.dataset.helperPatched==='1')return;
    h2.dataset.helperPatched='1';
    h2.textContent=h2.textContent
      .replace(/\s*Perhatikan informasi dengan teliti sebelum menjawab\.?\s*/gi,' ')
      .replace(/\s{2,}/g,' ')
      .trim();
    const note=document.createElement('div');
    note.className='pm-question-helper';
    note.setAttribute('role','note');
    note.textContent=helperForGrade(currentGrade());
    h2.insertAdjacentElement('afterend',note);
  }

  const style=document.createElement('style');
  style.textContent='.pm-question-helper{margin:6px 0 4px;font-size:12px;line-height:1.45;font-weight:500;color:#667085}.pm-question-helper::before{content:"💡 ";font-size:11px}@media(max-width:700px){.pm-question-helper{font-size:11.5px}}';
  document.head.appendChild(style);

  const observer=new MutationObserver(()=>document.querySelectorAll('.pm-card').forEach(patchCard));
  observer.observe(document.documentElement,{subtree:true,childList:true});
  document.querySelectorAll('.pm-card').forEach(patchCard);
})();
