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

    function normalizeGoalEvent(event) {
        const team = getTeam(event?.team || event?.team_name || event?.teamName);
        const rawMinute = event?.elapsed ?? event?.minute;
        const minute = rawMinute === null || rawMinute === undefined || rawMinute === "" ? null : Number(rawMinute);
        const rawExtra = event?.elapsed_extra;
        const injuryTime = rawExtra === null || rawExtra === undefined || rawExtra === "" ? null : Number(rawExtra);
        const detail = String(event?.event_detail || "").toLowerCase();
        const scorerName = fixMojibake(event?.player_name || event?.player?.name || event?.scorer_name || "");
        return {
            eventId: event?.id ?? event?.event_id ?? event?.incident_id ?? null,
            period: event?.period ?? event?.period_name ?? null,
            minute: Number.isFinite(minute) ? minute : null,
            injuryTime: Number.isFinite(injuryTime) ? injuryTime : null,
            scorer: { name: scorerName || "Unknown scorer" },
            assist: fixMojibake(event?.assist_name || event?.assist?.name || ""),
            team,
            type: detail.includes("own goal") ? "OWN_GOAL" : detail.includes("penalty") ? "PENALTY" : "REGULAR",
            eventDetail: event?.event_detail || ""
        };
    }

    function goalSortValue(goal) {
        return (Number(goal.minute ?? -1) * 100) + Number(goal.injuryTime ?? 0);
    }

    function normalizedText(value) {
        return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    }

    function exactGoalSignature(goal) {
        return [
            goal.minute ?? "unknown-minute",
            goal.injuryTime ?? "",
            goal.period ?? "",
            goal.team?.id ?? goal.team?.name ?? "",
            normalizedText(goal.scorer?.name),
            goal.type,
            normalizedText(goal.eventDetail),
            normalizedText(goal.assist)
        ].join("|");
    }

    function deduplicateGoals(goals) {
        const seenIds = new Set();
        const seenSignatures = new Set();
        return goals.filter(goal => {
            // Provider event IDs are the strongest duplicate signal.
            if (goal.eventId !== null && goal.eventId !== undefined) {
                const id = String(goal.eventId);
                if (seenIds.has(id)) return false;
                seenIds.add(id);
            }

            // Exact duplicate payloads are safe to collapse. Minute alone is
            // never sufficient: separate goals can happen in the same minute.
            const signature = exactGoalSignature(goal);
            if (seenSignatures.has(signature)) return false;
            seenSignatures.add(signature);
            return true;
        });
    }

    function goalCompleteness(goal) {
        return Number(goal.eventId !== null && goal.eventId !== undefined) * 8 +
            Number(goal.scorer?.name && goal.scorer.name !== "Unknown scorer") * 4 +
            Number(Boolean(goal.assist)) * 2 +
            Number(Boolean(goal.period)) +
            Number(Boolean(goal.eventDetail));
    }

    function likelySameGoal(a, b) {
        if (a === b) return false;
        if (a.team?.id == null || b.team?.id == null ||
            String(a.team.id) !== String(b.team.id)) return false;

        // Do not merge different named scorers or different goal types.
        const aScorer = normalizedText(a.scorer?.name);
        const bScorer = normalizedText(b.scorer?.name);
        if (!aScorer || aScorer === "unknown scorer" || aScorer !== bScorer) return false;
        if (a.type !== b.type) return false;

        // Only consider events very close in match time, including injury time.
        if (Math.abs(goalSortValue(a) - goalSortValue(b)) > 2) return false;

        // Assist data strengthens the match, but missing assist data on one
        // record should not prevent identifying a likely duplicate.
        const aAssist = normalizedText(a.assist);
        const bAssist = normalizedText(b.assist);
        if (aAssist && bAssist && aAssist !== bAssist) return false;
        return true;
    }

    function resolveLikelyDuplicatesAgainstScore(goals, match) {
        if (match?.status !== "FINISHED") return goals;
        const homeScore = Number(match.score?.fullTime?.home);
        const awayScore = Number(match.score?.fullTime?.away);
        if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) return goals;

        const expectedByTeam = new Map([
            [String(match.homeTeam?.id), homeScore],
            [String(match.awayTeam?.id), awayScore]
        ]);
        let resolved = [...goals];

        for (const [teamId, expected] of expectedByTeam) {
            let teamGoals = resolved.filter(goal => String(goal.team?.id) === teamId);
            let excess = teamGoals.length - expected;
            if (excess <= 0) continue;

            // Only remove a record when there is a strong pair match and the
            // team has more goal events than the official score. Never remove
            // a goal merely to force the score to agree.
            const candidates = [];
            for (let i = 0; i < teamGoals.length; i++) {
                for (let j = i + 1; j < teamGoals.length; j++) {
                    const a = teamGoals[i], b = teamGoals[j];
                    if (!likelySameGoal(a, b)) continue;
                    const assistMatch = normalizedText(a.assist) &&
                        normalizedText(a.assist) === normalizedText(b.assist);
                    candidates.push({
                        a, b,
                        confidence: (assistMatch ? 3 : 0) +
                            (a.eventId != null && b.eventId != null ? 1 : 0),
                        difference: Math.abs(goalSortValue(a) - goalSortValue(b))
                    });
                }
            }

            candidates.sort((a, b) =>
                b.confidence - a.confidence ||
                a.difference - b.difference
            );

            const removed = new Set();
            for (const candidate of candidates) {
                if (excess <= 0) break;
                if (removed.has(candidate.a) || removed.has(candidate.b)) continue;

                // Keep the richer record. If equally complete, keep the earlier
                // timestamp as the canonical event rather than inventing time.
                const scoreA = goalCompleteness(candidate.a);
                const scoreB = goalCompleteness(candidate.b);
                const discard = scoreA === scoreB
                    ? (goalSortValue(candidate.a) <= goalSortValue(candidate.b) ? candidate.b : candidate.a)
                    : (scoreA > scoreB ? candidate.b : candidate.a);
                removed.add(discard);
                excess--;
            }

            if (removed.size) {
                resolved = resolved.filter(goal => !removed.has(goal));
                console.warn("Likely duplicate goal events removed after score check", {
                    matchId: match.id,
                    teamId,
                    removedCount: removed.size
                });
            }
        }
        return resolved;
    }

    async function loadGoals(matchId, match) {
        if (!matchId) return [];
        const cacheKey = String(matchId);
        if (goalCache.has(cacheKey)) return goalCache.get(cacheKey);
        const promise = request(WORKER + "?endpoint=bigballs-events&match_id=" + encodeURIComponent(matchId))
            .then(json => {
                const events = Array.isArray(json?.data) ? json.data : [];
                let goals = events
                    .filter(event => String(event?.event_type || "").trim().toLowerCase() === "goal")
                    .map(normalizeGoalEvent)
                    .filter(goal => goal.minute !== null);
                if (match?.homeTeam?.name && match?.awayTeam?.name) {
                    // Provider team IDs are not necessarily in the same ID space
                    // as the fixture feed. An unrelated provider ID can numerically
                    // collide with a local team ID, so validate the team name too.
                    // If the event's team cannot be identified, omit it rather than
                    // risk showing another fixture's goals in this timeline.
                    const fixtureTeamNames = new Set([
                        cleanName(match.homeTeam.name),
                        cleanName(match.awayTeam.name)
                    ]);
                    goals = goals.filter(goal => {
                        const eventTeamName = cleanName(goal.team?.name);
                        return eventTeamName !== "" &&
                            eventTeamName !== "unknown" &&
                            fixtureTeamNames.has(eventTeamName);
                    });
                }
                goals = deduplicateGoals(goals);
                goals = resolveLikelyDuplicatesAgainstScore(goals, match)
                    .sort((a, b) => goalSortValue(b) - goalSortValue(a));
                // Preserve events even when they disagree with the score; log the
                // discrepancy instead of hiding a potentially legitimate goal.
                if (match?.status === "FINISHED") {
                    const homeScore = Number(match.score?.fullTime?.home);
                    const awayScore = Number(match.score?.fullTime?.away);
                    if (Number.isFinite(homeScore) && Number.isFinite(awayScore)) {
                        const homeGoals = goals.filter(goal => String(goal.team?.id) === String(match.homeTeam?.id)).length;
                        const awayGoals = goals.filter(goal => String(goal.team?.id) === String(match.awayTeam?.id)).length;
                        if (homeGoals !== homeScore || awayGoals !== awayScore) {
                            console.warn("Goal event/score mismatch", {
                                matchId: cacheKey,
                                fixture: match.homeTeam?.name + " vs " + match.awayTeam?.name,
                                score: { home: homeScore, away: awayScore },
                                eventCounts: { home: homeGoals, away: awayGoals }, goals
                            });
                        }
                    }
                }
                return goals;
            });
        goalCache.set(cacheKey, promise);
        try {
            const goals = await promise;
            if (match) match.goals = goals;
            return goals;
        } catch (error) {
            goalCache.delete(cacheKey);
            throw error;
        }
    }

    window.NoSpoilersAPI = { teams: TEAMS, loadMatches, loadGoals, normalizeMatch, getTeam };
})();
