const API_URL =
    "https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/matches";

const TEAM_BADGES = [
    { id: 57, name: "Arsenal", crest: "https://crests.football-data.org/57.png" },
    { id: 58, name: "Aston Villa", crest: "https://crests.football-data.org/58.png" },
    { id: 1044, name: "Bournemouth", crest: "https://crests.football-data.org/1044.png" },
    { id: 402, name: "Brentford", crest: "https://crests.football-data.org/402.png" },
    { id: 397, name: "Brighton", crest: "https://crests.football-data.org/397.png" },
    { id: 328, name: "Burnley", crest: "https://crests.football-data.org/328.png" },
    { id: 61, name: "Chelsea", crest: "https://crests.football-data.org/61.png" },
    { id: 354, name: "Crystal Palace", crest: "https://crests.football-data.org/354.png" },
    { id: 62, name: "Everton", crest: "https://crests.football-data.org/62.png" },
    { id: 63, name: "Fulham", crest: "https://crests.football-data.org/63.png" },
    { id: 341, name: "Leeds United", crest: "https://crests.football-data.org/341.png" },
    { id: 64, name: "Liverpool", crest: "https://crests.football-data.org/64.png" },
    { id: 65, name: "Manchester City", crest: "https://crests.football-data.org/65.png" },
    { id: 66, name: "Manchester United", crest: "https://crests.football-data.org/66.png" },
    { id: 67, name: "Newcastle United", crest: "https://crests.football-data.org/67.png" },
    { id: 351, name: "Nottingham Forest", crest: "https://crests.football-data.org/351.png" },
    { id: 71, name: "Sunderland", crest: "https://crests.football-data.org/71.png" },
    { id: 73, name: "Tottenham Hotspur", crest: "https://crests.football-data.org/73.png" },
    { id: 563, name: "West Ham United", crest: "https://crests.football-data.org/563.png" },
    { id: 76, name: "Wolverhampton Wanderers", crest: "https://crests.football-data.org/76.png" }
];

let allMatches = [];

const select = document.getElementById("my-club-team-select");
const badges = document.getElementById("my-club-team-badges");
const content = document.getElementById("my-club-content");

function formatDate(dateString) {
    return new Date(dateString).toLocaleString("en-IE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Dublin"
    });
}

function getTeamName(team) {
    return team?.shortName || team?.name || "Unknown";
}

function getTeamCrest(team) {
    return team?.crest || "";
}

function getSelectedTeam() {
    return localStorage.getItem("selectedPremierLeagueTeam");
}

function setSelectedTeam(id) {
    localStorage.setItem("selectedPremierLeagueTeam", String(id));
    select.value = String(id);
    showSelectedTeam();
}

function buildSelector() {
    select.innerHTML = '<option value="">Select your team...</option>';

    TEAM_BADGES
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(team => {
            const option = document.createElement("option");
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });

    badges.innerHTML = TEAM_BADGES.map(team => `
        <button class="team-badge" type="button" data-team-id="${team.id}" aria-label="Select ${team.name}">
            <img src="${team.crest}" alt="" width="44" height="44">
            <span>${team.name}</span>
        </button>
    `).join("");

    badges.querySelectorAll(".team-badge").forEach(button => {
        button.addEventListener("click", () => setSelectedTeam(button.dataset.teamId));
    });

    select.addEventListener("change", () => {
        if (select.value) {
            setSelectedTeam(select.value);
        }
    });
}

function findSelectedTeam() {
    const id = Number(getSelectedTeam());
    return TEAM_BADGES.find(team => team.id === id);
}

function showSelectedTeam() {
    const team = findSelectedTeam();

    if (!team) {
        content.classList.add("hidden");
        badges.classList.remove("hidden");
        select.value = "";
        return;
    }

    select.value = String(team.id);
    badges.classList.add("hidden");
    content.classList.remove("hidden");

    document.getElementById("my-club-crest").src = team.crest;
    document.getElementById("my-club-crest").alt = team.name + " crest";
    document.getElementById("my-club-name").textContent = team.name;

    renderTeamMatches(team.id);
}

