const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function app(saved='[]') {
  const elements=new Map();
  function element(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',hidden:true,dataset:{},classList:{toggle(){}},setAttribute(){}});return elements.get(key);}
  const storage={value:saved,getItem(){return this.value;},setItem(k,v){this.value=v;}};
  const context=vm.createContext({document:{documentElement:{dataset:{}},querySelector:element,querySelectorAll:selector=>selector==='[data-choice]'?[0,1,2].map(i=>{const e=element('choice'+i);e.dataset.choice=String(i);return e;}):[]},localStorage:storage,window:{scrollTo(){}},console});
  vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),context);
  return {run:code=>vm.runInContext(code,context),element,storage};
}
test('all 15 lessons have valid answers and explanations',()=>{const a=app();assert.equal(a.run('modules.flatMap(m=>m.lessons).length'),15);assert.equal(a.run('modules.every(m=>m.lessons.every(l=>l[5] ? l[6]>=0 && l[6]<l[5].length && Boolean(l[7]) : typeof l[6]==="string"))'),true);});
test('wrong answers do not award progress; correct answers persist once',()=>{const a=app();a.run('renderLesson(0,0)');a.element('choice1').onclick();a.element('#check').onclick();assert.equal(a.run('completed.size'),0);assert.match(a.element('#feedback').textContent,/Try again/);a.element('choice0').onclick();a.element('#check').onclick();a.element('#check').onclick();assert.equal(a.run('completed.size'),1);assert.deepEqual(JSON.parse(a.storage.value),['0-0']);assert.equal(a.element('#next').hidden,false);a.element('#next').onclick();assert.match(a.element('#content').innerHTML,/Anatomy of a program/);});
test('statement exercise preserves spaces inside the string',()=>{const a=app();a.run('renderLesson(0,2)');a.element('#answer').value='System.out.println("Hello,Java!");';a.element('#check').onclick();assert.equal(a.run('completed.size'),0);a.element('#answer').value=' System.out.println( "Hello, Java!" ); ';a.element('#check').onclick();assert.equal(a.run('completed.has("0-2")'),true);});
test('saved progress resumes at the next lesson and corrupt storage is tolerated',()=>{const a=app('["0-0","0-1"]');assert.equal(a.run('nextLesson().join("-")'),'0-2');assert.equal(app('broken').run('completed.size'),0);});
test('reference search filters concepts and handles no matches',()=>{const a=app();a.run('renderReference()');a.element('#search').oninput({target:{value:'ArrayList'}});assert.match(a.element('#notes').innerHTML,/Growing with ArrayList/);assert.doesNotMatch(a.element('#notes').innerHTML,/Hello, world!/);a.element('#search').oninput({target:{value:'zzzzzzz'}});assert.match(a.element('#notes').innerHTML,/No matching notes/);});
