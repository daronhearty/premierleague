const API_URL =
    "https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/matches";


// -----------------------------
// LOAD PREMIER LEAGUE MATCHES
// -----------------------------

async function loadMatches() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        const matches = data.matches || [];

        displayLiveMatches(matches);
        displayTodaysMatches(matches);
        displayLatestResults(matches);
        displayNextFixtures(matches);

    } catch (error) {

        console.error("Failed to load Premier League data:", error);

        document.getElementById("live-matches").innerHTML =
            '<p class="loading">Unable to load live matches.</p>';

        document.getElementById("todays-matches").innerHTML =
            '<p class="loading">Unable to load today\'s matches.</p>';

        document.getElementById("latest-results").innerHTML =
            '<p class="loading">Unable to load results.</p>';

        document.getElementById("next-fixtures").innerHTML =
            '<p class="loading">Unable to load fixtures.</p>';
    }
}


// -----------------------------
// FORMAT DATE
// -----------------------------

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleString("en-IE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Dublin"
    });
}


// -----------------------------
// FORMAT GOAL TIME
// -----------------------------

function formatGoalMinute(goal) {

    const minute = goal?.minute;

    if (minute === null || minute === undefined) {
        return "";
    }

    const injuryTime = goal?.injuryTime;

    return injuryTime
        ? `${minute}+${injuryTime}'`
        : `${minute}'`;
}


// -----------------------------
// GET GOAL SCORER NAME
// -----------------------------

function getScorerName(goal) {

    return (
        goal?.scorer?.name ||
        goal?.scorer?.shortName ||
        goal?.player?.name ||
        "Unknown scorer"
    );
}


// -----------------------------
// MATCH EVENTS / GOAL TIMELINE
// -----------------------------

function getMatchGoals(match) {

    if (!Array.isArray(match.goals)) {
        return [];
    }

    return [...match.goals].sort((a, b) => {

        const aMinute = Number(a?.minute ?? 0);
        const bMinute = Number(b?.minute ?? 0);

        const aInjury = Number(a?.injuryTime ?? 0);
        const bInjury = Number(b?.injuryTime ?? 0);

        return (aMinute + aInjury / 100) - (bMinute + bInjury / 100);
    });
}


function createGoalTimeline(match) {

    const goals = getMatchGoals(match);

    if (goals.length === 0) {

        const message = match.status === "FINISHED"
            ? "No goals were scored in this match."
            : "No goals have been scored yet.";

        return `
            <div class="match-no-goals">
                <span>${message}</span>
            </div>
        `;
    }

    return `
        <div class="goal-timeline" aria-label="Goal timeline">
            ${goals.map(goal => {

                const scorer = getScorerName(goal);
                const minute = formatGoalMinute(goal);
                const teamId = goal?.team?.id;
                const homeId = match.homeTeam?.id;
                const isHomeGoal = teamId !== undefined && teamId === homeId;

                const goalType = goal?.type === "OWN_GOAL"
                    ? "Own goal"
                    : goal?.type === "PENALTY"
                        ? "Penalty"
                        : "";

                return `
                    <div class="goal-event ${isHomeGoal ? "home-goal" : "away-goal"}">

                        <div class="goal-event-content">
                            <span class="goal-minute">${minute}</span>
                            <span class="goal-icon" aria-hidden="true">⚽</span>
                            <span class="goal-scorer">${scorer}</span>
                            ${goalType ? `<span class="goal-type">${goalType}</span>` : ""}
                        </div>

                    </div>
                `;

            }).join("")}
        </div>
    `;
}


// -----------------------------
// MATCH CARD
// -----------------------------

function createMatchCard(match) {

    const homeTeam = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
    const awayTeam = match.awayTeam?.shortName || match.awayTeam?.name || "Away";

    const homeCrest = match.homeTeam?.crest || "";
    const awayCrest = match.awayTeam?.crest || "";

    const homeScore = match.score?.fullTime?.home;
    const awayScore = match.score?.fullTime?.away;

    const isPlayed =
        homeScore !== null &&
        homeScore !== undefined &&
        awayScore !== null &&
        awayScore !== undefined;

    const isLive = [
        "LIVE",
        "IN_PLAY",
        "PAUSED"
    ].includes(match.status);

    const isExpandable = isPlayed || isLive;

    const score = isPlayed
        ? `${homeScore} - ${awayScore}`
        : "vs";

    const wrapperClass = isExpandable
        ? "match-wrapper match-wrapper-expandable"
        : "match-wrapper";

    return `
        <div class="${wrapperClass}">

            <div
                class="match${isExpandable ? " match-expandable" : ""}"
                ${isExpandable ? `data-match-id="${match.id}" tabindex="0" role="button" aria-expanded="false" aria-label="Show goals for ${homeTeam} versus ${awayTeam}"` : ""}
            >

                <div class="team home">
                    ${homeCrest ? `<img src="${homeCrest}" alt="" width="28" height="28">` : ""}
                    <span>${homeTeam}</span>
                </div>

                <div class="score">
                    <strong>${score}</strong>
                    <small>${formatDate(match.utcDate)}</small>
                </div>

                <div class="team away">
                    ${awayCrest ? `<img src="${awayCrest}" alt="" width="28" height="28">` : ""}
                    <span>${awayTeam}</span>
                </div>

            </div>

            ${isExpandable ? `
                <div class="match-details" aria-hidden="true">
                    <div class="match-details-inner">
                        ${createGoalTimeline(match)}
                    </div>
                </div>
            ` : ""}

        </div>
    `;
}


