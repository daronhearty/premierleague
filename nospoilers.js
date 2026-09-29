const API_URL =
    "https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/matches";


let allMatches = [];

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

let allTeams = [];

const teamSelect =
    document.getElementById("team-select");


/*
    Build the team list from the matches
*/

function buildTeamList() {

    const teams = new Map();


    allMatches.forEach(match => {

        if (match.homeTeam?.id) {

            teams.set(
                match.homeTeam.id,
                match.homeTeam
            );

        }


        if (match.awayTeam?.id) {

            teams.set(
                match.awayTeam.id,
                match.awayTeam
            );

        }

    });


    allTeams =
        Array.from(teams.values())
            .sort((a, b) => {

                const nameA =
                    a.shortName || a.name || "";

                const nameB =
                    b.shortName || b.name || "";

                return nameA.localeCompare(nameB);

            });


    populateTeamSelector();
    populateTeamBadges();
    updateTeamSelector();
    updateBadgePicker();

}


/*
    Populate the team selector
*/

function populateTeamSelector() {

    teamSelect.innerHTML =
        '<option value="">Select your team...</option>';


    allTeams.forEach(team => {

        const option =
            document.createElement("option");


        option.value =
            team.id;


        option.textContent =
            team.shortName ||
            team.name;


        teamSelect.appendChild(option);

    });


    /*
        Restore previously selected team
    */

    const savedTeam =
        localStorage.getItem(
            "selectedPremierLeagueTeam"
        );


    if (savedTeam) {

        const teamExists =
            allTeams.some(team =>
                String(team.id) ===
                String(savedTeam)
            );

        if (teamExists) {
            teamSelect.value = savedTeam;
        } else {
            localStorage.removeItem(
                "selectedPremierLeagueTeam"
            );
        }
    }
}



function populateTeamBadges() {
    const container = document.getElementById("team-badges");

    container.innerHTML = TEAM_BADGES.map(team => `
        <button class="team-badge" type="button" data-team-id="${team.id}" aria-label="Select ${team.name}">
            <img src="${team.crest}" alt="" width="44" height="44">
            <span>${team.name}</span>
        </button>
    `).join("");

    container.querySelectorAll(".team-badge").forEach(button => {
        button.addEventListener("click", () => {
            selectTeam(button.dataset.teamId);
        });
    });
}

function selectTeam(teamId) {
    localStorage.setItem("selectedPremierLeagueTeam", String(teamId));
    teamSelect.value = String(teamId);
    updateTeamSelector();
    updateBadgePicker();
    updatePage();
}

function updateTeamSelector() {
    const selectedTeam = getSelectedTeam();
    const selector = document.querySelector(".team-selector");

    if (selectedTeam) {
        selector.classList.remove("hidden");
    } else {
        selector.classList.add("hidden");
    }
}

function updateBadgePicker() {
    const selectedTeam = getSelectedTeam();
    const container = document.getElementById("team-badges");

    if (selectedTeam) {
        container.classList.add("hidden");
    } else {
        container.classList.remove("hidden");
    }
}


/*
    Get today's date in Ireland
*/

function getTodayString() {

    const now =
        new Date();


    return now.toLocaleDateString(
        "en-CA",
        {
            timeZone: "Europe/Dublin"
        }
    );

}


/*
    Format match date/time
*/

function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleString(
        "en-IE",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Dublin"
        }
    );

}


/*
    Create a match card
*/

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


    const score =
        isPlayed
            ? `${homeScore} - ${awayScore}`
            : "vs";


    return `
        <div class="match">

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


            <div class="score">

                <strong>${score}</strong>

                <small>
                    ${formatDate(match.utcDate)}
                </small>

            </div>


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


/*
    Get selected team
*/

function getSelectedTeam() {

    return localStorage.getItem(
        "selectedPremierLeagueTeam"
    );

}


/*
    Filter out selected team's matches
*/

function getFilteredMatches() {

    const selectedTeam =
        getSelectedTeam();


    if (!selectedTeam) {

        return allMatches;

    }


    const teamId =
        Number(selectedTeam);


    return allMatches.filter(match => {

        return (
            match.homeTeam?.id !== teamId &&
            match.awayTeam?.id !== teamId
        );

    });

}


/*
    Display today's fixtures
*/

function displayTodaysFixtures() {

    const container =
        document.getElementById(
            "todays-fixtures"
        );


    if (!getSelectedTeam()) {

        container.innerHTML =
            '<p class="loading">Select your team above.</p>';

        return;

    }


    const today =
        getTodayString();


    const todaysMatches =
        getFilteredMatches()
            .filter(match => {

                const matchDate =
                    new Date(match.utcDate)
                        .toLocaleDateString(
                            "en-CA",
                            {
                                timeZone: "Europe/Dublin"
                            }
                        );


                return matchDate === today;

            })
            .sort((a, b) => {

                return (
                    new Date(a.utcDate) -
                    new Date(b.utcDate)
                );

            });


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


/*
    Display latest results
*/

function displayLatestResults() {

    const container =
        document.getElementById(
            "latest-results"
        );


    if (!getSelectedTeam()) {

        container.innerHTML =
            '<p class="loading">Select your team above.</p>';

        return;

    }


    const results =
        getFilteredMatches()
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


/*
    Update page
*/

function updatePage() {

    displayTodaysFixtures();

    displayLatestResults();

}


/*
    Team selector changed
*/

teamSelect.addEventListener(
    "change",
    () => {

        const selectedTeam =
            teamSelect.value;


        if (selectedTeam) {

            localStorage.setItem(
                "selectedPremierLeagueTeam",
                selectedTeam
            );

        } else {

            localStorage.removeItem(
                "selectedPremierLeagueTeam"
            );

        }

        updateTeamSelector();
        updateBadgePicker();
        updatePage();

    }
);


/*
    Load Premier League matches
*/

async function loadMatches() {

    try {

        const response =
            await fetch(API_URL);


        if (!response.ok) {

            throw new Error(
                `API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        allMatches =
            data.matches || [];


        /*
            Build the team selector
            from the matches we already have
        */

        buildTeamList();


        updatePage();


    } catch (error) {

        console.error(
            "Failed to load Premier League data:",
            error
        );


        document.getElementById(
            "todays-fixtures"
        ).innerHTML =
            '<p class="loading">Unable to load today\'s fixtures.</p>';


        document.getElementById(
            "latest-results"
        ).innerHTML =
            '<p class="loading">Unable to load results.</p>';

    }

}


/*
    Start
*/

loadMatches();
