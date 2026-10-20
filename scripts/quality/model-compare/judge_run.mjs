import fs from 'fs'
import { judge, JUDGE_RUBRIC_JA } from '/home/user/webapp/scripts/quality/harness.mjs'
const OUT='/tmp/model-compare'
const models=['gemini-3.7-flash','gemini-3.8-flash','gemini-3.5-flash','gemini-3.5-flash-lite']
const res={}
for (const m of models){
  const t=fs.readFileSync(`${OUT}/${m}.txt`,'utf8')
  const s=t.indexOf('{'), e=t.lastIndexOf('}')
  const j=JSON.parse(t.slice(s,e+1))
  try{ res[m]=await judge(j.cards, {grade:'小学6年',subject:'算数',unit:'比'}, JUDGE_RUBRIC_JA) }catch(err){ res[m]={error:String(err.message||err)} }
  console.log(m, JSON.stringify(res[m]).slice(0,300))
}
fs.writeFileSync(`${OUT}/judge.json`, JSON.stringify(res,null,2))
