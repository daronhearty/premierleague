const API_URL =
    "https://premier-league-api.daronhearty.workers.dev/?endpoint=bigballs-standings";

/* =========================================
   LOAD PREMIER LEAGUE TABLE
   ========================================= */

async function loadTable() {
    const tableBody = document.getElementById("table-body");
    if (!tableBody) return;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const payload = await response.json();
        const standings = payload?.data?.standings;
        const table = Array.isArray(standings)
            ? standings.find(item => item.league_name === "EPL")?.rows
                || standings[0]?.rows
            : null;

        if (!Array.isArray(table) || table.length === 0) {
            throw new Error("Premier League table not found.");
        }

        tableBody.innerHTML = table.map(createTableRow).join("");
    } catch (error) {
        console.error("Failed to load Premier League table:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="loading">
                    Unable to load the Premier League table.
                </td>
            </tr>
        `;
    }
}

/* =========================================
   CREATE TABLE ROW
   ========================================= */

function createTableRow(team) {
    const name = team.team_name || "Unknown";
    const played = Number(team.games_played ?? 0);
    const wins = Number(team.wins ?? 0);
    const draws = Number(team.ties ?? 0);
    const losses = Number(team.losses ?? 0);
    const goalsFor = Number(team.points_for ?? 0);
    const goalsAgainst = Number(team.points_against ?? 0);
    const goalDifference = goalsFor - goalsAgainst;
    const points = wins * 3 + draws;
    const crest = team.logo_url || "";
    const isArsenal = name.toLowerCase() === "arsenal";

    return `
        <tr class="${isArsenal ? "arsenal-row" : ""}">
            <td class="position">${team.rank ?? ""}</td>
            <td class="table-team">
                ${crest ? `<img src="${crest}" alt="" width="28" height="28" loading="lazy">` : ""}
                <span>${escapeTableText(name)}</span>
            </td>
            <td>${played}</td>
            <td>${wins}</td>
            <td>${draws}</td>
            <td>${losses}</td>
            <td>${goalsFor}</td>
            <td>${goalsAgainst}</td>
            <td>${formatGoalDifference(goalDifference)}</td>
            <td class="points">${points}</td>
        </tr>
    `;
}

function escapeTableText(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatGoalDifference(value) {
    return value > 0 ? `+${value}` : value;
}

/* =========================================
   START
   ========================================= */

loadTable();
