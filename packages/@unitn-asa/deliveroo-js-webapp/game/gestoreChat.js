let chat = {

    addMessage: function(name, color, msg, chatElement) {
        // Truncate name if it exceeds 10 characters
        const truncatedName = name.length > 10 ? name.substring(0, 10) + '...' : name;
      
        const messageElement = document.createElement('div');        // create a new message element
        messageElement.classList.add('message');                     // add the class "message"
                                  
        // set the color of the name
        let colorString = `rgb(255, 255, 255)`;
        if(color){colorString = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;}
        
        // set the inner HTML of the message element
        messageElement.innerHTML = ` 
          <p class="content">                                
          <span class="name" style="color: ${colorString};">${truncatedName}</span>
          ${msg}
          </p>
        `;
      
        // Append the message to the chat div
        chatElement.appendChild(messageElement);

        chatElement.scrollTop = chatElement.scrollHeight;
    }

}



export { chat };