const API_URL =
    "https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/matches";


/* =====================================================
   LOAD PREMIER LEAGUE MATCHES
   ===================================================== */

async function loadMatches() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        const matches = data.matches || [];


        /* =================================================
           REMOVE ALL ARSENAL MATCHES

           Arsenal's football-data.org team ID = 57
           ================================================= */

        const nonArsenalMatches = matches.filter(match => {

            return (
                match.homeTeam?.id !== 57 &&
                match.awayTeam?.id !== 57
            );

        });


        displayTodaysFixtures(nonArsenalMatches);

        displayLatestResults(nonArsenalMatches);


    } catch (error) {

        console.error(
            "Failed to load Premier League data:",
            error
        );


        document.getElementById("todays-fixtures").innerHTML =
            '<p class="loading">Unable to load today\'s fixtures.</p>';


        document.getElementById("latest-results").innerHTML =
            '<p class="loading">Unable to load results.</p>';

    }

}


/* =====================================================
   GET TODAY'S DATE
   ===================================================== */

function getTodayString() {

    const now = new Date();

    return now.toLocaleDateString("en-CA", {

        timeZone: "Europe/Dublin"

    });

}


/* =====================================================
   FORMAT MATCH DATE / TIME
   ===================================================== */

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


/* =====================================================
   CREATE MATCH CARD
   ===================================================== */

function createMatchCard(match) {

    const homeTeam =
        match.homeTeam?.shortName ||
        match.homeTeam?.name ||
        "Home";


    const awayTeam =
        match.awayTeam?.shortName ||
        match.awayTeam?.name ||
        "Away";


    const homeCrest =
        match.homeTeam?.crest || "";


    const awayCrest =
        match.awayTeam?.crest || "";


    const homeScore =
        match.score?.fullTime?.home;


    const awayScore =
        match.score?.fullTime?.away;


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

            <!-- HOME TEAM -->

            <div class="team home">

                ${
                    homeCrest
                        ? `
                            <img
                                src="${homeCrest}"
                                alt=""
                                width="28"
                                height="28"
                            >
                          `
                        : ""
                }

                <span>${homeTeam}</span>

            </div>


            <!-- SCORE / TIME -->

            <div class="score">

                <strong>${score}</strong>

                <small>
                    ${formatDate(match.utcDate)}
                </small>

            </div>


            <!-- AWAY TEAM -->

            <div class="team away">

                ${
                    awayCrest
                        ? `
                            <img
                                src="${awayCrest}"
                                alt=""
                                width="28"
                                height="28"
                            >
                          `
                        : ""
                }

                <span>${awayTeam}</span>

            </div>

        </div>

    `;

}


/* =====================================================
   TODAY'S FIXTURES
   ===================================================== */

function displayTodaysFixtures(matches) {

    const today = getTodayString();


    const todaysMatches = matches

        .filter(match => {

            const matchDate =
                new Date(match.utcDate)
                    .toLocaleDateString("en-CA", {

                        timeZone: "Europe/Dublin"

                    });

            return matchDate === today;

        })

        .sort((a, b) => {

            return (
                new Date(a.utcDate) -
                new Date(b.utcDate)
            );

        });


    const container =
        document.getElementById("todays-fixtures");


    if (todaysMatches.length === 0) {

        container.innerHTML =
            '<p class="loading">There are no other Premier League fixtures today.</p>';

        return;

    }


    container.innerHTML =
        todaysMatches
            .map(createMatchCard)
            .join("");

}


/* =====================================================
   LATEST RESULTS
   ===================================================== */

function displayLatestResults(matches) {

    const results = matches

        .filter(match => {

            return match.status === "FINISHED";

        })

        .sort((a, b) => {

            return (
                new Date(b.utcDate) -
                new Date(a.utcDate)
            );

        })

        .slice(0, 10);


    const container =
        document.getElementById("latest-results");


    if (results.length === 0) {

        container.innerHTML =
            '<p class="loading">No recent results available.</p>';

        return;

    }


    container.innerHTML =
        results
            .map(createMatchCard)
            .join("");

}


/* =====================================================
   START
   ===================================================== */

loadMatches();
