<script setup>

    import { ref, onMounted, onUnmounted, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { Game } from '../game/Game.js';
    import { user } from '../states/user.js';

    const route = useRoute()
    watch( () => route.params.roomId, (newId, oldId) => {
        roomId.value = newId;
    })

    const roomId = ref( route.params.roomId );
    var game;

    onMounted(() => {
        // const roomId = route.params?.id || 0;
        const token = user.value.token;
        console.log('deliveroo room id: ', roomId.value, 'token: ', token)
        game = new Game( { token, roomId: roomId.value } ); 
    })

    onUnmounted(() => {
        game.destroy();
    })

</script>

<template>
    <main>

        <div id="dashboard" style="display:block">
        
            <div id="info" style="position:absolute; color:white; z-index:1; opacity:0.3;">
                
                <span> room {{ roomId }} </span>
                
                <br>
                <span id="socket.id"></span>
                <br>
                <span id="agent.id"></span>
                <br>
                <span id="agent.name"></span>
                <br>
                <span id="agent.team"></span>
                <br>
                <span id="agent.xy"></span>
                <br>
                <pre id="config"></pre>
                
                <img id="canvas" width="200" height="200" style="position: relative; top: 0; left: 0; z-index: 1000;"></img>
            </div>

            <div id="right-colum" style="display:none">

                <div id="panel" style="display: block;">
                    <div id="central-part">
                        <div id="timer-container">
                            <input type="text" id="timer-input" class="timer-input" readonly="" style="flex: 1 1 0%;" value="00:05">
                            <div id="panel-leable-div">
                                <div class="light-text-match" id="light-text-match">
                                    <div class="match-text">match:</div>
                                    <div id="match-light" class="match-light"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="folder">
                    
                    <h4 id="chatTitle">Chat</h4>
                    <div class="chat closed" id="chat"></div>

                    <h4>Leaderboard</h4>
                    <div class="folder closed">
                        <ul class="agentsList" v-for="agent in agents">
                            <li class="agent">
                                <div class="agentInTeam">
                                    <div class="name_type">
                                        <div class="name">{{ agent.name }}</div>
                                        <div class="type">{{ agent.type }}</div>
                                    </div>
                                    <div class="score">{{ agent.score }}</div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    
                </div>

            </div>
            
        </div>
        
        <div id="threejs"></div>

    </main>
</template>

<style>

    body { margin: 0; padding-bottom: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

    #form { background: rgba(0, 0, 0, 0.15); padding: 0.25rem; position: fixed; bottom: 0; left: 0; right: 0; display: flex; height: 3rem; box-sizing: border-box; backdrop-filter: blur(10px); }
    #input { border: none; padding: 0 1rem; flex-grow: 1; border-radius: 2rem; margin: 0.25rem; }
    #input:focus { outline: none; }
    #form > button { background: #333; border: none; padding: 0 1rem; margin: 0.25rem; border-radius: 3px; outline: none; color: #fff; }

    #messages { list-style-type: none; margin: 0; padding: 0; }
    #messages > li { padding: 0.5rem 1rem; }
    #messages > li:nth-child(odd) { background: #efefef; }

    .label {
        color: #FFF;
        font-family: sans-serif;
        padding: 2px;
        background: rgba( 0, 0, 0, .6 );
        font-size: '12pt';
    }
    
    #dashboard {
        display: none;
        font-size: 9pt;
    }
    
    div#info:hover {
        opacity: 1 !important;
        background-color: rgba(0, 0, 0, 0.8);
    }

    #right-colum {
        width: 200px;
        margin: 20px auto;
        border-radius: 5px;
        padding: 10px;
        position: absolute; 
        z-index:1; 
        right: 5px;
    }

    .folder {
        margin-bottom: 20px;
    }

    .folder h4 {
        margin: 0;
        border-bottom: 1px solid #ccc;
        bottom: 3px;
    }


    /* CSS for the leaderboard elements */
    .leaderboard {
        border: 1px solid #ccc;
        height: 200px;
        padding: 5px;
        overflow-y: auto;
    }

    .team {
        display: flex; 
        flex-direction: column; 
        padding: 2px 4px; 
        margin-bottom: 1px; 
        border: 1px solid #ccc; 
        border-radius: 5px; 
    }

    .teamInfo {
        display: flex;
        align-items: center;
        flex-direction: row; 
        justify-content: space-between;
        border-radius: 5px; 
    }

    .agent {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2px 4px; 
        margin-bottom: 1px; 
        border: 1px solid #ccc; 
        border-radius: 5px; 
    }

    .agentsList{
        background-color: #ccc;
        border: 1px solid black; 
        border-radius: 5px; 
    }

    .agentInTeam {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2px 4px; 
        margin-left: 2px;
    }

    .name_type{
        flex-grow: 1; 
        display: flex;
        align-items: center;
        text-align: left; 
        padding-right: 10px;
    }

    .name_type .name {
        font-size: 12px;
        text-align: left; 
        padding-right: 5px;
        color: black;
        font-weight: bold;
    }

    .name_type .type {
        font-size: 8px;
        text-align: left;
        color: black; 
    }

    .score {
        text-align: right; 
        font-size: 12px;
        color: black;
        font-weight: bold;
    }


    /* CSS for the message elements */
    .chat {
        border: 1px solid #ccc;
        height: 200px;
        overflow-y: auto;
        padding: 5px;
        bottom: 5px;
        background-color: rgba(0, 0, 0, 0.5); 
        scrollbar-width: none;
    }

    .message {
        margin-bottom: 2px;
    }
    
    .message .content {
        display: inline-block;
        font-size: 10px;
        word-break: break-all;
        padding: 0;
        margin: 0;
    }

    .message .content .name {
        font-weight: bolder;
        margin-right: 4px;
        font-size: 12px;
        padding: 0;
    }

    .chat.closed {
        display: none;
    }

    /* CSS for the panel */
    #panel{
        display: flex;
        flex-direction: column;
        align-items: stretch;
        border: 2px solid #f0f0f0;
        padding: 5px;
        background-color: aliceblue;
        margin-bottom: 20px;
    }

    #home-login-buttons{
        display: flex;
        flex-direction: row;
    }

    .login-button { 
        flex-basis: 80%; 
        background-color: #0077be;
        border: 2px solid #f0f0f0;
        color: #f0f0f0; 
        padding: 5px 10px;
        margin-left: 10px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 14px;
        border-radius: 5px;
        cursor: pointer;
        transition-duration: 0.4s;
    }

    .login-button:hover {
        opacity: 0.8;
    }

    .login-button.logged{
        flex-basis: 80%;
        background-color: white;
        border: 2px solid #0077be;
        color: #0077be; 
        font-weight: bold;
    }

    #panel .admin-row{
        margin-top: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }

    #panel .freeze-button {
        flex-grow: 1;
        background-color: aquamarine;
        width: 80px;
        padding: 0;
        color: black;
        text-align: center;
        border: 2px solid black; 
        display: inline-block;
        font-size: 14px;
        border-radius: 5px;
        cursor: pointer;
    } 

    #panel .change-grid-button {
        flex-grow: 1;
        background-color: #8a6bbe;
        color: black;
        text-align: center;
        border: 2px solid black; 
        display: inline-block;
        font-size: 14px;
        border-radius: 5px;
        cursor: pointer;
    }

    #panel .home-button {
        flex-basis: 20%; 
        aspect-ratio: 1/1;
        background-color: orangered;
        color: white;
        text-align: center;
        border: 2px solid black; 
        display: inline-block;
        font-size: 14px;
        border-radius: 50%;
        cursor: pointer;
    }

    #panel #timer-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        text-align: center;
        margin: 10px auto;
        font-family: Arial, sans-serif;
        width: 100%
    }

    @font-face {
        font-family: 'DigitalClock';
        src: url('./G7_Segment_7a.ttf') format('truetype'); 
        /* Free Font downloaded from the link: https://www.dafont.com/open-24-display-st.font */
    }

    #panel #timer-input {
        height: 30px; 
        width: 98px;
        border: none; 
        outline: none; 
        padding: 0;
        background-color: transparent; 
        font-size: 20px; 
        font-weight: bold; 
        color: black; 
        text-align: center; 
        font-family: 'DigitalClock', sans-serif; 
    }

    #panel #timer-input:focus {
        outline: none; 
    }

    #panel #timer-input.invalid {
        color:red; 
        animation: shake 0.3s ease-in-out; 
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); } 
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    #panel #timer-button{
        background-color: limegreen;   
        color:  white;
        text-align: center;
        border: 2px solid black; 
        display: block;
        margin-left: auto;
        width: 80px;
        font-size: 14px;
        border-radius: 5px;
        cursor: pointer;
    }

    .match-id-admin {
        display: flex;
        align-items: center;
        justify-content: space-between;
        text-align: center;
        margin: 0px auto;
        font-family: Arial, sans-serif;
        width: 100%
    }

    #match-id-lable-admin{
        color: black;
        padding: 0;
        font-weight: bold;
        font-size: 10px;
        width: 98px;
        height: 22px;
        text-align: center;
        line-height: 22px;
    }

    #match-id-exit-admin{
        background-color: red;   
        color:  white;
        text-align: center;
        border: 2px solid black; 
        display: block;
        width: 80px;
        margin-left: auto;
        font-size: 14px;
        border-radius: 5px;
        cursor: pointer;
    }


    .panel-leable-div {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .light-text-match {
        display: flex;
        align-items: center; 
        margin-bottom: 10px; 
        width: 100%;
        justify-content: space-between;
        
    }

    .light-text-match .match-light {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: grey; 
        margin-right: 2px;
        margin-left: 3px;
    }

    .light-text-match .match-light.on {
        background-color: red; 
    }

    .light-text-match .match-text {
        color:#000000;
        font-size: 14px;
        margin-left: 2px;
        margin-right: 3px;
    }


    .freeze-button {
        flex-grow: 1;
        background-color: aquamarine;
        width: 80px;
        padding: 0;
        color: black;
        text-align: center;
        border: 2px solid black; 
        display: inline-block;
        font-size: 14px;
        border-radius: 5px;
        cursor: pointer;
    }

    #open-agents-list {
        height: 10px;
        background-color: #d3d3d3; 
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 10px; 
        margin-top: 10px;
    }

    #open-agents-list-left-text {
        font-size: 12px; 
        font-weight: bold;
        margin-left: 5px;
        color: black
    }

    #open-agents-list-down-arrow {
        font-size: 10px; 
        margin-right: 5px;
        transition: transform 0.3s;
        color:black
    }

    #open-agents-list-down-arrow.rotated {
        transform: rotate(180deg); 
    }

    #agents-list {
        display: none; 
        background-color: #d3d3d3;
    }

    #agents-list .agent-div {
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        border: 2px solid black; 
        border-radius: 10px; 
        padding: 2px 10px; 
        margin-bottom: 5px; 
        background-color: white; 
        color: black;
    }

    #agents-list .agent-div .agent-name {
        font-size: 10px; 
        font-weight: bold;
    }

    #agents-list .agent-div .agent-id {
        font-size: 8px;
    }


    /* CSS for the login form */
    /* #overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 1);
        z-index: 998;
    } */


    /* CSS for the change of the grid */
    .modal {
        position: fixed;
        z-index: 100;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0, 0, 0, 0.4);
    }

    .modal-content {
        background-color: #8a6bbe;
        border-radius: 8px;
        min-width: 600px; /* Larghezza minima del pop-up */
        max-height: 80%; /* Altezza massima del pop-up */
        overflow-y: auto; /* Abilita lo scrolling verticale se necessario */
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        box-sizing: border-box;
        font-size: 12px; 
        text-align: left;
    }

    .lableNewMap{
        display: inline-block;
        width: 40%; 
        margin-right: 12px;
        text-align: left; 
        font-weight: bold; 
    }


    .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    }

    /* Stili per gli input */
    .inputNewMap{
        width: 40%;
        padding: 2px;
        border: 1px solid black;
        border-radius: 4px;
        box-sizing: border-box;
        font-size: 12px;
    }

    .submitNewMap{
        display: inline-block;
        padding: 4px 8px;
        border: 2px solid white;
        border-radius: 8px;
        background-color: black;
        color: #8a6bbe;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        font-size: 16px;
        margin-left: 10px;
    }

    .returnButton {
        display: inline-block;
        padding: 2px 4px;
        border: 2px solid white;
        border-radius: 8px;
        background-color: black;
        color: #8a6bbe;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        font-size: 12px;
        margin-left: 10px;
    }

    /* Style for the select map form */
    #mapListModal {
        display: none;
        position: fixed;
        z-index: 101;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(169, 78, 255, 0.4);
    }

    #mapListModal-content {
        background-color: #000000;
        border-radius: 8px;
        min-width: 500px; 
        max-height: 80%; 
        overflow-y: auto; 
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        box-sizing: border-box;
        font-size: 12px; 
        text-align: left;
    }

    #map-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr); 
        gap: 10px; 
        width: 100%; 
        max-width: 400px; 
    }

    .map-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .map-title h3 {
        margin-right: 10px;
    }

    .map {
        display: flex;
        flex-direction: column;
        width: 200px; 
        height: 200px; 

        --cell-size: calc(200px / var(--rows) - 2px);       /* Calcola la dimensione desiderata della cella */
    }

    .row {
        display: flex;
    }

    .cell {
        flex: 1;
        /* Calcola la dimensione in base al numero di celle nella riga e colonna */
        width: var(--cell-size); /* Utilizza il valore calcolato */
        height: var(--cell-size); /* Utilizza il valore calcolato */
        margin: 1px;
    }

    .light-green {
        background-color: lightgreen;
    }

    .dark-green {
        background-color: darkgreen;
    }

    .red {
        background-color: red;
    }

    .black {
        background-color: black;
    }

    .map_options{
        display: flex;
        gap: 10px; 
    }

</style>