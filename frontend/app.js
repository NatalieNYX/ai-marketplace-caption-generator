//Create an object that stores all the infromation given by the user 
const watchData = {
    image: null,
    model: '',
    condition: '',
    extas: ''
};

// Track steps of the conversation
// Better to write step in desc phrase rather than number, so it's easier to understand what each step is for when we check the code later
let currentStep = 'upload';

//Grab references to the two key HTML elements that will be modified 
const chatWindow = document.getElementById('chatWindow');
const inputArea = document.getElementById('inputArea');


//create chat bubble element and add it to the chat window
function addChatBubble(text, type = 'bot'){  
    const bubble = document.createElement('div'); //creates new div
    bubble.classList.add('bubble', type);
    bubble.textContent = text; 
    chatWindow.appendChild(bubble);
    scrollToBottom();
}

function scrollToBottom(){
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
  const el = document.createElement('div');
  el.classList.add('typing');
  el.id = 'typingIndicator';
  el.textContent = 'WatchCaption is thinking...';
  chatWindow.appendChild(el);
  scrollToBottom();
}

// Once the caption is generated, remove the typing indicator
function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

// clear between every step
function clearInput() {
  inputArea.innerHTML = '';
}


// Need text input for model name and extras 
// Create a fuction that can be called during both steps