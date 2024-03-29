// confermation pop-up of the new match
function showConfirmationPopup(id, options, mappa) {

    const popup_window = document.createElement('div');
    popup_window.classList.add('modal');
  
    const popup = document.createElement('div');
    popup.classList.add('modal-content');
  
    const title = document.createElement('h3');
    title.innerText='Create new match with id:' + id;
  
    const optionsList = document.createElement('div');
    optionsList.classList.add('options-list');
  
    //leggo gli argomenti di options per inserirli nel testo ------------------
    let optionsText = '';
    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        optionsText += `${key}: ${options[key]}\n`;
      }
    }
    optionsList.innerText=optionsText
  
  
    //aggiunto la rappresentazione grafica della mappa selezionata ------------ 
    const mapRepresentation = document.createElement('div');
    mapRepresentation.innerHTML= generateMapRepresentation(mappa)
  
  
    //aggiungo div di contenimento per rendere gradevole la visualizzazione ----
    const description = document.createElement('div')
    description.appendChild(title)
    description.appendChild(optionsList)
  
    const mapOptions = document.createElement('div');
    mapOptions.classList.add('map_options');
    mapOptions.appendChild(mapRepresentation);
    mapOptions.appendChild(description)
  
  
    //chiusura del pop_up ------------------------------------------------------
    const close = document.createElement('div');
    close.innerText = '✕';
    close.classList.add('close');
    close.addEventListener('click', function() {
      popup_window.style.display = 'none';
      location.reload();
    });
  
    
    // Aggiunta della lista delle opzioni e della rappresentazione della mappa al pop-up
    popup.appendChild(close);
    popup.appendChild(mapOptions);
    
  
    popup_window.appendChild(popup);
    popup_window.style.display = 'block';
  
    // Aggiunta del pop-up al body del documento
    document.body.appendChild(popup_window);
  
}

export{showConfirmationPopup}