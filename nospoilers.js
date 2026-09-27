const API_URL =
"https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/matches";

/*
Premier League teams

```
The IDs are football-data.org team IDs.
```

*/

const teams = [
{ id: 57, name: "Arsenal" },
{ id: 61, name: "Chelsea" },
{ id: 65, name: "Man City" },
{ id: 66, name: "Man United" },
{ id: 64, name: "Liverpool" },
{ id: 62, name: "Everton" },
{ id: 67, name: "Newcastle" },
{ id: 73, name: "Tottenham" },
{ id: 71, name: "Sunderland" },
{ id: 76, name: "Wolverhampton" },
{ id: 397, name: "Fulham" },
{ id: 63, name: "Leicester City" },
{ id: 338, name: "Brighton" },
{ id: 68, name: "Norwich City" },
{ id: 69, name: "Southampton" },
{ id: 70, name: "Burnley" },
{ id: 351, name: "Crystal Palace" },
{ id: 340, name: "Nottingham Forest" },
{ id: 72, name: "Brentford" },
{ id: 74, name: "Aston Villa" }
];

let allMatches = [];

const teamSelect =
document.getElementById("team-select");

/*
Populate the team selector
*/

function populateTeamSelector() {

```
teams.forEach(team => {

    const option =
        document.createElement("option");

    option.value = team.id;
    option.textContent = team.name;

    teamSelect.appendChild(option);

});
```

}

/*
Get today's date in Ireland
*/

function getTodayString() {

```
const now = new Date();

return now.toLocaleDateString("en-CA", {
    timeZone: "Europe/Dublin"
});
```

}

/*
Format match date/time
*/

function formatDate(dateString) {

```
const date = new Date(dateString);

return date.toLocaleString("en-IE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Dublin"
});
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

const score = isPlayed
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
return localStorage.getItem("selectedPremierLeagueTeam");
```

}

/*
Filter out the selected team's matches
*/

function getFilteredMatches() {

```
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
```

}

/*
Display today's fixtures
*/

function displayTodaysFixtures() {

```
const matches =
    getFilteredMatches();

const today =
    getTodayString();


const todaysMatches =
    matches
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
    document.getElementById(
        "todays-fixtures"
    );


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
const matches =
    getFilteredMatches();


const results =
    matches
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
    document.getElementById(
        "latest-results"
    );


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
Update the page when a team is selected
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
```

}

/*
Start page
*/

populateTeamSelector();

/*
Restore previously selected team
*/

const savedTeam =
getSelectedTeam();

if (savedTeam) {

```
teamSelect.value =
    savedTeam;
```

}

loadMatches();
