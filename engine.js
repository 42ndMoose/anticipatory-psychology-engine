let psychologies={}
let currentPsychology=null
let scenarios=[]

async function init(){

await loadPsychologies()
await loadScenarios()

populateSelector()

setPsychology(Object.keys(psychologies)[0])

}

async function loadPsychologies(){

const files=[
"psychologies/yours.json",
"psychologies/stoic.json",
"psychologies/utilitarian.json"
]

for(let file of files){

let data=await fetch(file).then(r=>r.json())

psychologies[data.name]=data

}

}

async function loadScenarios(){

const data=await fetch("scenarios.json").then(r=>r.json())

scenarios=data.scenarios

}

function populateSelector(){

const select=document.getElementById("psychologySelect")

Object.keys(psychologies).forEach(name=>{

const option=document.createElement("option")

option.value=name
option.textContent=name

select.appendChild(option)

})

select.addEventListener("change",e=>{

setPsychology(e.target.value)

})

}

function setPsychology(name){

currentPsychology=psychologies[name]

renderBeliefs()

runScenarios()

}

function runScenarios(){

const results=document.getElementById("results")

results.innerHTML=""

scenarios.forEach(s=>{

let alignment=0

currentPsychology.beliefs.forEach(b=>{

if(s.conditions.includes(b.id)){

alignment+=b.effect*b.strength

}

})

let verdict="INVESTIGATE"

if(alignment>0)verdict="LIKE"
if(alignment<0)verdict="DISLIKE"

const div=document.createElement("div")

div.innerHTML=`
<h3>${s.name}</h3>
Alignment: ${alignment.toFixed(2)}<br>
Verdict: <b>${verdict}</b>
<hr>
`

results.appendChild(div)

})

}

function renderBeliefs(){

const container=document.getElementById("beliefs")

container.innerHTML=""

currentPsychology.beliefs.forEach((b,index)=>{

const div=document.createElement("div")

div.className="belief"

div.innerHTML=`

<b>${b.id}</b><br>

Effect: ${b.effect}<br>

Strength:
<input type="range" min="0" max="1" step="0.01" value="${b.strength}" 
oninput="updateStrength(${index},this.value)">

${b.strength}

`

container.appendChild(div)

})

}

function updateStrength(index,value){

currentPsychology.beliefs[index].strength=parseFloat(value)

renderBeliefs()

runScenarios()

}

function runCustom(){

const condition=document.getElementById("scenarioInput").value

let alignment=0

currentPsychology.beliefs.forEach(b=>{

if(condition===b.id){

alignment+=b.effect*b.strength

}

})

let verdict="INVESTIGATE"

if(alignment>0)verdict="LIKE"
if(alignment<0)verdict="DISLIKE"

document.getElementById("customResult").innerHTML=`

Alignment: ${alignment.toFixed(2)}<br>
Verdict: <b>${verdict}</b>

`

}

init()
