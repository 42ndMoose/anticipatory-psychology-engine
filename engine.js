async function loadData(){

const beliefsData = await fetch("beliefs.json").then(r=>r.json())
const scenariosData = await fetch("scenarios.json").then(r=>r.json())
const outcomesData = await fetch("outcomes.json").then(r=>r.json())
const errorLog = await fetch("error_log.json").then(r=>r.json())

runEngine(
beliefsData.beliefs,
scenariosData.scenarios,
outcomesData.outcomes,
errorLog.errors
)

}

function runEngine(beliefs,scenarios,outcomes,errorLog){

const output=document.getElementById("output")

scenarios.forEach(s=>{

let alignment=0

beliefs.forEach(b=>{

if(s.conditions.includes(b.id)){

alignment+=b.effect*b.strength

const predicted=b.predicts
const actual=outcomes[s.name]

let predictionError=0

Object.keys(predicted).forEach(key=>{

if(actual[key]!==undefined){

predictionError+=Math.abs(predicted[key]-actual[key])

}

})

predictionError/=Object.keys(predicted).length

b.strength+=0.1*(1-predictionError)
b.strength=Math.max(0,Math.min(1,b.strength))

if(predictionError>0.3){

errorLog.push({
scenario:s.name,
belief:b.id,
error:predictionError
})

}

}

})

let verdict="INVESTIGATE"

if(alignment>0)verdict="LIKE"
if(alignment<0)verdict="DISLIKE"

const div=document.createElement("div")

div.innerHTML=`

<h3>${s.name}</h3>
Alignment: ${alignment.toFixed(2)}<br>
Verdict: ${verdict}

<hr>

`

output.appendChild(div)

})

}

loadData()
