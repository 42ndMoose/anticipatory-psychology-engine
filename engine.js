const psychologyFiles = [
  "psychologies/yours.json",
  "psychologies/stoic.json",
  "psychologies/utilitarian.json"
]

const psychologies = {}
let currentPsychology = null
let scenarios = []

async function init() {
  await Promise.all([loadPsychologies(), loadScenarios()])
  populateSelector()
  buildCustomConditionSelector()

  const first = Object.keys(psychologies)[0]
  if (first) {
    setPsychology(first)
  }
}

async function loadPsychologies() {
  for (const file of psychologyFiles) {
    const data = await fetch(file).then((r) => r.json())
    psychologies[data.name] = normalizePsychology(data)
  }
}

async function loadScenarios() {
  const data = await fetch("scenarios.json").then((r) => r.json())
  scenarios = data.scenarios
}

function normalizePsychology(data) {
  return {
    ...data,
    values: data.values || { coherence: 1, wellbeing: 1, autonomy: 1 },
    beliefs: data.beliefs.map((belief) => ({
      maturity: belief.maturity ?? 0.5,
      predicts: belief.predicts || {},
      ...belief
    }))
  }
}

function populateSelector() {
  const select = document.getElementById("psychologySelect")
  select.innerHTML = ""

  Object.keys(psychologies).forEach((name) => {
    const option = document.createElement("option")
    option.value = name
    option.textContent = name
    select.appendChild(option)
  })

  select.addEventListener("change", (e) => {
    setPsychology(e.target.value)
  })
}

function setPsychology(name) {
  currentPsychology = psychologies[name]
  renderModelMeta()
  renderBeliefs()
  runScenarios()
  runComparison()
}

function evaluateScenario(psychology, scenario) {
  let alignment = 0
  const activatedBeliefs = []

  for (const belief of psychology.beliefs) {
    if (!scenario.conditions.includes(belief.id)) continue

    const confidence = belief.strength * (0.5 + belief.maturity / 2)
    let valueWeightedPrediction = 0

    Object.entries(belief.predicts).forEach(([outcome, prediction]) => {
      const priority = psychology.values[outcome] ?? 0
      valueWeightedPrediction += prediction * priority
    })

    const impact = (belief.effect + valueWeightedPrediction) * confidence
    alignment += impact

    activatedBeliefs.push({
      id: belief.id,
      confidence,
      impact
    })
  }

  const verdict = alignment > 0.75 ? "LIKE" : alignment < -0.75 ? "DISLIKE" : "INVESTIGATE"

  return {
    alignment,
    verdict,
    activatedBeliefs
  }
}

function runScenarios() {
  const results = document.getElementById("results")
  results.innerHTML = ""

  scenarios.forEach((scenario) => {
    const result = evaluateScenario(currentPsychology, scenario)
    const card = document.createElement("article")
    card.className = "result-card"

    const beliefList = result.activatedBeliefs.length
      ? result.activatedBeliefs
          .map(
            (b) => `<li><code>${b.id}</code> impact ${b.impact.toFixed(2)} (confidence ${b.confidence.toFixed(2)})</li>`
          )
          .join("")
      : "<li>No belief activated by this scenario.</li>"

    card.innerHTML = `
      <h3>${scenario.name}</h3>
      <p><strong>Alignment:</strong> ${result.alignment.toFixed(2)}</p>
      <p><strong>Verdict:</strong> <span class="verdict">${result.verdict}</span></p>
      <details>
        <summary>Activated beliefs (${result.activatedBeliefs.length})</summary>
        <ul>${beliefList}</ul>
      </details>
    `

    results.appendChild(card)
  })
}

function runComparison() {
  const tbody = document.querySelector("#comparisonTable tbody")
  tbody.innerHTML = ""

  scenarios.forEach((scenario) => {
    const scored = Object.values(psychologies).map((psychology) => ({
      name: psychology.name,
      ...evaluateScenario(psychology, scenario)
    }))

    scored.sort((a, b) => b.alignment - a.alignment)
    const top = scored[0]

    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${scenario.name}</td>
      <td>${top.alignment.toFixed(2)}</td>
      <td>${top.name}</td>
    `

    tbody.appendChild(row)
  })
}

function renderModelMeta() {
  const description = document.getElementById("modelDescription")
  const chips = document.getElementById("valueChips")

  description.textContent = currentPsychology.description
  chips.innerHTML = ""

  Object.entries(currentPsychology.values).forEach(([key, value]) => {
    const chip = document.createElement("span")
    chip.className = "chip"
    chip.textContent = `${key}: ${value}`
    chips.appendChild(chip)
  })
}

function renderBeliefs() {
  const container = document.getElementById("beliefs")
  container.innerHTML = ""

  currentPsychology.beliefs.forEach((belief, index) => {
    const predicts = Object.keys(belief.predicts).length
      ? Object.entries(belief.predicts)
          .map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`)
          .join(" | ")
      : "no explicit prediction map"

    const div = document.createElement("div")
    div.className = "belief"

    div.innerHTML = `
      <h3>${belief.id}</h3>
      <p><strong>Effect:</strong> ${belief.effect}</p>
      <p><strong>Predicts:</strong> ${predicts}</p>
      <label>Strength: <output>${belief.strength.toFixed(2)}</output></label>
      <input type="range" min="0" max="1" step="0.01" value="${belief.strength}" data-type="strength" data-index="${index}">
      <label>Maturity: <output>${belief.maturity.toFixed(2)}</output></label>
      <input type="range" min="0" max="1" step="0.01" value="${belief.maturity}" data-type="maturity" data-index="${index}">
    `

    container.appendChild(div)
  })

  container.querySelectorAll("input[type='range']").forEach((slider) => {
    slider.addEventListener("input", (event) => {
      const idx = Number(event.target.dataset.index)
      const type = event.target.dataset.type
      const value = Number(event.target.value)
      currentPsychology.beliefs[idx][type] = value
      renderBeliefs()
      runScenarios()
      runComparison()
    })
  })
}

function buildCustomConditionSelector() {
  const holder = document.getElementById("customConditions")
  const allConditions = [...new Set(scenarios.flatMap((s) => s.conditions))].sort()

  holder.innerHTML = allConditions
    .map(
      (condition) => `
      <label>
        <input type="checkbox" value="${condition}">
        ${condition}
      </label>
    `
    )
    .join("")

  document.getElementById("runCustomBtn").addEventListener("click", runCustom)
}

function runCustom() {
  const selected = [...document.querySelectorAll("#customConditions input:checked")].map((el) => el.value)

  const result = evaluateScenario(currentPsychology, {
    name: "custom",
    conditions: selected
  })

  const node = document.getElementById("customResult")
  node.innerHTML = `
    <p><strong>Conditions:</strong> ${selected.length ? selected.join(", ") : "none"}</p>
    <p><strong>Alignment:</strong> ${result.alignment.toFixed(2)}</p>
    <p><strong>Verdict:</strong> ${result.verdict}</p>
  `
}

init()
