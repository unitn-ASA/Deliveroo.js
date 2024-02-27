import { default as io, Socket } from 'socket.io-client';
import { Agent } from './Agent.js';
import { Parcel } from './Parcel.js';
import { Tile } from './Tile.js';
import { Game } from './Game.js';



var WIDTH;
var HEIGHT;

var AGENTS_OBSERVATION_DISTANCE = 5;
var PARCELS_OBSERVATION_DISTANCE = 5;
var CONFIG;

var HOST = import.meta.env.VITE_SOCKET_IO_HOST || 'http://localhost:8080';



class Client {

    /**
     * @type {Game} game
     */
    game;

    /**
     * @type {Socket<DefaultEventsMap, DefaultEventsMap>} socket
     */
    socket;



    /**
     * Socket constructor
     * @param {Game,{token: string, name: string, match: string}} options
     */
    constructor ( game, { token, name, match } ) {

        this.game = game;
        
        console.log( "connecting to", HOST+'/'+match, "with token:", token.slice(-30), match );

        this.socket = io( HOST+'/'+match, {
            withCredentials: true,
            extraHeaders: {
                'x-token': token
            }
            // query: {
            //     name: name,
            // }
            // path: '/'
        } );

        this.socket.on( "connect", () => {
            console.log( "connect", this.socket.id, token ); 
            document.getElementById('socket.id').textContent = `socket.id ${this.socket.id}`
        } );

        this.socket.on( "disconnect", (reason) => {
            if (reason === "io server disconnect") {
                // the disconnection was initiated by the server, you need to reconnect manually
                alert( `Token is invalid!` );
                this.socket.connect();
            }
            console.error( `Socket.io connection error` );
        } );

        this.socket.on("connect_error", (reason) => {
            console.error( `connect_error`, reason );
            // alert( `Reconnecting, press ok to continue.` );
        } );

        /*socket.on( "token", (token) => {
            prompt( `Welcome, ${name}, here is your new token. Use it to connect to your new agent.`, token );
            setCookie( 'token_'+name, token, 365 );
            // navigator.clipboard.writeText(token);
        }); */

        this.socket.on( 'log', ( {src, timestamp, socket, id, name}, ...message ) => {
            if ( src == 'server' )
                console.log( 'server', timestamp, '\t', ...message )
            else
                console.log( 'client', timestamp, socket, id, name, '\t', ...message );
        } );

        this.socket.on( 'draw', ( {src, timestamp, socket, id, name}, buffer ) => {
            // console.log( 'draw', {src, timestamp, socket, id, name}, buffer )
        
            // let uint8Array = new Uint8Array(buffer);
            // let binaryString = String.fromCharCode.apply(null, uint8Array);
            // let base64Image = btoa(binaryString);
            // let imgSrc = 'data:image/png;base64,' + base64Image;
            // document.getElementById('canvas').src = imgSrc;
        
            document.getElementById('canvas').src = buffer;
            
        } );
        
        this.socket.on( 'not_tile', (x, y) => {
            this.game.getTile(x, y).blocked = true;
        });

        this.socket.on( "tile", (x, y, delivery, parcelSpawner) => {
            this.game.getTile(x, y).delivery = delivery;
            this.game.getTile(x, y).blocked = false;
            this.game.getTile(x, y).parcelSpawner = parcelSpawner;
        });

        this.socket.on( "map", (width, height, tiles) => {
            WIDTH = width
            HEIGHT = height
        });

        this.socket.on( "msg", ( id, name, msg, reply ) => {
            console.log( 'msg', {id, name, msg, reply} )
            processMsg( id, name, msg )
            if ( msg == 'who are you?' && reply ) reply('I am the web app')
        })

        this.socket.on( "path", (path) => {
            for (const tile of this.game.tiles.values()) {
                tile.pathPoint.hide();
            }
            for (const {x, y} of path) {
                getTile(x, y).pathPoint.show();
            }
        });

        this.socket.on( "config", ( config ) => {
            document.getElementById('config').textContent = JSON.stringify( config, undefined, 2 );
            AGENTS_OBSERVATION_DISTANCE = config.AGENTS_OBSERVATION_DISTANCE;
            PARCELS_OBSERVATION_DISTANCE = config.PARCELS_OBSERVATION_DISTANCE;
            CONFIG = config;
        } )

        this.socket.on( "you", ( {idme, nameme, teamme, xme, yme, scoreme} ) => {

            let id = idme; let name = nameme; var team = teamme; let x = xme; let y = yme; let score = scoreme;
            console.log( "you", {id, name, team, x, y, score} )

            document.getElementById('agent.id').textContent = `agent.id ${id}`;
            document.getElementById('agent.name').textContent = `agent.name ${name}`;
            document.getElementById('agent.xy').textContent = `agent.xy ${x},${y}`;
            document.getElementById('agent.team').textContent = `agent.team ${team}`;
            
            /* per l'info agent.team controllo che team non sia "" ( quindi l'agente non è in nessun team )
            let varTeam = document.getElementById('agent.team');
            if(varTeam) {
                if(team == "") {
                    document.getElementById('info').removeChild(varTeam); // Se team è "" rimuovo l'info agent.team
                } else {
                    varTeam.textContent = `agent.team ${team}`;
                }
            } else {
                console.error("Elemento 'varTeam' non trovato.");
            }*/

            this.game.me = this.game.getOrCreateAgent( id, name, team, x, y, score );
            this.game.gui.setTarget( this.game.me.mesh );

            /**
             * Auto-follow camera
             */
            // camera.position.x += ( x - me.x ) * 1.5;
            // camera.position.z -= ( y - me.y ) * 1.5;
            // controls.target.set(x*1.5, 0, -y*1.5);
            // controls.update();
            
            // Me
            this.game.me.x = x
            this.game.me.y = y
            this.game.me.score = score

            // when arrived
            if ( x % 1 == 0 && y % 1 == 0 ) {
                for ( var tile of this.game.tiles.values() ) {
                    var distance = Math.abs(x-tile.x) + Math.abs(y-tile.y);
                    let opacity = 0.1;
                    if ( !( distance >= PARCELS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
                    if ( !( distance >= AGENTS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
                    tile.opacity = ( opacity > 0.4 ? 1 : opacity );
                }
            } else { // when moving
                // me.animateMove(x, y)
            }

            //updateLeaderboard( me );

        });



        this.socket.on("agents sensing", (sensed) => {

            // console.log("agents sensing", ...sensed)//, sensed.length)

            var sensed = Array.from(sensed)
            
            var sensed_ids = sensed.map( ({id}) => id )
            for ( const [id, agent] of this.game.agents.entries() ) {
                if ( agent!=this.game.me && !sensed_ids.includes( agent.id ) ) {
                    agent.opacity = 0;
                }
            }

            for ( const sensed_p of sensed ) {
                const {id, name, team, x, y, score} = sensed_p;
                var agent = this.game.getOrCreateAgent(id, name, team, x, y, score)
                agent.name = name;
                agent.opacity = 1;
                agent.x = x;
                agent.y = y;
                agent.team = team;

                if ( agent.score != score ) {
                    agent.score = score;
                    //updateLeaderboard( agent );
                }
            }

        });

        this.socket.on("parcels sensing", (sensed) => {

            // console.log("parcels sensing", ...sensed)//, sensed.length)

            var sensed = Array.from(sensed)

            var sensed_ids = sensed.map( ({id}) => id )
            for ( const [id, was] of this.game.parcels.entries() ) {
                if ( !sensed_ids.includes( was.id ) ) {
                    // console.log('no more sensing parcel', knownId)
                    // was.opacity = 0;
                    this.game.deleteParcel( was.id ); // parcel.removeMesh(); // parcels.delete(knownId);
                }
            }

            for ( const {id, x, y, carriedBy, reward} of sensed ) {
                
                const was = this.game.getOrCreateParcel(id, x, y, carriedBy, reward);

                if ( carriedBy ) {
                    if ( !was.carriedBy ) {
                        var agent = this.game.getOrCreateAgent( carriedBy );
                        was.pickup( agent );
                    }
                }
                else {
                    if ( was.carriedBy )
                        was.putdown(x, y);
                    else {
                        was.x = x;
                        was.y = y;
                    }
                }
                was.reward = reward;
            }

        });

        // this.socket.on("agent info", (id, name, team, score) => {
        //     console.log("changing in agent " + id, " " + name, " info"); 
        //     let color;

        //     //verifico se l'agente è gia stato associato un colore, in caso ne associa
        //     if(this.game.teamsAndColors.has(id)){
        //         color = this.game.teamsAndColors.get(id);
        //     }else{
        //         let coloriGiaUsati = Array.from(this.game.teamsAndColors.values());   // ritorno un array con tutti i colori gia usati per gli altri team    
        //         // console.log("Colori: ", this.game.teamsAndColors)
                
        //         do{
        //             color  = new THREE.Color( 0xffffff );        
        //             color.setHex( Math.random() * 0xffffff );

        //         }while(coloriGiaUsati.some(usedColor => areColorsSimilar(usedColor, color)))    // ripeto la generazione random del colore finchè non è simile a nessun colore gia usato
                
        //         // Aggiorno this.game.teamsAndColors, gli agenti senza team avranno colori diversi da altri team e agenti singoli
        //         this.game.teamsAndColors.set(id,color)
        //     }

        //     let leaderboardElement = document.getElementById('leaderboard');
        //     this.game.leaderboard.updateAgent(id, name, team, score, leaderboardElement, color);   
        //     // updateLeaderboard(id, false, team, score);         
            
        // });

        this.socket.on("team info", (name, score) => {
            console.log("changing in team " + name +" info");
            var color

            //verifico se al team è gia stato associato un colore, in caso ne associa
            if(this.game.teamsAndColors.has(name)){
                color = this.game.teamsAndColors.get(name);
            }else{
                let coloriGiaUsati = Array.from(this.game.teamsAndColors.values());   // ritorno un array con tutti i colori gia usati per gli altri team    
                // console.log("Colori: ", this.game.teamsAndColors)
                
                do{
                    color  = new THREE.Color( 0xffffff );        
                    color.setHex( Math.random() * 0xffffff );

                }while(coloriGiaUsati.some(usedColor => areColorsSimilar(usedColor, color)))    // ripeto la generazione random del colore finchè non è simile a nessun colore gia usato
                
                // Aggiorno this.game.teamsAndColors, gli agenti senza team avranno colori diversi da altri team e agenti singoli
                this.game.teamsAndColors.set(name,color)
            }
        
            let leaderboardElement = document.getElementById('leaderboard');
            this.game.leaderboard.updateTeam(name, score, leaderboardElement, color);  
            // updateLeaderboard(name, true, null, score);         
        });

        this.socket.on('agent deleted', (id, team) =>{
            let leaderboardElement = document.getElementById('leaderboard');
            //console.log("delete agent " + id +" info");
            this.game.leaderboard.removeAgent(id, team, leaderboardElement)
        })

        this.socket.on('team deleted', (name) =>{
            let leaderboardElement = document.getElementById('leaderboard');
            console.log("delete team " + name +" info");
            this.game.leaderboard.removeTeam(name, leaderboardElement)
        })


    }




}



export { Client };