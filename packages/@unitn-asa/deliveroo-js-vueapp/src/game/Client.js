import { default as io, Socket } from 'socket.io-client';
import { Game } from './Game.js';
import { Chat } from './Chat.js';
import { Leaderboard } from './Leaderboard.js'



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
     * @param {Game,{token: string, roomId: string}} options
     */
    constructor ( game, { token, roomId } ) {

        this.game = game;
                
        console.log( "CLIENT: connecting to", HOST+'/'+roomId, "with token:", token.slice(-30) );

        this.socket = io( HOST+'/'+roomId, {
            withCredentials: false,
            extraHeaders: {
                'x-token': token
            }
            // query: {
            //     name: name,
            // }
            // path: '/'
        } );

        this.socket.on( "connect", () => {
            document.getElementById('socket.id').textContent = `socket.id ${this.socket.id}`
        } );

        this.socket.on( "disconnect", (reason) => {
            if (reason === "io server disconnect") {
                // the disconnection was initiated by the server, you need to reconnect manually
                alert( `socket disconected` );
                window.location.href = '/home';
            }
            console.error( `Socket.io connection error` );
        } );

        this.socket.on("connect_error", (reason) => {
            console.error( `connect_error`, reason );
            // alert( `Reconnecting, press ok to continue.` );
        } );

        this.socket.on( 'log', ( {src, timestamp, socket, id, name}, ...message ) => {
            if ( src == 'server' )
                console.log( 'CLIENT: server', timestamp, '\t', ...message )
            else
                console.log( 'CLIENT: client', timestamp, socket, id, name, '\t', ...message );
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

        this.socket.on( "msg", ( id, name, teamId, msg, reply ) => {
            console.log( 'CLIENT: msg', {id, name, teamId, msg, reply} )

            let color
            if(this.game.teamsAndColors.has(teamId)){color = this.game.teamsAndColors.get(teamId);}
            
            let chat = document.getElementById('chat');

            Chat.addMessage(name, color, msg, chat);
            
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

        this.socket.on( "you", ( id, name, teamId, teamName, x, y, score ) => {

            //console.log( "CLIENT: you", id, name, teamId, teamName, x, y, score )

            document.getElementById('agent.id').textContent = `agent.id ${id}`;
            document.getElementById('agent.name').textContent = `agent.name ${name}`;
            document.getElementById('agent.xy').textContent = `agent.xy ${x},${y}`;
            document.getElementById('agent.team').textContent = `agent.team ${teamName}`;
            
            this.game.me = this.game.getOrCreateAgent( id, name, teamId, teamName, x, y, score );
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



        this.socket.on("agents sensing", (sensedReceived) => {

            //console.log("agents sensing", ...sensed)//, sensed.length)

            var sensed = Array.from(sensedReceived)
            
            var sensed_ids = sensed.map( ({id}) => id )
            for ( const [id, agent] of this.game.agents.entries() ) {
                if ( agent!=this.game.me && !sensed_ids.includes( agent.id ) ) {
                    agent.opacity = 0;
                }
            }

            for ( const sensed_p of sensed ) {
                const {id, name, teamId, teamName, x, y, score} = sensed_p;
                var agent = this.game.getOrCreateAgent(id, name, teamId, teamName, x, y, score)
                agent.name = name;
                agent.opacity = 1;
                agent.x = x;
                agent.y = y;
                agent.teamId = teamId
                agent.teamName = teamName;

                if ( agent.score != score ) {
                    agent.score = score;
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

        // when the match is put on the game must add the Leaderbord, but also update the match light in the client panel 
        this.socket.on('match on', async () => { 
            try { await this.game.leaderboard.delete() } catch(error){}    // try to delate the already old leaderbord  

            this.game.leaderboard = new Leaderboard(game, roomId);         // add the new one
            console.log('MATCH ON', this.game)  
            this.game.panel.updateMatchLight();
        })

        // menage the event of an agent that score while the match is on, in this case the leaderbord must be update 
        this.socket.on('leaderbord', (dataAgent, dataTeam) => {
            console.log('UPDATE LEADERBORD: ', dataAgent, dataTeam)
            let teamScore;
            if(dataTeam){teamScore = dataTeam.score}
            console.log(this.game)
            // try to update the leaderbord, the try is used becouse can happen that the update signal come before the costruct of the leaderbord
            try{this.game.leaderboard.updateLeaderbord(dataAgent.agentId, dataAgent.agentName, dataAgent.score, dataAgent.teamId, dataAgent.teamName, teamScore)}
            catch(error){console.log('UPDATE LEADERBORD failed: incomin event before the costruct of leaderbord')}  
        })

        // when the match is put off the game must remove the Leaderbord, but also update the match light in the client panel  
        this.socket.on('match off', () => { 
            this.game.leaderboard.delete(); 
            this.game.panel.updateMatchLight();
        })

        // if the grid has been changed reload the page 
        this.socket.on('changed grid', () => { 
            console.log('Changes Grid')
            location.reload()  
        })

        // event emit to notify the update time of the room timer
        this.socket.on('timer update', (time) => {
            //take the reference to the timer element
            let timerInput = document.getElementById('timer-input');

            if(!timerInput) return                                // check if the timer element is found
            if(!timerInput.readOnly ) timerInput.readOnly = true  //check if the input is disabled, if not disable it becous the user can not change it while it is running

            let minutes = Math.floor(time / 60);                let seconds = time % 60; 

            let formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add a zero if the minutes are less than 10 
            let formattedSeconds = seconds < 10 ? `0${seconds}` : seconds; // Add a zero if the seconds are less than 10 
        
            timerInput.value = formattedMinutes + ':' + formattedSeconds; // Update the value of input with the pattern __:__  
        })

        // event emit to notify the end of the timer
        this.socket.on('timer ended', () => { 
            this.game.panel.updateCentralPart()     // simply update the central part of the panel 
        })

        // evetn emit to notify the freeze or unfreeze of the grid, in this case we update the freeze buttons
        this.socket.on('grid update', () => {
           this.game.panel.updateFreezeButton()
        })



    }




}



export { Client };