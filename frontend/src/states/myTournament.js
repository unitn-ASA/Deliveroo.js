import { ref, reactive, computed, watch } from 'vue';
import { jwtDecode } from "jwt-decode";
import { connection } from './myConnection.js';

const grid = connection?.grid;

/**
 * @type {import("vue").Reactive<Array<{id:number, status:string, results:Map<string,{name:string, score:number}>}>>}
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

export const overall = computed(() => {
    const result = new Map();
    for (const round of tournament) {
        for (const [id, agent] of round.results.entries()) {
            if (!result.has(id)) {
                result.set(id, { name: agent.name, score: 0 });
            }
            result.get(id).score += agent.score;
        }
    }
    return Array.from(result.values()).sort((a, b) => b.score - a.score);
});

export function saveRound() {
    const current = tournament[tournament.length - 1];
    current.status = 'done';
    const newRound = {
        id: tournament.length + 1,
        status: 'active',
        results: new Map()
    };
    tournament.push(newRound);
    localStorage.setItem('myTournament', JSON.stringify(tournament, replacer)); // stringify as array of entries
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