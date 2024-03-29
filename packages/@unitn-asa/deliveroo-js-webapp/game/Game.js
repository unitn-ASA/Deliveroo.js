import { Agent } from './Agent.js';
import { Parcel } from './Parcel.js';
import { Gui } from './Gui.js';
import { Client } from './Client.js';
import { Controller } from './Controller.js';
import { Leaderboard } from './Leaderboard.js';
import { Tile } from './Tile.js';

import * as THREE from 'three';

class Game {
    
    /** @type {Client} */
    client;

    /** @type {Gui} */
    gui;

    /** @type {Controller} */
    ìcontroller;
    
    /** @type {Agent} */
    me;

    /** @type {Map<string,THREE.Color>} team to color */
    teamsAndColors = new Map();

    /** @type {Map<string,Agent>} id to agent */
    agents = new Map();

    /**
     * @param {string} id 
     * @param {string} name 
     * @param {string} team
     * @param {number} x 
     * @param {number} y 
     * @param {number} score 
     * @returns {Agent}
     */
    getOrCreateAgent ( id, name='unknown', teamId, teamName, x=-1, y=-1, score=-1 ) {
        var agent = this.agents.get(id);
        if ( !agent ) {
            
            agent = new Agent( this, id, name, teamId, teamName, x, y, score );
            this.gui.clickables.push( agent.mesh );

            this.agents.set( id, agent );
            console.log('new agent added: ', agent.id, agent.name)
        }
        return agent;
    }

    /** @type {Map<string,Parcel>} parcels by id */
    parcels = new Map();

    getOrCreateParcel ( id, x=-1, y=-1, carriedBy=null, reward=-1 ) {
        var parcel = this.parcels.get(id);
        if ( !parcel ) {
            parcel = new Parcel( this, id, x, y, carriedBy, reward );
            this.parcels.set( id, parcel );
        }
        return parcel;
    }

    deleteParcel ( id ) {
        this.getOrCreateParcel( id ).removeMesh();
        this.parcels.delete( id );
    }

    /** @type {Map<Number,Tile>} Tile by id (=x+1000*y) */
    tiles = new Map();

    setTile(x, y, delivery) {
        if ( !this.tiles.has(x + y*1000) )
            this.tiles.set( x + y*1000, new Tile(this.gui, x, y, delivery) );
        return this.tiles.get( x + y*1000 );
    }

    getTile(x, y) {
        if ( !this.tiles.has(x + y*1000) )
            this.tiles.set( x + y*1000, new Tile(this.gui, x, y) );
        return this.tiles.get( x + y*1000 );
    }

    /** @type {Leaderboard} leaderboard */
    leaderboard;
    

    /**
     * 
     * @param {{token: string, name: string, match: string, team: string}} options
     */
    constructor ( options ) {

        
        (async () => {
            console.log('Game options:', options)

            // Creation of all the object in asincronus way 
            const clientPromise = new Promise((resolve, reject) => {
                this.client = new Client(this, options);
                resolve();
            });
            await clientPromise

            const controllerPromise = new Promise((resolve, reject) => {
                this.controller = new Controller(this.client);
                resolve();
            });
            await controllerPromise

            const leaderboardPromise = new Promise((resolve, reject) => {
                this.leaderboard = new Leaderboard(this, options.roomId);
                resolve();
            });
            await leaderboardPromise

            const guiPromise = new Promise((resolve, reject) => {
                this.gui = new Gui();
                resolve();
            });
            await guiPromise
           
    
            // menage the chat 
            document.getElementById('panel').style.display = 'block'; // Show the lateral panel
    
            document.getElementById('chatTitle').addEventListener('click', () => { //Sistem to open and close the chat
                const chatElement = document.getElementById('chat');
                if (chatElement.classList.contains('closed')) {
                    chatElement.classList.remove('closed');
                } else {
                    chatElement.classList.add('closed');
                }
            });
        })();
      
    }

    newColor(id){
        let coloriGiaUsati = Array.from(this.teamsAndColors.values());   // get an array with all the already used colors    
        //console.log("Colori: ", this.teamsAndColors)
        
        let color;
        do{
            color = new THREE.Color( 0xffffff );        
            color.setHex( Math.random() * 0xffffff );

        }while(coloriGiaUsati.some(usedColor => areColorsSimilar(usedColor, color)))    // repaet the color generation until it is not similar with other already used colors 
        
        // update teamsAndColors adding tha net record
        this.teamsAndColors.set(id,color); 
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

export { Game };