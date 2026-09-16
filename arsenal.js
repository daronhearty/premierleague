const API_URL =
    "https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/matches";


/* =========================================
   LOAD ARSENAL MATCHES
   ========================================= */

async function loadArsenalMatches() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        const allMatches = data.matches || [];

        /*
         * Arsenal's football-data.org team ID is 57.
         */
        const arsenalMatches = allMatches.filter(match =>
            match.homeTeam?.id === 57 ||
            match.awayTeam?.id === 57
        );


        displayLatestMatch(arsenalMatches);

        displayNextMatch(arsenalMatches);

        displayRecentResults(arsenalMatches);

        displayUpcomingFixtures(arsenalMatches);


    } catch (error) {

        console.error(
            "Failed to load Arsenal data:",
            error
        );

        document.getElementById(
            "arsenal-latest-match"
        ).innerHTML =
            '<p class="loading">Unable to load Arsenal data.</p>';

        document.getElementById(
            "arsenal-next-match"
        ).innerHTML =
            '<p class="loading">Unable to load Arsenal data.</p>';

        document.getElementById(
            "arsenal-results"
        ).innerHTML =
            '<p class="loading">Unable to load Arsenal results.</p>';

        document.getElementById(
            "arsenal-fixtures"
        ).innerHTML =
            '<p class="loading">Unable to load Arsenal fixtures.</p>';
    }
}


/* =========================================
   FORMAT DATE
   ========================================= */

function formatArsenalDate(dateString) {

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


/* =========================================
   GET TEAM NAME
   ========================================= */

function getTeamName(team) {

    return (
        team?.shortName ||
        team?.name ||
        "Unknown"
    );
}


/* =========================================
   GET TEAM CREST
   ========================================= */

function getTeamCrest(team) {

    return team?.crest || "";
}


/* =========================================
   CREATE FEATURE MATCH
   ========================================= */

function createFeatureMatch(match, isUpcoming = false) {

    const homeName =
        getTeamName(match.homeTeam);

    const awayName =
        getTeamName(match.awayTeam);

    const homeCrest =
        getTeamCrest(match.homeTeam);

    const awayCrest =
        getTeamCrest(match.awayTeam);


    const homeScore =
        match.score?.fullTime?.home;

    const awayScore =
        match.score?.fullTime?.away;


    let scoreText = "vs";

    let statusText = "";


    if (!isUpcoming && homeScore !== null && awayScore !== null) {

        scoreText =
            `${homeScore} - ${awayScore}`;

        statusText = "FULL TIME";

    }


    return `

        <div class="arsenal-feature-match">

            <div class="feature-team">

                ${
                    homeCrest
                        ? `<img src="${homeCrest}" alt="">`
                        : ""
                }

                <strong>${homeName}</strong>

            </div>


            <div class="feature-score">

                <strong>${scoreText}</strong>

                ${
                    statusText
                        ? `<span>${statusText}</span>`
                        : `<span>${formatArsenalDate(match.utcDate)}</span>`
                }

            </div>


            <div class="feature-team">

                ${
                    awayCrest
                        ? `<img src="${awayCrest}" alt="">`
                        : ""
                }

                <strong>${awayName}</strong>

            </div>

        </div>

    `;
}


/* =========================================
   CREATE NORMAL MATCH CARD
   ========================================= */

function createArsenalMatchCard(match) {

    const homeName =
        getTeamName(match.homeTeam);

    const awayName =
        getTeamName(match.awayTeam);

    const homeCrest =
        getTeamCrest(match.homeTeam);

    const awayCrest =
        getTeamCrest(match.awayTeam);


    const homeScore =
        match.score?.fullTime?.home;

    const awayScore =
        match.score?.fullTime?.away;


    const isFinished =
        match.status === "FINISHED";


    const score = isFinished
        ? `${homeScore} - ${awayScore}`
        : "vs";


    return `

        <div class="match">

            <div class="team home">

                ${
                    homeCrest
                        ? `<img src="${homeCrest}" alt="">`
                        : ""
                }

                <span>${homeName}</span>

            </div>


            <div class="score">

                <strong>${score}</strong>

                <small>
                    ${formatArsenalDate(match.utcDate)}
                </small>

            </div>


            <div class="team away">

                ${
                    awayCrest
                        ? `<img src="${awayCrest}" alt="">`
                        : ""
                }

                <span>${awayName}</span>

            </div>

        </div>

    `;
}


/* =========================================
   LATEST MATCH
   ========================================= */

function displayLatestMatch(matches) {

    const completedMatches = matches

        .filter(match =>
            match.status === "FINISHED"
        )

        .sort((a, b) =>
            new Date(b.utcDate) -
            new Date(a.utcDate)
        );


    const container =
        document.getElementById(
            "arsenal-latest-match"
        );


    if (completedMatches.length === 0) {

        container.innerHTML =
            '<p class="loading">No Arsenal results available.</p>';

        return;
    }


    container.innerHTML =
        createFeatureMatch(
            completedMatches[0]
        );
}


/* =========================================
   NEXT MATCH
   ========================================= */

function displayNextMatch(matches) {

    const now = new Date();


    const upcomingMatches = matches

        .filter(match => {

            return (
                new Date(match.utcDate) > now &&
                match.status !== "FINISHED"
            );

        })

        .sort((a, b) =>
            new Date(a.utcDate) -
            new Date(b.utcDate)
        );


    const container =
        document.getElementById(
            "arsenal-next-match"
        );


    if (upcomingMatches.length === 0) {

        container.innerHTML =
            '<p class="loading">No upcoming Arsenal fixtures.</p>';

        return;
    }


    container.innerHTML =
        createFeatureMatch(
            upcomingMatches[0],
            true
        );
}


/* =========================================
   RECENT RESULTS
   ========================================= */

function displayRecentResults(matches) {

    const results = matches

        .filter(match =>
            match.status === "FINISHED"
        )

        .sort((a, b) =>
            new Date(b.utcDate) -
            new Date(a.utcDate)
        )

        .slice(0, 5);


    const container =
        document.getElementById(
            "arsenal-results"
        );


    if (results.length === 0) {

        container.innerHTML =
            '<p class="loading">No Arsenal results available.</p>';

        return;
    }


    container.innerHTML =
        results
            .map(createArsenalMatchCard)
            .join("");
}


/* =========================================
   UPCOMING FIXTURES
   ========================================= */

function displayUpcomingFixtures(matches) {

    const now = new Date();


    const fixtures = matches

        .filter(match => {

            return (
                new Date(match.utcDate) > now &&
                match.status !== "FINISHED"
            );

        })

        .sort((a, b) =>
            new Date(a.utcDate) -
            new Date(b.utcDate)
        )

        .slice(0, 5);


    const container =
        document.getElementById(
            "arsenal-fixtures"
        );


    if (fixtures.length === 0) {

        container.innerHTML =
            '<p class="loading">No upcoming Arsenal fixtures.</p>';

        return;
    }


    container.innerHTML =
        fixtures
            .map(createArsenalMatchCard)
            .join("");
}


/* =========================================
   START
   ========================================= */

loadArsenalMatches();
