function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array to store the distances
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  // Initialize the first row and column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill in the rest of the array
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deletion
        dp[i][j - 1] + 1, // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  // Return the Levenshtein distance
  return dp[m][n];
}

function getBestMatch(inputStr, stringArray) {
  let bestMatch = null;
  let bestScore = Infinity; // Initialize with a high value

  stringArray.forEach((candidate) => {
    const score = levenshteinDistance(inputStr, candidate);
    if (score < bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  });

  return [bestMatch];
}

let lastResults;
let lastQuery;

async function querySubmit(e, ignoreID = false) {
  if (e) e.preventDefault();
  input.buttons.query.disabled = true;
  input.buttons.query.innerHTML = '<i class="fa-solid fa-cog fa-spin fa-fw"></i>';

  let query = {
    id: input.id.value.split("-"),
    scores: input.score.value.split("-"),
    gliders: redoutDB.gliders,
    parts: Array.from(input.parts, (part, partIndex) => redoutDB.parts[partIndex].details.slice(...part.value.split("-"))),
    stats: Array.from(input.targets, (target) => target.value),
    greaterOnly: input.checkbox.greaterOnly.checked,
  };

  query.id.forEach((id) => {
    if (id && !ignoreID) {
      if (id.length === 6 && [...id].every((idChar) => partCode.includes(idChar.toUpperCase()) || idChar.toUpperCase() === "X")) {
        // Looks like an ID, set query parts accordingly and ignore score range
        query.scores = [0, 1200];
        [...id].forEach((idChar, idCharIndex) => {
          if (idChar.toUpperCase() === "X") {
            query.parts[idCharIndex] = redoutDB.parts[idCharIndex].details;
          } else if (partCode.includes(idChar.toUpperCase())) {
            query.parts[idCharIndex] = redoutDB.parts[idCharIndex].details.slice(...[partCode.indexOf(idChar.toUpperCase()), partCode.indexOf(idChar.toUpperCase()) + 1]);
          }
        });
      } else if (query.gliders.length === redoutDB.gliders.length) {
        // Might be a ship name instead
        query.gliders = [].concat(
          ...Array.from(id.split(","), (glider) =>
            redoutDB.gliders.filter((item) => glider.toUpperCase() === "ANY" || glider.toUpperCase() === item.code || glider.toUpperCase() === item.name.toUpperCase() || glider.toUpperCase() === item.nick.toUpperCase())
          )
        );
        // console.log(redoutDB.gliders.filter((gliderDB) => gliderDB.name.toLowerCase()));
        // query.gliders = [].concat(...Array.from(id.split(","), (glider) => redoutDB.gliders.filter((gliderDB) => gliderDB.name.toLowerCase())));
        // query.gliders = [].concat(...Array.from(id.split(","), (glider) => redoutDB.gliders.filter((gliderDB) => gliderDB.name.toUpperCase().match(new RegExp(`/${glider.toUpperCase()}/`)).count === 1)));
      }
    }
  });

  // If browser supports Web Workers and we're searching for more than one ship, run threaded
  // let results = await runQuery(query);
  let results = window.Worker && query.gliders.length > 1 ? await runQueryThreaded(query) : await runQuery(query);
  if (results) {
    input.table.innerHTML = parseResults(results, query);
    lastResults = results;
  }
  lastQuery = query;
  input.buttons.save.disabled = false;
  input.buttons.query.disabled = false;
  input.buttons.query.innerHTML = '<i class="fa-solid fa-magnifying-glass fa-fw"></i>';
}

function addArrays(arrays) {
  const numArrays = arrays.length;
  const arrayLength = arrays[0].length;
  const result = new Array(arrayLength).fill(0);

  for (let i = 0; i < numArrays; i++) {
    for (let j = 0; j < arrayLength; j++) {
      result[j] += arrays[i][j];
    }
  }

  // Prevent negative arrays
  for (let j = 0; j < arrayLength; j++) {
    result[j] = Math.max(0, result[j]);
  }

  return result;
}

function calculateDelta(candidate, query, greaterOnly = false) {
  let delta = 0;

  for (let i = 0; i < candidate.length; i++) {
    if (greaterOnly && candidate[i] < query[i]) return 9999;
    delta += Math.abs(candidate[i] - query[i]);
  }

  return delta;
}

async function runQuery(query) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.time("Query");

      let maxDelta = 9999;
      let maxDeltaIndex = 0;

      const candidateLimit = 100;
      const candidates = new Array(candidateLimit).fill(
        {
          id: "",
          glider: {},
          rig: [],
          score: 0,
          stats: [],
          delta: maxDelta,
        },
        0,
        candidateLimit
      );

      query.gliders.forEach((glider) => {
        query.parts[0].forEach((propulsor) => {
          query.parts[1].forEach((stabilizer) => {
            query.parts[2].forEach((rudder) => {
              query.parts[3].forEach((hull) => {
                query.parts[4].forEach((intercooler) => {
                  query.parts[5].forEach((esc) => {
                    const candidate = {
                      id: "",
                      glider: {},
                      rig: [],
                      score: 0,
                      stats: [],
                      delta: maxDelta,
                    };
                    candidate.score = glider.score + propulsor.score + stabilizer.score + rudder.score + hull.score + intercooler.score + esc.score;
                    if (candidate.score >= query.scores[0] && candidate.score <= query.scores[1]) {
                      candidate.stats = addArrays([glider.stats, propulsor.stats, stabilizer.stats, rudder.stats, hull.stats, intercooler.stats, esc.stats]);
                      candidate.delta = calculateDelta(candidate.stats, query.stats, query.greaterOnly);
                      if (candidate.delta <= maxDelta) {
                        candidate.glider = glider;
                        candidate.rig = [propulsor, stabilizer, rudder, hull, intercooler, esc];
                        candidate.id = `${propulsor.id}${stabilizer.id}${rudder.id}${hull.id}${intercooler.id}${esc.id}`;
                        candidates[maxDeltaIndex] = candidate;
                        maxDelta = 0;
                        candidates.forEach((_candidate, _candidateIndex) => {
                          if (_candidate.delta > maxDelta) {
                            maxDelta = _candidate.delta;
                            maxDeltaIndex = _candidateIndex;
                          }
                        });
                      }
                    }
                  });
                });
              });
            });
          });
        });
      });

      let count = query.gliders.length;
      query.parts.forEach((part) => {
        count = count * part.length;
      });

      const mergedResults = candidates.filter((_candidate) => _candidate.delta != 9999);
      console.timeEnd("Query");
      console.warn(`Searched ${count.toLocaleString()} combination(s) on a single thread!`);
      if (mergedResults.length === 0) {
        reject("No results found!");
      } else {
        console.info(`Showing top ${mergedResults.length} result(s)`);
        resolve(mergedResults);
      }
    }, 0);
  }).catch((e) => {
    alert(e);
  });
}

