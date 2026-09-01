const H=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,17);
const R=s=>{let x=H(s)||1;return()=>((x=(x*1664525+1013904223)>>>0)/4294967296)};
function mix(correct, wrong, r){const a=[String(correct),...wrong.map(String)].filter((x,i,z)=>z.indexOf(x)===i);while(a.length<4)a.push(`Option ${a.length+1}`);for(let i=3;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return[a.slice(0,4),a.indexOf(String(correct))]}
const make=(ch,skill,i,q,o,a,why,d=1)=>({id:`en-${ch.id}-${H(skill).toString(36)}-${i}`,skill,difficulty:d,type:'choice',q,o,a,why});
const wordSets={
'greetings':['Hello!','Goodbye','Thank you','Sorry'],
'body parts':['hand','book','chair','red'],
'basic colors':['red','cat','two','book'],
'numbers 1–10':['three','green','bag','father'],
'classroom objects':['pencil','kitchen','mother','Monday'],
'school places':['library','bedroom','kitchen','bathroom'],
'rooms':['bedroom','pencil','Monday','cat'],
'food vocabulary':['rice','shirt','cat','pencil'],
'animal vocabulary':['cat','rice','shirt','book'],
'clothes':['shirt','rice','cat','book'],
'school facilities':['library','kitchen','bedroom','market'],
'school staff':['teacher','banana','table','Monday'],
'appearance adjectives':['tall','library','Monday','pencil'],
'character adjectives':['kind','blue','library','seven']
};
function question(grade,ch,skill,i){const r=R(`${grade}|${ch.id}|${skill}|${i}`),s=skill.toLowerCase();
 if(wordSets[s]){const arr=wordSets[s],correct=arr[i%arr.length],[o,a]=mix(correct,arr.filter(x=>x!==correct),r);return make(ch,skill,i,grade===1?'Choose the correct word.':grade===2?'Read and choose the correct word.':'Read the context and choose the best word.',o,a,`The correct answer is “${correct}”.`)}
 if(/this is my/.test(s)){const p=['mother','father','sister','brother'][i%4],correct=`This is my ${p}.`,[o,a]=mix(correct,[`This are my ${p}.`,`These is my ${p}.`,`I ${p}.`],r);return make(ch,skill,i,`Choose the correct sentence for ${p}.`,o,a,'Use “This is my ...” for one person.')}
 if(/he and she/.test(s)){const girl=i%2===0,correct=girl?'She':'He',[o,a]=mix(correct,['I','It',girl?'He':'She'],r);return make(ch,skill,i,`${girl?'Siti':'Budi'} is my friend. ___ is kind.`,o,a,`Use “${correct}” for ${girl?'a girl':'a boy'}.`)}
 if(/in on under|prepositions of place/.test(s)){const rel=['on','in','under'][i%3],[o,a]=mix(rel,['behind','near',rel==='on'?'under':'on'],r);return make(ch,skill,i,`The book is ${rel} the table. Which word completes the sentence?`,o,a,`“${rel}” shows the position of the book.`)}
 if(/days of the week/.test(s)){const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],correct=days[i%7],[o,a]=mix(correct,[days[(i+1)%7],days[(i+2)%7],days[(i+3)%7]],r);return make(ch,skill,i,`Choose the day: ${correct}.`,o,a,`The correct day is ${correct}.`)}
 if(/likes and dislikes|i like/.test(s)){const thing=['milk','cats','drawing','football'][i%4],correct=`I like ${thing}.`,[o,a]=mix(correct,[`I likes ${thing}.`,`I am like ${thing}.`,`Me like ${thing}.`],r);return make(ch,skill,i,'Which sentence is correct?',o,a,'After “I”, use “like”.')}
 if(/there is and there are/.test(s)){const plural=i%2===1,correct=plural?'There are three books.':'There is one book.',[o,a]=mix(correct,[plural?'There is three books.':'There are one book.','There be books.','There am a book.'],r);return make(ch,skill,i,plural?'The classroom has three books. Choose the correct sentence.':'The table has one book. Choose the correct sentence.',o,a,plural?'Use “There are” for more than one.':'Use “There is” for one thing.',2)}
 if(/present continuous/.test(s)){const correct='She is reading.',[o,a]=mix(correct,['She reading.','She are reading.','She reads now is.'],r);return make(ch,skill,i,'Siti is reading a book now. Which sentence is correct?',o,a,'For an action happening now, use “is + verb-ing”.',2)}
 const base=['book','pencil','school','friend'],correct=base[i%4],[o,a]=mix(correct,base.filter(x=>x!==correct),r);return make(ch,skill,i,grade===1?'Choose the correct word.':'Read and choose the best answer.',o,a,`The correct answer is “${correct}”.`)}
function learn(grade){return grade===1?[["💬","Say and point","Say the word and connect it to something you know.","Hello! / My name is Rani."]]:grade===2?[["📘","Read a simple sentence","Find the key word, then choose the best answer.","The book is on the table."]]:[["📖","Read for meaning","Read the short context first, then choose the best answer.","There are three books in the library."]]}
export function buildEnglishBank(curriculum,grade){const g=curriculum?.grades?.[String(grade)];if(!g||grade>3)return null;const chapters={};for(const sem of ['1','2'])for(const ch of g.semesters?.[sem]?.['Bahasa Inggris']||[]){const practice=[];for(const skill of ch.skills||[])for(let i=0;i<8;i++)practice.push(question(grade,ch,skill,i));const quiz=(ch.skills||[]).map(skill=>{const x=practice.filter(v=>v.skill===skill).at(-1);return{...x,id:x.id+'-q'}});chapters[ch.title]={chapter_id:ch.id,skills:ch.skills,learn:learn(grade),practice,quiz}}return{version:'1.0-runtime-testing',updated:'2026-09-02',grade,subject:'Bahasa Inggris',generation_policy:{source:'deterministic-runtime',questions_per_skill:8,status:'ready-for-testing',production_publish:false},chapters}}
