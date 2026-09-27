const MATCHES_API_URL =
"https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/matches";

const TEAMS_API_URL =
"https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/teams";

let allMatches = [];

let allTeams = [];

const teamSelect =
document.getElementById("team-select");

/*
Load the current Premier League teams
*/

async function loadTeams() {

```
try {

    const response =
        await fetch(TEAMS_API_URL);


    if (!response.ok) {

        throw new Error(
            `Teams API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    allTeams =
        data.teams || [];


    populateTeamSelector();


} catch (error) {

    console.error(
        "Failed to load Premier League teams:",
        error
    );


    teamSelect.innerHTML =
        '<option value="">Unable to load teams</option>';

}
```

}

/*
Populate the team selector
*/

function populateTeamSelector() {

```
teamSelect.innerHTML =
    '<option value="">Select your team...</option>';


const sortedTeams =
    [...allTeams].sort((a, b) =>
        a.name.localeCompare(b.name)
    );


sortedTeams.forEach(team => {

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
        allTeams.some(
            team =>
                String(team.id) ===
                String(savedTeam)
        );


    if (teamExists) {

        teamSelect.value =
            savedTeam;

    }

}
```

}

/*
Get today's date in Ireland
*/

function getTodayString() {

```
const now =
    new Date();


return now.toLocaleDateString(
    "en-CA",
    {
        timeZone: "Europe/Dublin"
    }
);
```

}

/*
Format match date/time
*/

function formatDate(dateString) {

```
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
```

}

/*
Create a match card
*/

function createMatchCard(match) {

```
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
```

}

/*
Get the currently selected team
*/

function getSelectedTeam() {

```
return localStorage.getItem(
    "selectedPremierLeagueTeam"
);
```

}

/*
Remove the selected team's matches
*/

function getFilteredMatches() {

```
const selectedTeam =
    getSelectedTeam();


/*
    If no team has been selected,
    show everything.
*/

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
```

}

/*
Display today's fixtures
*/

function displayTodaysFixtures() {

```
const container =
    document.getElementById(
        "todays-fixtures"
    );


const selectedTeam =
    getSelectedTeam();


if (!selectedTeam) {

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
```

}

/*
Display latest results
*/

function displayLatestResults() {

```
const container =
    document.getElementById(
        "latest-results"
    );


const selectedTeam =
    getSelectedTeam();


if (!selectedTeam) {

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
```

}

/*
Update the page
*/

function updatePage() {

```
displayTodaysFixtures();

displayLatestResults();
```

}

/*
Team selector changed
*/

teamSelect.addEventListener(
"change",
() => {

```
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


    updatePage();

}
```

);

/*
Load Premier League matches
*/

async function loadMatches() {

```
try {

    const response =
        await fetch(MATCHES_API_URL);


    if (!response.ok) {

        throw new Error(
            `Matches API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    allMatches =
        data.matches || [];


    updatePage();


} catch (error) {

    console.error(
        "Failed to load Premier League matches:",
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
```

}

/*
Start the page
*/

loadTeams();

loadMatches();
