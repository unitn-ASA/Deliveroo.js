import { ref, reactive, computed, watch } from 'vue';
import { jwtDecode } from "jwt-decode";
import { connection } from './myConnection.js';
import { UIAgent } from '@/types/UIAgentType.js';

const grid = connection?.grid;

/**
 * @typedef {{ roundId:number, roundName:string, teams:Map<string,{ teamId:string, teamName:string, rank:number, score:number, pti:number, agents:Map<string,{id:string, name:string, score:number}> }> }} TournamentRound
 */

/**
 * @type { import("vue").Reactive<TournamentRound> }
 */
export const currentRound = reactive({roundId:0, roundName: 'Live', teams: new Map()});

/**
 * @type { import("vue").Reactive< Array<TournamentRound>> }
 */
export const tournament = reactive(new Array());

/**
 * Function to update the tournament state with the new sensing data
 * @param {import('@unitn-asa/deliveroo-js-sdk').IOSensing} sensing 
 * @returns 
 */
function onSensing({positions, agents}) {

        for ( const a of agents ) {

            // create team if it doesn't exist (group by teamName, not teamId)
            const teamName = a.teamName || a.name;
            let team = currentRound.teams.get(teamName);
            if ( ! team ) {
                team = {
                    teamId: a.teamId || a.id,
                    teamName: teamName,
                    score: 0,
                    rank: 0,
                    pti: 0,
                    agents: new Map()
                };
                currentRound.teams.set(teamName, team);
            }

            // create agent if it doesn't exist
            let agent = team.agents.get(a.id);
            if ( ! agent ) {
                agent = { id: a.id, name: a.name, score: 0 };
                team.agents.set(a.id, agent);
            }
            agent.score = a.score;

            // recompute team score
            team.score = 0;
            for ( let a of team.agents.values() ) {
                team.score += a.score;
            }
        }
        // re-compute rank and pti for each team
        // 
        // assign rank 1 to the team with the highest score, 2 to the second, etc.
        // no rank for teams with score 0
        // if two teams have the same score, they get the same rank and the next team gets the rank as if they were ranked in the position of the last team with the same score
        // 
        // assign 10pti to the first team, 9 to the second, etc. if there are more than 10 teams, the rest gets 0;
        // 0 pti for all teams with score 0
        // if two teams have the same score, they get the same points and the next team gets the points as if they were ranked in the position of the last team with the same score
        const teams = Array.from(currentRound.teams.values()).sort((a, b) => b.score - a.score);
        let currentRank = 1;
        let currentPti = 10;
        for (let i = 0; i < teams.length; i++) {
            if (teams[i].score === 0) {
                teams[i].rank = 0;
                teams[i].pti = 0;
            } else if (i > 0 && teams[i].score === teams[i - 1].score) {
                teams[i].rank = teams[i - 1].rank;
                teams[i].pti = teams[i - 1].pti;
            } else {
                teams[i].rank = currentRank;
                teams[i].pti = currentPti;
            }
            currentRank++;
            currentPti = Math.max(currentPti - 1, 0);
        }
};

export function startRound() {
    connection.ioClient.off( "sensing", onSensing );
    connection.ioClient.on( "sensing", onSensing );
}

export function stopRound() {
    connection.ioClient.off( "sensing", onSensing );
}

/**
 * @type { import("vue").ComputedRef<TournamentRound> }
 */
export const overall = computed(() => {
    const result = new Map();
    for (const round of tournament) {
        for (const team of round.teams.values()) {
            if (!result.has(team.teamName)) {
                result.set(team.teamName, {
                    teamId: team.teamId,
                    teamName: team.teamName,
                    score: 0,
                    pti: 0,
                    rank: 0,
                    agents: new Map()
                });
            }
            const overallTeam = result.get(team.teamName);
            overallTeam.score += team.score;
            overallTeam.pti += team.pti;
            // Merge agents from this round into the overall team
            for (const [agentId, agent] of team.agents) {
                const existingAgent = overallTeam.agents.get(agentId);
                if (existingAgent) {
                    existingAgent.score += agent.score;
                } else {
                    overallTeam.agents.set(agentId, { ...agent });
                }
            }
        }
    }
    // Sort and assign ranks
    const sortedTeams = Array.from(result.values()).sort((a, b) => b.score - a.score);
    let currentRank = 1;
    for (let i = 0; i < sortedTeams.length; i++) {
        if (sortedTeams[i].score === 0) {
            sortedTeams[i].rank = 0;
        } else if (i > 0 && sortedTeams[i].score === sortedTeams[i - 1].score) {
            sortedTeams[i].rank = sortedTeams[i - 1].rank;
        } else {
            sortedTeams[i].rank = currentRank;
        }
        currentRank++;
    }
    return { roundId: 0, roundName: 'Overall', teams: result };
});

export function saveRound() {
    const lastRound = tournament[tournament.length - 1];
    const roundId = lastRound?.roundId + 1 || 1;
    tournament.push({
        roundId: roundId,
        roundName: 'Round ' + roundId,
        teams: new Map(Array.from(currentRound.teams.entries()).map(([k, v]) =>
            [k, { ...v, agents: new Map(v.agents) }]
        ))
    });
    localStorage.setItem('myTournament', JSON.stringify(tournament, replacer)); // stringify as array of entries
    currentRound.teams.clear(); // clear current round teams for the next round
}

export function deleteRound ( roundId ) {
    const index = tournament.findIndex(round => round.roundId === roundId);
    if (index !== -1) {
        tournament.splice(index, 1);
        localStorage.setItem('myTournament', JSON.stringify(tournament, replacer)); // stringify as array of entries
    }
}

/**
 * Load from local storage
 */
if ( localStorage.getItem('myTournament') ) {
    for (const retrievedRound of JSON.parse( localStorage.getItem('myTournament'), reviver ) ) { // parse from array of entries
        tournament.push(retrievedRound);        
    }
}


/**
 * How do you JSON.stringify an ES6 Map?
 * https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
 */
function replacer(key, value) {
    if(value instanceof Map) {
        return {
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
}
function reviver(key, value) {
    if(typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
        return new Map(value.value);
        }
    }
    return value;
}