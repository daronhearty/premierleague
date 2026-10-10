/*
 * No Spoilers data adapter.
 * All match and goal data comes through the Cloudflare Worker so the
 * Big Balls API key never reaches the browser.
 */
(() => {
    const WORKER = "https://premier-league-api.daronhearty.workers.dev/";
    const matchCache = new Map();
    const goalCache = new Map();

    const TEAMS = [
        { id: 57, name: "Arsenal", crest: "https://crests.football-data.org/57.png", aliases: ["arsenal", "arsenal fc"] },
        { id: 58, name: "Aston Villa", crest: "https://crests.football-data.org/58.png", aliases: ["aston villa", "aston villa fc"] },
        { id: 1044, name: "Bournemouth", crest: "https://crests.football-data.org/1044.png", aliases: ["bournemouth", "afc bournemouth"] },
        { id: 402, name: "Brentford", crest: "https://crests.football-data.org/402.png", aliases: ["brentford", "brentford fc"] },
        { id: 397, name: "Brighton", crest: "https://crests.football-data.org/397.png", aliases: ["brighton", "brighton and hove albion", "brighton & hove albion"] },
        { id: 61, name: "Chelsea", crest: "https://crests.football-data.org/61.png", aliases: ["chelsea", "chelsea fc"] },
        { id: 354, name: "Crystal Palace", crest: "https://crests.football-data.org/354.png", aliases: ["crystal palace", "crystal palace fc"] },
        { id: 62, name: "Everton", crest: "https://crests.football-data.org/62.png", aliases: ["everton", "everton fc"] },
        { id: 63, name: "Fulham", crest: "https://crests.football-data.org/63.png", aliases: ["fulham", "fulham fc"] },
        { id: 341, name: "Leeds United", crest: "https://crests.football-data.org/341.png", aliases: ["leeds", "leeds united", "leeds united fc"] },
        { id: 349, name: "Ipswich Town", crest: "https://api.bigballsdata.com/v1/assets/aA_ZJyJSavLBDZxcDgEJn4pNqwqWXiLR8aVMohPMeiWQUVq32eLLIrC4tqmG_PgpiNd-xJApwKaUaGBdHAlZESC8aJY", aliases: ["ipswich", "ipswich town", "ipswich town fc"] },
        { id: 322, name: "Hull City", crest: "https://api.bigballsdata.com/v1/assets/JnNFfB1nlbrq18pKBXkLj9WHSSgocLwJx__YXlUiLUz_j8k28a4dX4aoWPRhBVyc1vscXn6v0uFJIGFDtgSWEhrqQZ7nxRlYpTRlYmKaqLc", aliases: ["hull", "hull city", "hull city fc"] },
        { id: 1076, name: "Coventry City", crest: "https://api.bigballsdata.com/v1/assets/o32rgc66eOVAOmNYd5z-QEaNlmlvNYqOIlWFHwTilkJSyFc14TCHbmXgq3MV2VQFhJFSe7LQy78Hiv3nKD9ZUcOInqP8", aliases: ["coventry", "coventry city", "coventry city fc"] },
        { id: 64, name: "Liverpool", crest: "https://crests.football-data.org/64.png", aliases: ["liverpool", "liverpool fc"] },
        { id: 65, name: "Manchester City", crest: "https://crests.football-data.org/65.png", aliases: ["manchester city", "man city", "manchester city fc"] },
        { id: 66, name: "Manchester United", crest: "https://crests.football-data.org/66.png", aliases: ["manchester united", "man united", "man utd", "manchester united fc"] },
        { id: 67, name: "Newcastle United", crest: "https://crests.football-data.org/67.png", aliases: ["newcastle", "newcastle united", "newcastle united fc"] },
        { id: 351, name: "Nottingham Forest", crest: "https://crests.football-data.org/351.png", aliases: ["nottingham forest", "forest", "nottingham forest fc"] },
        { id: 71, name: "Sunderland", crest: "https://crests.football-data.org/71.png", aliases: ["sunderland", "sunderland afc"] },
        { id: 73, name: "Tottenham Hotspur", crest: "https://crests.football-data.org/73.png", aliases: ["tottenham", "tottenham hotspur", "spurs"] }
    ];

    function cleanName(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/\b(fc|afc)\b/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function getTeam(value) {
        const name = typeof value === "string" ? value : value?.name || value?.short_name || value?.shortName || "";
        const cleaned = cleanName(name);
        const team = TEAMS.find(item => item.aliases.some(alias => cleanName(alias) === cleaned));
        if (team) {
            return {
                id: team.id,
                name: team.name,
                shortName: typeof value === "object" && value?.short_name ? value.short_name : team.name,
                crest: (typeof value === "object" && (value?.logo_url || value?.crest)) || team.crest
            };
        }
        return {
            id: typeof value === "object" ? value?.id ?? null : null,
            name: name || "Unknown",
            shortName: typeof value === "object" ? value?.short_name || name || "Unknown" : name || "Unknown",
            crest: typeof value === "object" ? value?.logo_url || value?.crest || "" : ""
        };
    }

    function getScore(raw, side) {
        const score = raw?.score;
        const value = score?.[side] ?? score?.value?.[side] ?? score?.fullTime?.[side] ?? raw?.scores?.value?.[side] ?? raw?.scores?.[side];
        return value === "" || value === undefined ? null : value;
    }

    function normalizeStatus(value) {
        const status = String(value || "").toLowerCase();
        if (["live", "in_play", "inplay", "in progress", "1h", "2h", "ht", "paused"].includes(status)) {
            return status === "paused" || status === "ht" ? "PAUSED" : "IN_PLAY";
        }
        if (["finished", "final", "ft", "complete", "completed"].includes(status)) return "FINISHED";
        if (["postponed"].includes(status)) return "POSTPONED";
        if (["cancelled", "canceled"].includes(status)) return "CANCELLED";
        return "SCHEDULED";
    }

    function normalizeMatch(raw) {
        const homeRaw = raw?.homeTeam || raw?.home;
        const awayRaw = raw?.awayTeam || raw?.away;
        const homeTeam = getTeam(homeRaw);
        const awayTeam = getTeam(awayRaw);
        const kickoff = raw?.utcDate || raw?.kickoff_utc || raw?.kickoff || raw?.date;
        const homeScore = getScore(raw, "home");
        const awayScore = getScore(raw, "away");
        const status = normalizeStatus(raw?.status);
        const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;
        return {
            id: raw?.id,
            bigBallsId: raw?.id,
            utcDate: kickoff,
            status,
            homeTeam,
            awayTeam,
            score: { fullTime: { home: hasScore ? Number(homeScore) : null, away: hasScore ? Number(awayScore) : null } },
            goals: null
        };
    }

    async function request(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API error: " + response.status);
        const json = await response.json();
        if (json?.error && json.error.code) throw new Error(json.error.message || json.error.code);
        return json;
    }

    async function loadMatches(options = {}) {
        const forceRefresh = options === true || options?.forceRefresh === true;
        const cacheKey = "bigballs-all-statuses";
        if (forceRefresh) {
            matchCache.clear();
            goalCache.clear();
        }
        if (matchCache.has(cacheKey)) return matchCache.get(cacheKey);

        const promise = (async () => {
            // Request each status explicitly so live, completed and upcoming
            // fixtures are all available to the different homepage sections.
            const statuses = ["live", "finished", "scheduled"];
            const responses = await Promise.all(statuses.map(status =>
                request(WORKER + "?endpoint=bigballs-test&limit=100&status=" + encodeURIComponent(status))
                    .catch(error => {
                        // Some API deployments may not support a status value;
                        // retain successful status feeds rather than failing all pages.
                        console.warn("Big Balls status feed unavailable:", status, error);
                        return null;
                    })
            ));

            const byId = new Map();
            for (const json of responses) {
                const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json?.matches) ? json.matches : [];
                for (const raw of rows) {
                    const match = normalizeMatch(raw);
                    if (match.id && match.utcDate && match.homeTeam.name !== "Unknown" && match.awayTeam.name !== "Unknown") {
                        byId.set(String(match.id), match);
                    }
                }
            }

            return Array.from(byId.values()).sort((a, b) =>
                new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
            );
        })();

        matchCache.set(cacheKey, promise);
        try { return await promise; } catch (error) { matchCache.delete(cacheKey); throw error; }
    }

    function fixMojibake(value) {
        if (!value || !String(value).includes("Ã")) return value || "";
        try { return decodeURIComponent(escape(value)); } catch { return value; }
    }

    async function loadGoals(matchId, match) {
        if (!matchId) return [];
        if (goalCache.has(matchId)) return goalCache.get(matchId);
        const promise = request(WORKER + "?endpoint=bigballs-events&match_id=" + encodeURIComponent(matchId))
            .then(json => {
                const events = Array.isArray(json?.data) ? json.data : [];
                return events.filter(event => String(event?.event_type || "").toLowerCase() === "goal")
                    .map(event => {
                        const team = getTeam(event.team);
                        const elapsed = Number(event.elapsed ?? event.minute ?? 0);
                        const extra = event.elapsed_extra === null || event.elapsed_extra === undefined ? null : Number(event.elapsed_extra);
                        const detail = String(event.event_detail || "").toLowerCase();
                        return {
                            minute: elapsed,
                            injuryTime: extra,
                            scorer: { name: fixMojibake(event.player_name) || "Unknown scorer" },
                            assist: fixMojibake(event.assist_name || ""),
                            team,
                            type: detail.includes("own goal") ? "OWN_GOAL" : detail.includes("penalty") ? "PENALTY" : "REGULAR",
                            eventDetail: event.event_detail || ""
                        };
                    })
                    .sort((a, b) => (a.minute + (a.injuryTime || 0) / 100) - (b.minute + (b.injuryTime || 0) / 100));
            });
        goalCache.set(matchId, promise);
        try {
            const goals = await promise;
            if (match) match.goals = goals;
            return goals;
        } catch (error) {
            goalCache.delete(matchId);
            throw error;
        }
    }

    window.NoSpoilersAPI = { teams: TEAMS, loadMatches, loadGoals, normalizeMatch, getTeam };
})();
