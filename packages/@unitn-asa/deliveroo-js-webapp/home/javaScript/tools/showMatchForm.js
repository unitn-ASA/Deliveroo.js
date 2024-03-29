/* DEFINE THE HTML OF THE NEW MATCH FORM */
function showMatchForm() {

    //div modal to set a darker background
    var modalDiv = document.createElement('div');
    modalDiv.id = 'matchFormContainer';
    modalDiv.classList.add('modal');

    // div modal-content that is the colored pop-up
    var modalContentDiv = document.createElement('div');
    modalContentDiv.classList.add('modal-content');

    // close button 
    var closeDiv = document.createElement('div');
    closeDiv.classList.add('close');
    closeDiv.innerHTML = '&times;';
    closeDiv.onclick = function() {
        modalDiv.style.display = 'none';
    };
    modalContentDiv.appendChild(closeDiv);

    // new match form
    var form = document.createElement('form');
    form.id = 'matchForm';

    // HTML code of the form 
    form.innerHTML = `
    <div style="text-align: center;">
        <div style="display: inline-block;">
            <h1 style="font-weight: bolder; display: inline-block;">NEW MATCH</h1>
        </div>
    </div>

    <label for="mapFile" class="lableNewMap">MAP_FILE:</label>
    <input type="text" id="mapFile"  class="inputNewMap" name='mapFile' readonly>
    <span onclick="openMapList()" class="returnButton">Seleziona</span>

    <label for="parcelsMax" class="lableNewMap">MATCH_TIMEOUT:</label>
    <input type="number" id="matchTimeout" class="inputNewMap" name="matchTimeout" required>

    <label for="parcelsInterval" class="lableNewMap">PARCELS_GENERATION_INTERVAL:</label>
    <select id="parcelsInterval" class="inputNewMap" name="parcelsInterval">
        <option value="1s">1 second</option>
        <option value="2s" selected>2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select>

    <label for="parcelsMax" class="lableNewMap">PARCELS_MAX:</label>
    <input type="number" id="parcelsMax" class="inputNewMap" name="parcelsMax" required>

    <label for="parcelsRewardAvg" class="lableNewMap">PARCEL_REWARD_AVG:</label>
    <input type="number" id="parcelsRewardAvg" class="inputNewMap" name="parcelsRewardAvg" required>

    <label for="parcelsRewardVariance" class="lableNewMap">PARCEL_REWARD_VARIANCE:</label>
    <input type="number" id="parcelsRewardVariance" class="inputNewMap" name="parcelsRewardVariance" required>

    <label for="parcelsDecadingInterval" class="lableNewMap">PARCE_DECADING_INTERVALL:</label>
    <select id="parcelsDecadingInterval" class="inputNewMap" name="parcelsDecadingInterval">
        <option value="infinite" selected>Costanti</option>
        <option value="1s">1 second</option>
        <option value="2s">2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select><br>

    <label for="randomlyMovingAgents" class="lableNewMap">RANDOMLY_MOVING_AGENTS:</label>
    <input type="number" id="randomlyMovingAgents" class="inputNewMap" name="randomlyMovingAgents" required>

    <label for="randomlyAgentSpeed" class="lableNewMap">RANDOM_AGENT_SPEED:</label>
    <select id="randomlyAgentSpeed" class="inputNewMap" name="randomlyAgentSpeed">
        <option value="1s">1 second</option>
        <option value="2s" selected>2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select><br><br>

    
    <label for="agentsObservationDistance" class="lableNewMap">AGENTS_OBSERVATION_DISTANCE:</label>
    <input type="number" id="agentsObservationDistance" class="inputNewMap" name="agentsObservationDistance" value=5>
    
    <label for="parcelsObservationDistance" class="lableNewMap">PARCELS_OBSERVATION_DISTANCE:</label>
    <input type="number" id="parcelsObservationDistance" class="inputNewMap" name="parcelsObservationDistance" value=5>
    <br><br>

    <div style="text-align: center;">
        <div style="display: inline-block;">
            <input type="submit" class="submitNewMap" value="Submit">
        </div>
    </div>
    `;

    // add the form to the div modal-content
    modalContentDiv.appendChild(form);

    // add the div modal-content to the div modal
    modalDiv.appendChild(modalContentDiv);

    // add the div modal in the body
    document.body.appendChild(modalDiv);

}

export { showMatchForm };


  


