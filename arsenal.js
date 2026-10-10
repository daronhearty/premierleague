const TEAM_BADGES = [
    { id: 57, name: "Arsenal", crest: "https://crests.football-data.org/57.png" },
    { id: 58, name: "Aston Villa", crest: "https://crests.football-data.org/58.png" },
    { id: 1044, name: "Bournemouth", crest: "https://crests.football-data.org/1044.png" },
    { id: 402, name: "Brentford", crest: "https://crests.football-data.org/402.png" },
    { id: 397, name: "Brighton", crest: "https://crests.football-data.org/397.png" },
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
    { id: 349, name: "Ipswich Town", crest: "https://api.bigballsdata.com/v1/assets/aA_ZJyJSavLBDZxcDgEJn4pNqwqWXiLR8aVMohPMeiWQUVq32eLLIrC4tqmG_PgpiNd-xJApwKaUaGBdHAlZESC8aJY" },
    { id: 322, name: "Hull City", crest: "https://api.bigballsdata.com/v1/assets/JnNFfB1nlbrq18pKBXkLj9WHSSgocLwJx__YXlUiLUz_j8k28a4dX4aoWPRhBVyc1vscXn6v0uFJIGFDtgSWEhrqQZ7nxRlYpTRlYmKaqLc" },
    { id: 1076, name: "Coventry City", crest: "https://api.bigballsdata.com/v1/assets/o32rgc66eOVAOmNYd5z-QEaNlmlvNYqOIlWFHwTilkJSyFc14TCHbmXgq3MV2VQFhJFSe7LQy78Hiv3nKD9ZUcOInqP8" }
];

let allMatches = [];

const badges = document.getElementById("my-club-team-badges");
const content = document.getElementById("my-club-content");
const select = document.getElementById("my-club-team-select");
const selector = document.querySelector(".my-club-team-selector");

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

    select.addEventListener("change", () => {
        if (select.value) setSelectedTeam(select.value);
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
}

function findSelectedTeam() {
    const id = Number(getSelectedTeam());
    return TEAM_BADGES.find(team => team.id === id);
}

function showSelectedTeam() {
    const team = findSelectedTeam();

    if (!team) {
        content.classList.add("hidden");
        selector.classList.add("hidden");
        badges.classList.remove("hidden");
 
        return;
    }

    badges.classList.add("hidden");
    selector.classList.remove("hidden");
    select.value = String(team.id);
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
    const score = isFinished && homeScore !== null && awayScore !== null ? `${homeScore} - ${awayScore}` : "vs";
    const expandable = isFinished || ["IN_PLAY", "PAUSED"].includes(match.status);
    return `
        <div class="match-wrapper${expandable ? " match-wrapper-expandable" : ""}">
            <div class="match${expandable ? " match-expandable" : ""}" ${expandable ? `data-match-id="${match.id}" tabindex="0" role="button" aria-expanded="false" aria-label="Show goals for ${homeName} versus ${awayName}"` : ""}>
                <div class="team home">${homeCrest ? `<img src="${homeCrest}" alt="" width="28" height="28">` : ""}<span>${homeName}</span></div>
                <div class="score"><strong>${score}</strong><small>${formatDate(match.utcDate)}</small></div>
                <div class="team away"><span>${awayName}</span>${awayCrest ? `<img src="${awayCrest}" alt="" width="28" height="28">` : ""}</div>
            </div>
            ${expandable ? `<div class="match-details" aria-hidden="true"><div class="match-details-inner">${createGoalTimeline(match)}</div></div>` : ""}
        </div>
    `;
}

function createGoalTimeline(match) {
    if (!Array.isArray(match.goals)) return '<div class="match-no-goals"><span>Tap to load goal details.</span></div>';
    if (!match.goals.length) return '<div class="match-no-goals"><span>No goals were recorded for this match.</span></div>';
    return '<div class="goal-timeline" aria-label="Goal timeline">' + match.goals.map(goal => {
        const isHomeGoal = goal.team?.id === match.homeTeam?.id;
        const minute = goal.injuryTime ? goal.minute + "+" + goal.injuryTime + "'" : goal.minute + "'";
        const type = goal.type === "OWN_GOAL" ? "Own goal" : goal.type === "PENALTY" ? "Penalty" : "";
        return '<div class="goal-event ' + (isHomeGoal ? "home-goal" : "away-goal") + '"><div class="goal-event-content"><span class="goal-minute">' + minute + '</span><span class="goal-icon" aria-hidden="true">⚽</span><span class="goal-scorer">' + (goal.scorer?.name || "Unknown scorer") + '</span>' + (goal.assist ? '<span class="goal-assist">Assist: ' + goal.assist + '</span>' : '') + (type ? '<span class="goal-type">' + type + '</span>' : '') + '</div></div>';
    }).join("") + '</div>';
}

function closeExpandedMatch(exceptMatch = null) {
    document.querySelectorAll(".match-expandable.expanded").forEach(match => {
        if (match === exceptMatch) return;
        match.classList.remove("expanded");
        match.setAttribute("aria-expanded", "false");
        const details = match.parentElement?.querySelector(".match-details");
        if (details) details.setAttribute("aria-hidden", "true");
    });
}

async function toggleMatch(matchElement) {
    const isExpanded = matchElement.classList.contains("expanded");
    closeExpandedMatch(matchElement);
    matchElement.classList.toggle("expanded", !isExpanded);
    matchElement.setAttribute("aria-expanded", String(!isExpanded));
    const details = matchElement.parentElement?.querySelector(".match-details");
    if (details) details.setAttribute("aria-hidden", String(isExpanded));
    if (isExpanded) return;
    const match = allMatches.find(item => String(item.id) === String(matchElement.dataset.matchId));
    if (!match || Array.isArray(match.goals)) return;
    const inner = details?.querySelector(".match-details-inner");
    if (inner) inner.innerHTML = '<div class="match-no-goals"><span>Loading goal details…</span></div>';
    try {
        await NoSpoilersAPI.loadGoals(match.id, match);
        if (matchElement.classList.contains("expanded") && inner) inner.innerHTML = createGoalTimeline(match);
    } catch (error) {
        console.error("Unable to load goal events:", error);
        if (inner && matchElement.classList.contains("expanded")) inner.innerHTML = '<div class="match-no-goals"><span>Goal details are temporarily unavailable. Tap to close and reopen to retry.</span></div>';
    }
}

document.addEventListener("click", event => {
    const match = event.target.closest(".match-expandable");
    if (match) toggleMatch(match);
});
document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const match = event.target.closest(".match-expandable");
    if (!match) return;
    event.preventDefault();
    toggleMatch(match);
})

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
        allMatches = await NoSpoilersAPI.loadMatches();

        buildSelector();
        showSelectedTeam();

    } catch (error) {
        console.error("Failed to load Premier League data:", error);

        content.classList.remove("hidden");
        content.innerHTML = '<p class="loading">Unable to load club information.</p>';
    }
}

loadMatches();