// -----------------------------
// MATCH CARD INTERACTION
// -----------------------------

function closeExpandedMatch(exceptMatch = null) {

    document.querySelectorAll(".match-expandable.expanded").forEach(match => {

        if (match === exceptMatch) {
            return;
        }

        match.classList.remove("expanded");
        match.setAttribute("aria-expanded", "false");

        const details = match.parentElement?.querySelector(".match-details");

        if (details) {
            details.setAttribute("aria-hidden", "true");
        }
    });
}


function toggleMatch(matchElement) {

    const isExpanded = matchElement.classList.contains("expanded");

    closeExpandedMatch(matchElement);

    matchElement.classList.toggle("expanded", !isExpanded);
    matchElement.setAttribute("aria-expanded", String(!isExpanded));

    const details = matchElement.parentElement?.querySelector(".match-details");

    if (details) {
        details.setAttribute("aria-hidden", String(isExpanded));
    }
}


function handleMatchInteraction(event) {

    const matchElement = event.target.closest(".match-expandable");

    if (!matchElement) {
        return;
    }

    toggleMatch(matchElement);
}


document.addEventListener("click", handleMatchInteraction);

document.addEventListener("keydown", event => {

    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    const matchElement = event.target.closest(".match-expandable");

    if (!matchElement) {
        return;
    }

    event.preventDefault();
    toggleMatch(matchElement);
});


// -----------------------------
// TODAY'S DATE
// -----------------------------

function getTodayString() {

    const now = new Date();

    return now.toLocaleDateString("en-CA", {
        timeZone: "Europe/Dublin"
    });
}


// -----------------------------
// LIVE MATCHES
// -----------------------------

function displayLiveMatches(matches) {

    const liveStatuses = [
        "LIVE",
        "IN_PLAY",
        "PAUSED"
    ];

    const live = matches.filter(match =>
        liveStatuses.includes(match.status)
    );

    const container = document.getElementById("live-matches");

    if (live.length === 0) {

        container.innerHTML =
            '<p class="loading">No Premier League matches are live right now.</p>';

        return;
    }

    container.innerHTML = live
        .map(createMatchCard)
        .join("");
}


// -----------------------------
// TODAY'S MATCHES
// -----------------------------

function displayTodaysMatches(matches) {

    const today = getTodayString();

    const todaysMatches = matches
        .filter(match => {

            const matchDate = new Date(match.utcDate)
                .toLocaleDateString("en-CA", {
                    timeZone: "Europe/Dublin"
                });

            return matchDate === today;
        })
        .sort((a, b) =>
            new Date(a.utcDate) - new Date(b.utcDate)
        );

    const container = document.getElementById("todays-matches");

    if (todaysMatches.length === 0) {

        container.innerHTML =
            '<p class="loading">There are no Premier League matches today.</p>';

        return;
    }

    container.innerHTML = todaysMatches
        .map(createMatchCard)
        .join("");
}


// -----------------------------
// LATEST RESULTS
// -----------------------------

function displayLatestResults(matches) {

    const results = matches
        .filter(match =>
            match.status === "FINISHED"
        )
        .sort((a, b) =>
            new Date(b.utcDate) - new Date(a.utcDate)
        )
        .slice(0, 5);

    const container = document.getElementById("latest-results");

    if (results.length === 0) {

        container.innerHTML =
            '<p class="loading">No results available yet.</p>';

        return;
    }

    container.innerHTML = results
        .map(createMatchCard)
        .join("");
}


// -----------------------------
// NEXT FIXTURES
// -----------------------------

function displayNextFixtures(matches) {

    const now = new Date();

    const upcoming = matches
        .filter(match =>
            new Date(match.utcDate) > now &&
            match.status !== "FINISHED"
        )
        .sort((a, b) =>
            new Date(a.utcDate) - new Date(b.utcDate)
        )
        .slice(0, 5);

    const container = document.getElementById("next-fixtures");

    if (upcoming.length === 0) {

        container.innerHTML =
            '<p class="loading">No upcoming fixtures found.</p>';

        return;
    }

    container.innerHTML = upcoming
        .map(createMatchCard)
        .join("");
}


// -----------------------------
// START
// -----------------------------

loadMatches();
