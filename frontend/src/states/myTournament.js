import { ref, reactive, computed, watch } from 'vue';
import { jwtDecode } from "jwt-decode";
import { connection } from './myConnection.js';

const grid = connection?.grid;

/**
 * @type {import("vue").Reactive<Array<{id:number, status:string, results:Map<string,{id: string, name:string, teamId: string, teamName: string, score:number}>}>>}
 */
export const tournament = reactive(new Array());
// tournament.push({
//     id: 1,
//     status: 'active',
//     results: new Map()
// });
// tournament[0].results.set('idmarco', {name:"marco", score:115});
// tournament[0].results.set('idgiulio', {name:"giulio", score:1983});
// tournament[0].results.set('idpaolo', {name:"paolo", score:36});


/**
 * @type {import("vue").ComputedRef< Array<{ id:number, status:string, results:{teamName:string, agents:*[], score:number}[] }>  >}
 */
export const goupByTeam = computed(() => {
    return tournament.map(round => {
        return {
            id: round.id,
            status: round.status,
            results: Array.from(round.results.values())
                .reduce((acc, agent) => {
                    const existing = acc.find(a => a.teamName === agent.teamName);
                    if (existing) {
                        existing.score += agent.score;
                        existing.agents.push(agent);
                    } else {
                        acc.push({ teamName: agent.teamName || agent.name, agents: [agent], score: agent.score });
                    }
                    return acc;
                }, [])
                .sort((a, b) => b.score - a.score)
        }
    });
});

/**
 * @type {import("vue").ComputedRef<{teamName:string, agents:*[], score:number}[]>}
 */
export const overall = computed(() => {
    const result = new Map();
    for (const round of goupByTeam.value) {
        for (const team of round.results.values()) {
            if (!result.has(team.teamName)) {
                result.set(team.teamName, { teamName: team.teamName, agents: team.agents, score: 0 });
            }
            result.get(team.teamName).score += team.score;
        }
    }
    return Array.from(result.values())
    .sort((a, b) => b.score - a.score);
});

export function saveRound() {
    const current = tournament[tournament.length - 1];
    current.status = 'done';
    const newRound = {
        id: current.id + 1,
        status: 'active',
        results: new Map()
    };
    tournament.push(newRound);
    localStorage.setItem('myTournament', JSON.stringify(tournament, replacer)); // stringify as array of entries
}

export function deleteRound ( roundId ) {
    const index = tournament.findIndex(round => round.id === roundId);
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
        const newRound = {
            id: retrievedRound.id,
            status: retrievedRound.status,
            results: retrievedRound.results
        };
        // for (const [id, agent] of Object.entries(retrievedRound.results)) {
        //     newRound.results.set(id, {
        //         name: agent.name,
        //         score: agent.score
        //     });
        // }
        tournament.push(retrievedRound);        
    }
}
else {
    const newRound = {
        id: 1,
        status: 'active',
        results: new Map()
    };
    tournament.push(newRound);
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