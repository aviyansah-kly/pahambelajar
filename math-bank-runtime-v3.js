import { buildMathBank as buildBase } from './math-bank-runtime-v2.js';
import { enhanceMathBank } from './math-bank-quality-v3.js';

const HELPER='Perhatikan informasi dengan teliti sebelum menjawab.';

function cleanStem(text){
  return String(text||'')
    .replace(/\s*\*\*Perhatikan informasi dengan teliti sebelum menjawab\.?\*\*\s*/gi,' ')
    .replace(/\s*Perhatikan informasi dengan teliti sebelum menjawab\.?\s*/gi,' ')
    .replace(/\s{2,}/g,' ')
    .trim();
}

function gradeHint(grade){
  if(grade===1) return 'Baca pelan-pelan. Pilih jawaban yang paling tepat.';
  if(grade===2) return 'Baca informasi pentingnya, lalu pilih jawaban yang tepat.';
  return HELPER;
}

function simplifyForGrade(text,grade){
  let q=cleanStem(text);
  if(grade===1){
    q=q.replace(/Berdasarkan informasi tersebut,\s*/gi,'')
       .replace(/Manakah jawaban yang paling tepat\??/gi,'Jawabannya ...')
       .replace(/Tentukanlah/gi,'Tentukan')
       .replace(/Hitunglah/gi,'Hitung')
       .replace(/sedangkan/gi,'dan');
  }else if(grade===2){
    q=q.replace(/Tentukanlah/gi,'Tentukan').replace(/Hitunglah/gi,'Hitung');
  }
  return q.trim();
}

function validateItem(item){
  if(!item || item.type!=='choice' || !Array.isArray(item.o) || item.o.length!==4) return false;
  if(!Number.isInteger(item.a) || item.a<0 || item.a>3) return false;
  if(new Set(item.o.map(x=>String(x).trim().toLowerCase())).size!==4) return false;
  if(!String(item.q||'').trim() || !String(item.why||'').trim()) return false;
  return item.validation?.basic!==false;
}

function applyGradeLanguage(bank,grade){
  for(const chapter of Object.values(bank.chapters||{})){
    for(const key of ['practice','quiz']){
      chapter[key]=(chapter[key]||[]).filter(validateItem).map(item=>({
        ...item,
        q:simplifyForGrade(item.q,grade),
        helper:gradeHint(grade),
        language_level:grade===1?'very-simple':grade===2?'simple-context':'short-narrative'
      }));
    }
  }
  bank.version='3.1-literacy-age-level';
  bank.generation_policy={
    ...(bank.generation_policy||{}),
    helper_separated_from_stem:true,
    age_appropriate_language:true,
    literacy_layer_active:true,
    language_levels:{1:'very-simple concrete one-step',2:'simple context with one-two facts',3:'short narrative with familiar numeracy context'}
  };
  return bank;
}

export function buildMathBank(curriculum,grade){
  const base=buildBase(curriculum,grade);
  const enhanced=base?enhanceMathBank(base):base;
  return enhanced?applyGradeLanguage(enhanced,Number(grade)):enhanced;
}
