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

    const score = isPlayed
        ? `${homeScore} - ${awayScore}`
        : "vs";

    return `
        <div class="match">

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
    `;
}


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
