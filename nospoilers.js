let allMatches = [];

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


    /*
        Use the full Premier League badge list for the selector,
        so every current team is available even if they have not
        appeared in the API response yet.
    */
    const apiTeams = Array.from(teams.values());

    allTeams = TEAM_BADGES.map(badge => {
        const apiTeam = apiTeams.find(
            team => String(team.id) === String(badge.id)
        );

        return apiTeam || {
            id: badge.id,
            name: badge.name,
            shortName: badge.name,
            crest: badge.crest
        };
    }).sort((a, b) => {

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
    Goal timeline helpers
*/

function formatGoalMinute(goal) {
    const minute = goal?.minute;
    if (minute === null || minute === undefined) return "";
    const injuryTime = goal?.injuryTime;
    return injuryTime ? minute + "+" + injuryTime + "'" : minute + "'";
}

function getScorerName(goal) {
    return goal?.scorer?.name || goal?.scorer?.shortName || goal?.player?.name || "Unknown scorer";
}

function getMatchGoals(match) {
    if (!Array.isArray(match.goals)) return null;
    return [...match.goals].sort((a, b) =>
        (Number(a.minute || 0) + Number(a.injuryTime || 0) / 100) -
        (Number(b.minute || 0) + Number(b.injuryTime || 0) / 100)
    );
}

function createGoalTimeline(match) {
    const goals = getMatchGoals(match);
    if (goals === null) return '<div class="match-no-goals"><span>Tap to load goal details.</span></div>';
    if (goals.length === 0) {
        const message = match.status === "FINISHED" ? "No goals were recorded for this match." : "No goals have been scored yet.";
        return '<div class="match-no-goals"><span>' + message + '</span></div>';
    }
    return '<div class="goal-timeline" aria-label="Goal timeline">' + goals.map(goal => {
        const scorer = getScorerName(goal);
        const minute = formatGoalMinute(goal);
        const isHomeGoal = goal?.team?.id === match.homeTeam?.id;
        const goalType = goal?.type === "OWN_GOAL" ? "Own goal" : goal?.type === "PENALTY" ? "Penalty" : "";
        return '<div class="goal-event ' + (isHomeGoal ? "home-goal" : "away-goal") + '"><div class="goal-event-content"><span class="goal-minute">' + minute + '</span><span class="goal-icon" aria-hidden="true">⚽</span><span class="goal-scorer">' + scorer + '</span>' +
            (goal.assist ? '<span class="goal-assist">Assist: ' + goal.assist + '</span>' : '') +
            (goalType ? '<span class="goal-type">' + goalType + '</span>' : '') + '</div></div>';
    }).join("") + '</div>';
}

/*
    Create a match card
*/

function createMatchCard(match) {
    const homeTeam = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
    const awayTeam = match.awayTeam?.shortName || match.awayTeam?.name || "Away";
    const homeCrest = match.homeTeam?.crest || "";
    const awayCrest = match.awayTeam?.crest || "";
    const homeScore = match.score?.fullTime?.home;
    const awayScore = match.score?.fullTime?.away;
    const isPlayed = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;
    const isLive = ["LIVE", "IN_PLAY", "PAUSED"].includes(match.status);
    const isExpandable = isPlayed || isLive;
    const score = isPlayed ? homeScore + " - " + awayScore : "vs";

    return '<div class="match-wrapper' + (isExpandable ? " match-wrapper-expandable" : "") + '">' +
        '<div class="match' + (isExpandable ? " match-expandable" : "") + '"' +
        (isExpandable ? ' data-match-id="' + match.id + '" tabindex="0" role="button" aria-expanded="false" aria-label="Show goals for ' + homeTeam + ' versus ' + awayTeam + '"' : "") + '>' +
        '<div class="team home">' +
        (homeCrest ? '<img src="' + homeCrest + '" alt="" width="28" height="28">' : "") +
        '<span>' + homeTeam + '</span></div>' +
        '<div class="score"><strong>' + score + '</strong><small>' + formatDate(match.utcDate) + '</small></div>' +
        '<div class="team away">' +
        (awayCrest ? '<img src="' + awayCrest + '" alt="" width="28" height="28">' : "") +
        '<span>' + awayTeam + '</span></div></div>' +
        (isExpandable ? '<div class="match-details" aria-hidden="true"><div class="match-details-inner">' + createGoalTimeline(match) + '</div></div>' : "") +
        '</div>';
}

/*
    Match card interaction
*/

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
    const matchElement = event.target.closest(".match-expandable");
    if (matchElement) toggleMatch(matchElement);
});

document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const matchElement = event.target.closest(".match-expandable");
    if (!matchElement) return;
    event.preventDefault();
    toggleMatch(matchElement);
});

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

async function loadMatches(forceRefresh = false) {

    try {

        allMatches = await NoSpoilersAPI.loadMatches({ forceRefresh });


        /*
            Build the team selector
            from the matches we already have
        */

        buildTeamList();


        updatePage();
        return true;

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
        return false;

    }

}


/*
    Start
*/

const refreshButton = document.getElementById("refresh-data");
const refreshStatus = document.getElementById("refresh-status");

if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
        if (refreshButton.disabled) return;
        refreshButton.disabled = true;
        refreshButton.classList.add("is-refreshing");
        refreshButton.innerHTML = '<span aria-hidden="true">↻</span> Refreshing…';
        if (refreshStatus) refreshStatus.textContent = "Fetching the latest match data…";
        try {
            const refreshed = await loadMatches(true);
            if (refreshStatus) refreshStatus.textContent = refreshed ? "Data refreshed just now." : "Refresh failed. Please try again shortly.";
        } catch (error) {
            if (refreshStatus) refreshStatus.textContent = "Refresh failed. Please try again shortly.";
        } finally {
            refreshButton.disabled = false;
            refreshButton.classList.remove("is-refreshing");
            refreshButton.innerHTML = '<span aria-hidden="true">↻</span> Refresh data';
        }
    });
}

loadMatches();
