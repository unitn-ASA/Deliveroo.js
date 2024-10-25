import { onGrid } from './onGrid.js'
import * as THREE from 'three';
import { Game } from './Game.js';


/**
 * Agent class
 */
class Agent extends onGrid {

    /** @type {Game} game */
    #game;

    /** @type {string} agent id */
    id;

    /** @type {Map<string,Parcel>} Map id to parcel */
    carrying = new Map();

    textRefresh () {
        if(this.#teamName == 'no-team'){
            this.text = this.#name+'\n'+this.#score; 
            return 
        }
        this.text = this.#name+'\n'+this.#teamName+'\n'+this.#score;
    }


    #name = 'loading'
    get name () {
        return this.#name
    }
    set name (name) {
        this.#name = name;
        this.textRefresh();
    }

    #teamName ="no-team"
    get teamName () {
        return this.#teamName
    }
    set teamName (t) {
        this.#teamName = t
        this.textRefresh();
    }

    #teamId 
    get teamId () {
        return this.#teamId
    }
    set teamId (t) {
        this.#teamId = t
        this.textRefresh();
    }

    #score = 0
    get score () {
        return this.#score
    }
    set score (score) {
        this.#score = score;
        this.textRefresh();
    }

    /**
     * Agent constructor
     * @param {Game} game
     * @param {number} id
     * @param {string} name
     * @param {string} teamId
     * @param {string} teamName
     * @param {number} x
     * @param {number} y
     * @param {number} score
     */
    constructor ( game, id, name, teamId, teamName, x, y, score ) {

        console.log("AGENT: Agent constructor", id, name, teamId, teamName, x, y, score);
        
        const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
        const material = new THREE.MeshBasicMaterial( { color: 'white', transparent: true, opacity: 1 } );
        const mesh = new THREE.Mesh( geometry, material );

        super( game.gui, mesh, x, y, id+'\n'+score )

        this.#game = game;
        this.id = id;
        this.#name = name;
        this.#teamName= teamName;
        this.#teamId = teamId;
        this.#score = score;


        // per il colore tutti gli agenti appartenti ad un team hanno stesso colore
        var color;

        //check if the agent is in the team and if the team has already a color associeted
        if(this.#game.teamsAndColors.has(teamId) ){ color = this.#game.teamsAndColors.get(teamId) }
        else {
            this.#game.newColor(teamId);
            color = this.#game.teamsAndColors.get(teamId)                                                                       
        }
        
        this.color = color.getHex();

    }



}



export { Agent };