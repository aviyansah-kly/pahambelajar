const H=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,23);
const R=s=>{let x=H(s)||1;return()=>((x=(x*1664525+1013904223)>>>0)/4294967296)};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function mix(correct,wrong,r){const a=[String(correct),...wrong.map(String)].filter((x,i,z)=>z.indexOf(x)===i);if(a.length<4)throw new Error(`Need 4 unique options for ${correct}`);const o=a.slice(0,4);for(let i=3;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]]}return[o,o.indexOf(String(correct))]}
const make=(ch,skill,i,q,o,a,why,d=1)=>({id:`en2-${ch.id}-${H(skill).toString(36)}-${i}`,skill,difficulty:d,type:'choice',q,o,a,why});
const vocab={
'greetings':['Hello!','Good morning!','Goodbye!','Thank you!'],
'greetings and parting':['Hello!','Good morning!','Goodbye!','See you!'],
'body parts':['head','hand','eye','foot'],
'numbers 1–10':['one','three','six','nine'],
'basic colors':['red','blue','green','yellow'],
'family members':['mother','father','sister','brother'],
'objects at home':['bed','lamp','chair','table'],
'basic shapes':['circle','square','triangle','rectangle'],
'school and home objects':['book','pencil','chair','lamp'],
'classroom objects':['book','pencil','eraser','ruler'],
'school places':['library','classroom','canteen','playground'],
'rooms':['bedroom','kitchen','bathroom','living room'],
'household objects':['sofa','lamp','bed','table'],
'days of the week':['Monday','Tuesday','Wednesday','Friday'],
'daily activities':['wake up','eat breakfast','go to school','sleep'],
'food vocabulary':['rice','bread','milk','banana'],
'animal vocabulary':['cat','bird','fish','rabbit'],
'clothes':['shirt','hat','shoes','dress'],
'after-school activities':['play football','ride a bike','read a book','draw pictures'],
'activities at home':['read a book','watch TV','help my mother','play with toys'],
'parts of the house':['bedroom','kitchen','bathroom','living room'],
'school facilities':['library','canteen','classroom','school yard'],
'adjectives':['big','small','clean','beautiful'],
'colors':['red','blue','green','yellow'],
'school staff':['teacher','principal','librarian','security guard'],
'teachers':['English teacher','Math teacher','PE teacher','class teacher'],
'appearance adjectives':['tall','short','young','wearing glasses'],
'character adjectives':['kind','friendly','helpful','patient']
};
function qVocab(grade,ch,skill,i,r,arr){const correct=arr[i%arr.length],[o,a]=mix(correct,arr.filter(x=>x!==correct),r);const prompt=grade===1?'Choose the correct word.':grade===2?`Which word matches “${correct}”?`:`Read and choose the word that means “${correct}”.`;return make(ch,skill,i,prompt,o,a,`The correct word is “${correct}”.`)}
function question(grade,ch,skill,i){const r=R(`${grade}|${ch.id}|${skill}|${i}|v2`),s=skill.toLowerCase();if(vocab[s])return qVocab(grade,ch,skill,i,r,vocab[s]);
 if(/saying name|introductions$/.test(s)){const name=['Rani','Budi','Siti','Dino'][i%4],correct=`My name is ${name}.`,[o,a]=mix(correct,[`I name ${name}.`,`Me is ${name}.`,`My names are ${name}.`],r);return make(ch,skill,i,`You are ${name}. What do you say?`,o,a,'Use “My name is ...” to tell your name.')}
 if(/simple classroom responses/.test(s)){const rows=[['Teacher says, “Sit down, please.”','Sit down.',['Run outside.','Open the window.','Go home.']],['Teacher says, “Stand up, please.”','Stand up.',['Sit down.','Sleep.','Eat lunch.']],['Teacher says, “Open your book.”','Open the book.',['Close the book.','Put it away.','Draw on the desk.']],['Teacher says, “Listen, please.”','Listen.',['Shout.','Run.','Sleep.']]],x=rows[i%4],[o,a]=mix(x[1],x[2],r);return make(ch,skill,i,x[0]+' What should you do?',o,a,`The instruction means “${x[1]}”.`)}
 if(/simple commands|classroom instructions/.test(s)){const rows=[['Open your book.','open the book'],['Close the door.','close the door'],['Raise your hand.','raise your hand'],['Sit down.','sit down']],x=rows[i%4],[o,a]=mix(x[1],rows.filter(y=>y!==x).map(y=>y[1]),r);return make(ch,skill,i,`What does “${x[0]}” tell you to do?`,o,a,`It tells you to ${x[1]}.`)}
 if(/this is my/.test(s)){const p=['mother','father','sister','brother'][i%4],correct=`This is my ${p}.`,[o,a]=mix(correct,[`These is my ${p}.`,`This are my ${p}.`,`I my ${p}.`],r);return make(ch,skill,i,`You point to one ${p}. Choose the correct sentence.`,o,a,'Use “This is my ...” for one person.')}
 if(/counting objects/.test(s)){const n=i%4+2,word=['two','three','four','five'][i%4],[o,a]=mix(word,['one','six','ten'].filter(x=>x!==word).concat(['seven']),r);return make(ch,skill,i,`There are ${'● '.repeat(n).trim()} dots. How many?`,o,a,`There are ${n} dots, so the answer is “${word}”.`)}
 if(/he and she/.test(s)){const girl=i%2===0,correct=girl?'She':'He',[o,a]=mix(correct,['I','They',girl?'He':'She'],r);return make(ch,skill,i,`${girl?'Siti':'Budi'} is my friend. ___ is kind.`,o,a,`Use “${correct}” for ${girl?'a girl':'a boy'}.`)}
 if(/where is/.test(s)){const places=['on the table','under the chair','in the bag','on the bed'],correct=places[i%4],[o,a]=mix(correct,places.filter(x=>x!==correct),r);return make(ch,skill,i,`The book is ${correct}. Where is the book?`,o,a,`The book is ${correct}.`)}
 if(/in on under|prepositions of place/.test(s)){const prep=['on','in','under'][i%3],context={on:'The book touches the top of the table.',in:'The pencil is inside the bag.',under:'The cat is below the chair.'}[prep],[o,a]=mix(prep,['behind','near',prep==='on'?'under':'on'],r);return make(ch,skill,i,`${context} Which preposition is correct?`,o,a,`Use “${prep}” for this position.`)}
 if(/simple descriptions/.test(s)){const rows=[['The ball is red.','red'],['The cat is small.','small'],['The bag is blue.','blue'],['The house is big.','big']],x=rows[i%4],[o,a]=mix(x[1],['green','tall','yellow','small'].filter(v=>v!==x[1]).slice(0,3),r);return make(ch,skill,i,`${x[0]} Which word describes it?`,o,a,`“${x[1]}” is the describing word.`)}
 if(/simple time expressions/.test(s)){const rows=[['07.00','seven o’clock'],['08.00','eight o’clock'],['12.00','twelve o’clock'],['06.00','six o’clock']],x=rows[i%4],[o,a]=mix(x[1],rows.filter(y=>y!==x).map(y=>y[1]),r);return make(ch,skill,i,`The clock shows ${x[0]}. Choose the correct expression.`,o,a,`${x[0]} is ${x[1]}.`)}
 if(/likes and dislikes|i like/.test(s)){const thing=['milk','cats','drawing','football'][i%4],correct=`I like ${thing}.`,[o,a]=mix(correct,[`I likes ${thing}.`,`I am like ${thing}.`,`Me like ${thing}.`],r);return make(ch,skill,i,`You enjoy ${thing}. Which sentence is correct?`,o,a,'After “I”, use “like”.')}
 if(/simple requests/.test(s)){const item=['water','rice','milk','bread'][i%4],correct=`Can I have some ${item}, please?`,[o,a]=mix(correct,[`I have can ${item}.`,`Give ${item} me can.`,`Can some I ${item}?`],r);return make(ch,skill,i,`You want ${item}. Choose the polite request.`,o,a,'“Can I have ... please?” is a polite request.')}
 if(/can and cannot/.test(s)){const can=i%2===0,animal=can?'bird':'fish',action=can?'fly':'ride a bicycle',correct=can?`A ${animal} can ${action}.`:`A ${animal} cannot ${action}.`,[o,a]=mix(correct,[`A ${animal} can not is ${action}.`,`Can ${animal} ${action} a.`,`A ${animal} are ${action}.`],r);return make(ch,skill,i,`Choose the correct sentence about a ${animal}.`,o,a,correct)}
 if(/favorite activities/.test(s)){const act=['drawing','reading','cycling','swimming'][i%4],correct=`My favorite activity is ${act}.`,[o,a]=mix(correct,[`My favorite is activity ${act}.`,`I favorite activity ${act}.`,`Mine activity are ${act}.`],r);return make(ch,skill,i,`You like ${act} best. Choose the correct sentence.`,o,a,'Use “My favorite activity is ...”.')}
 if(/family origin/.test(s)){const city=['Bandung','Surabaya','Jakarta','Yogyakarta'][i%4],correct=`My family is from ${city}.`,[o,a]=mix(correct,[`My family from is ${city}.`,`My family are froms ${city}.`,`From ${city} my is family.`],r);return make(ch,skill,i,`Your family comes from ${city}. Choose the correct sentence.`,o,a,'Use “My family is from ...”.')}
 if(/introducing family/.test(s)){const p=['mother','father','sister','brother'][i%4],name=['Ani','Budi','Sari','Doni'][i%4],correct=`This is my ${p}, ${name}.`,[o,a]=mix(correct,[`These are my ${p}, ${name}.`,`This my is ${p}, ${name}.`,`I ${p} is ${name}.`],r);return make(ch,skill,i,`You introduce one ${p} named ${name}. Choose the best sentence.`,o,a,'Use “This is my ...” to introduce one family member.')}
 if(/present continuous/.test(s)){const rows=[['Siti','read','reading'],['Budi','eat','eating'],['Rani','draw','drawing'],['Dino','play','playing']],x=rows[i%4],correct=`${x[0]} is ${x[2]}.`,[o,a]=mix(correct,[`${x[0]} ${x[2]}.`,`${x[0]} are ${x[2]}.`,`${x[0]} is ${x[1]}.`],r);return make(ch,skill,i,`${x[0]} is doing it now. Which sentence shows an action happening now?`,o,a,'Use “is + verb-ing” for an action happening now.',2)}
 if(/asking location and activity/.test(s)){const correct='Where is Siti?',[o,a]=mix(correct,['What Siti doing?','Who is book?','When is chair?'],r);return make(ch,skill,i,'You want to know Siti’s location. What do you ask?',o,a,'Ask “Where is ...?” to ask about location.',2)}
 if(/there is and there are/.test(s)){const plural=i%2===1,correct=plural?'There are three books.':'There is one book.',[o,a]=mix(correct,[plural?'There is three books.':'There are one book.','There be books.','There am a book.'],r);return make(ch,skill,i,plural?'The classroom has three books. Choose the correct sentence.':'The table has one book. Choose the correct sentence.',o,a,plural?'Use “There are” for more than one.':'Use “There is” for one thing.',2)}
 if(/numbers 11–50/.test(s)){const nums=[[12,'twelve'],[20,'twenty'],[35,'thirty-five'],[48,'forty-eight']],x=nums[i%4],[o,a]=mix(x[1],nums.filter(y=>y!==x).map(y=>y[1]),r);return make(ch,skill,i,`How do you read the number ${x[0]}?`,o,a,`${x[0]} is read “${x[1]}”.`)}
 if(/possessive adjectives/.test(s)){const rows=[['I','my'],['you','your'],['he','his'],['she','her']],x=rows[i%4],correct=x[1],[o,a]=mix(correct,rows.filter(y=>y!==x).map(y=>y[1]),r);return make(ch,skill,i,`${x[0]} have a book. This is ___ book.`,o,a,`Use “${correct}” with “${x[0]}”.`,2)}
 throw new Error(`No English template for skill: ${skill}`)}