function createFeatureMatch(match, isUpcoming = false) {
    const homeName = getTeamName(match.homeTeam);
    const awayName = getTeamName(match.awayTeam);
    const homeCrest = getTeamCrest(match.homeTeam);
    const awayCrest = getTeamCrest(match.awayTeam);

    const homeScore = match.score?.fullTime?.home;
    const awayScore = match.score?.fullTime?.away;

    const scoreText = !isUpcoming && homeScore !== null && homeScore !== undefined &&
        awayScore !== null && awayScore !== undefined
        ? `${homeScore} - ${awayScore}`
        : "vs";

    const statusText = !isUpcoming && scoreText !== "vs"
        ? "FULL TIME"
        : formatDate(match.utcDate);

    return `
        <div class="arsenal-feature-match">
            <div class="feature-team">
                ${homeCrest ? `<img src="${homeCrest}" alt="">` : ""}
                <strong>${homeName}</strong>
            </div>

            <div class="feature-score">
                <strong>${scoreText}</strong>
                <span>${statusText}</span>
            </div>

            <div class="feature-team">
                ${awayCrest ? `<img src="${awayCrest}" alt="">` : ""}
                <strong>${awayName}</strong>
            </div>
        </div>
    `;
}

function createMatchCard(match) {
    const homeName = getTeamName(match.homeTeam);
    const awayName = getTeamName(match.awayTeam);
    const homeCrest = getTeamCrest(match.homeTeam);
    const awayCrest = getTeamCrest(match.awayTeam);

    const homeScore = match.score?.fullTime?.home;
    const awayScore = match.score?.fullTime?.away;

    const isFinished = match.status === "FINISHED";
    const score = isFinished && homeScore !== null && awayScore !== null
        ? `${homeScore} - ${awayScore}`
        : "vs";

    return `
        <div class="match">
            <div class="team home">
                ${homeCrest ? `<img src="${homeCrest}" alt="" width="28" height="28">` : ""}
                <span>${homeName}</span>
            </div>

            <div class="score">
                <strong>${score}</strong>
                <small>${formatDate(match.utcDate)}</small>
            </div>

            <div class="team away">
                <span>${awayName}</span>
                ${awayCrest ? `<img src="${awayCrest}" alt="" width="28" height="28">` : ""}
            </div>
        </div>
    `;
}

function renderTeamMatches(teamId) {
    const matches = allMatches.filter(match =>
        match.homeTeam?.id === teamId ||
        match.awayTeam?.id === teamId
    );

    const completed = matches
        .filter(match => match.status === "FINISHED")
        .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));

    const upcoming = matches
        .filter(match => new Date(match.utcDate) > new Date() && match.status !== "FINISHED")
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    const latestContainer = document.getElementById("arsenal-latest-match");
    const nextContainer = document.getElementById("arsenal-next-match");
    const resultsContainer = document.getElementById("arsenal-results");
    const fixturesContainer = document.getElementById("arsenal-fixtures");

    latestContainer.innerHTML = completed.length
        ? createFeatureMatch(completed[0])
        : '<p class="loading">No results available.</p>';

    nextContainer.innerHTML = upcoming.length
        ? createFeatureMatch(upcoming[0], true)
        : '<p class="loading">No upcoming fixtures.</p>';

    resultsContainer.innerHTML = completed.length
        ? completed.slice(0, 5).map(createMatchCard).join("")
        : '<p class="loading">No recent results available.</p>';

    fixturesContainer.innerHTML = upcoming.length
        ? upcoming.slice(0, 5).map(createMatchCard).join("")
        : '<p class="loading">No upcoming fixtures available.</p>';
}

async function loadMatches() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        allMatches = data.matches || [];

        buildSelector();
        showSelectedTeam();

    } catch (error) {
        console.error("Failed to load Premier League data:", error);

        content.classList.remove("hidden");
        content.innerHTML = '<p class="loading">Unable to load club information.</p>';
    }
}

loadMatches();
