const API_URL =
    "https://premier-league-api.daronhearty.workers.dev/?endpoint=competitions/PL/standings";


/* =========================================
   LOAD PREMIER LEAGUE TABLE
   ========================================= */

async function loadTable() {

    const tableBody =
        document.getElementById("table-body");


    try {

        const response = await fetch(API_URL);


        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }


        const data = await response.json();


        /*
         * football-data.org returns standings
         * grouped by type.
         *
         * We want the TOTAL league table.
         */

        const totalTable =
            data.standings?.find(
                standing => standing.type === "TOTAL"
            );


        if (!totalTable || !totalTable.table) {

            throw new Error(
                "Premier League table not found."
            );

        }


        tableBody.innerHTML =
            totalTable.table
                .map(createTableRow)
                .join("");


    } catch (error) {

        console.error(
            "Failed to load Premier League table:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="loading">
                    Unable to load the Premier League table.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   CREATE TABLE ROW
   ========================================= */

function createTableRow(team) {

    const position = team.position;

    const teamName =
        team.team?.shortName ||
        team.team?.name ||
        "Unknown";

    const crest =
        team.team?.crest || "";


    return `
        <tr
            class="${
                team.team?.id === 57
                    ? "arsenal-row"
                    : ""
            }"
        >

            <td class="position">
                ${position}
            </td>


            <td class="table-team">

                ${
                    crest
                        ? `<img
                            src="${crest}"
                            alt=""
                            width="28"
                            height="28"
                           >`
                        : ""
                }

                <span>${teamName}</span>

            </td>


            <td>${team.playedGames}</td>

            <td>${team.won}</td>

            <td>${team.draw}</td>

            <td>${team.lost}</td>

            <td>${team.goalsFor}</td>

            <td>${team.goalsAgainst}</td>

            <td>
                ${formatGoalDifference(team.goalDifference)}
            </td>

            <td class="points">
                ${team.points}
            </td>

        </tr>
    `;
}


/* =========================================
   GOAL DIFFERENCE
   ========================================= */

function formatGoalDifference(value) {

    if (value > 0) {
        return `+${value}`;
    }

    return value;
}


/* =========================================
   START
   ========================================= */

loadTable();
