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
        this.text = this.#name+'\n'+this.#team+'\n'+this.#score;
    }


    #name = 'loading'
    get name () {
        return this.#name
    }
    set name (name) {
        this.#name = name;
        this.textRefresh();
    }

    #team =""
    get team () {
        return this.#team
    }
    set team (t) {
        this.#team = t
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
     * @param {string} team
     * @param {number} x
     * @param {number} y
     * @param {number} score
     */
    constructor ( game, id, name, team, x, y, score ) {

        // console.log("Agent constructor", id, name, team, x, y, score);
        
        const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
        const material = new THREE.MeshBasicMaterial( { color: 'white', transparent: true, opacity: 1 } );
        const mesh = new THREE.Mesh( geometry, material );

        super( game.gui, mesh, x, y, id+'\n'+score )

        this.#game = game;
        this.id = id;
        this.#name = name;
        this.#team = team;
        this.#score = score;


        // per il colore tutti gli agenti appartenti ad un team hanno stesso colore
        var color;

        //verifico se l'agente appartiene ad un team e che il team sia già stato inserito nella mappa Teams-Colori
        if(team != "" && game.teamsAndColors.has(team) ){     
            color = game.teamsAndColors.get(team)  // se il team è gia presente assegno all'agente il colore del suo team
        }else{                                                                             
            let coloriGiaUsati = Array.from(game.teamsAndColors.values());   // ritorno un array con tutti i colori gia usati per gli altri team    
            console.log("Colori: ", game.teamsAndColors)
            
            do{
                color = new THREE.Color( 0xffffff );        
                color.setHex( Math.random() * 0xffffff );

            }while(coloriGiaUsati.some(usedColor => areColorsSimilar(usedColor, color)))    // ripeto la generazione random del colore finchè non è simile a nessun colore gia usato
            
            // Aggiorno teamsAndColors, gli agenti senza team avranno colori diversi da altri team e agenti singoli
            if(team == ""){ game.teamsAndColors.set(id,color)}
            else{  game.teamsAndColors.set(team,color)}   

        }
        
        this.color = color.getHex();

    }



}


// funzione per confrontare due colore THREE.Color per evitare colori uguali o troppo simili
function areColorsSimilar(color1, color2) {
    //console.log("Colore 1:", color1 + " colore 2: ", color2);
    let tolerance = 0.1
    const deltaR = Math.abs(color1.r - color2.r);
    const deltaG = Math.abs(color1.g - color2.g);
    const deltaB = Math.abs(color1.b - color2.b);
    
    //console.log("Return: ", deltaR <= tolerance && deltaG <= tolerance && deltaB <= tolerance);
    return deltaR <= tolerance && deltaG <= tolerance && deltaB <= tolerance;
    
}

export { Agent };