async function runQueryThreaded(query) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.time("Query");

      let workers = {
        count: query.gliders.length,
        results: [],
        done: 0,
      };

      query.gliders.forEach((glider) => {
        let arrayWorker = new Worker("./src/worker.js");
        arrayWorker.postMessage([query, glider, workers.count]);
        arrayWorker.onmessage = (e) => {
          workers.results.push(e.data);
          workers.done++;
          if (workers.done === workers.count) {
            const mergedResults = [].concat(...workers.results);
            let count = query.gliders.length;
            query.parts.forEach((part) => {
              count = count * part.length;
            });

            console.timeEnd("Query");
            console.info(`Searched ${count.toLocaleString()} combination(s) with ${workers.count} thread(s)`);
            if (mergedResults.length === 0) {
              reject("No results found!");
            } else {
              console.info(`Showing top ${mergedResults.length} result(s)`);
              resolve(mergedResults);
            }
          }
          arrayWorker.terminate();
        };
      });
    }, 0);
  }).catch((e) => {
    alert(e);
  });
}

function calculatePartDelta(stat, target) {
  delta = stat - target;
  if (delta > 0) return `+${delta}`;
  return delta;
}

function clamp(val, min, max) {
  return val > max ? max : val < min ? min : val;
}

function parseResults(candidates, query) {
  // Sort by delta from least to greatest
  candidates.sort(function (a, b) {
    return a.delta - b.delta;
  });
  let html = "";
  candidates.forEach((candidate) => {
    html += `<tr ${selectedID === `${candidate.glider.code}-${candidate.id}` ? "class=results-selected" : ""} onmouseover='rowHover(this)' onclick='rowClick(this, event)'>`;
    html += `<td class='results-cell-bottom results-cell-right cell-ship' title="${candidate.glider.name} (${candidate.glider.code}) {${candidate.glider.score}} [${candidate.glider.stats}]\n\n${candidate.glider.desc}"><img src='./img/${candidate.glider.code}.webp'></img><span>${candidate.glider.code} - ${candidate.id}</span></td>`;
    candidate.rig.forEach((part) => {
      html += `<td class='results-cell-bottom cell-class-${part.class}' title="${part.name} (${part.class}) {${part.score}} [${part.stats}]\n\n${part.desc}">${part.code}</td>`;
    });
    html += `<td class='results-cell-bottom results-cell-left results-cell-right cell-score' title='Total delta: ${candidate.delta}'><span>${candidate.score}</span></td>`;
    candidate.stats.forEach((stat, statIndex) => {
      let statType = "";
      if (stat > query.stats[statIndex] * 1.1) {
        statType = "cell-good";
      } else if (stat < query.stats[statIndex] * 0.9) {
        statType = "cell-bad";
      }

      // Top speed tooltip
      let statEstimation = "";
      if (statIndex === 2) {
        statEstimation = `\n\n${redoutDB.graphs.speed[stat]} km/h (${Math.round(redoutDB.graphs.speed[stat] / 1.609344)} mph)`;
      }

      let delta = calculatePartDelta(stat, query.stats[statIndex]);
      html += `<td class='results-cell-bottom ${statType}' title='${chartLabels[statIndex]}: ${stat} (${new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 0,
      }).format(stat / 40)})\nStat delta: ${delta} (${new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 0,
      }).format(delta / 40)})${statEstimation}'>${stat}</td>`;
    });
    html += "</tr>";
  });
  return html;
}