function learn(grade){return grade===1?[["💬","Say and point","Read a short word or phrase and connect it to something familiar.","Hello! / My name is Rani."]]:grade===2?[["📘","Read a simple sentence","Find the key word, then choose the answer that matches the meaning.","The book is on the table."]]:[["📖","Read for meaning","Read the short context, notice the sentence pattern, then choose the best answer.","There are three books in the library."]]}
export function buildEnglishBank(curriculum,grade){const g=curriculum?.grades?.[String(grade)];if(!g||grade>3)return null;const chapters={};for(const sem of ['1','2'])for(const ch of g.semesters?.[sem]?.['Bahasa Inggris']||[]){const practice=[];for(const skill of ch.skills||[])for(let i=0;i<8;i++)practice.push(question(grade,ch,skill,i));const quiz=(ch.skills||[]).map(skill=>{const x=practice.filter(v=>v.skill===skill).at(-1);return{...x,id:x.id+'-q'}});chapters[ch.title]={chapter_id:ch.id,skills:ch.skills,learn:learn(grade),practice,quiz}}return{version:'2.0-runtime-testing',updated:'2026-09-02',grade,subject:'Bahasa Inggris',generation_policy:{source:'deterministic-runtime-v2',questions_per_skill:8,status:'implemented-pending-runtime-review',production_publish:false,age_level:grade===1?'very-short-concrete':grade===2?'simple-sentence-light-context':'short-context-sentence-pattern'},chapters}}
