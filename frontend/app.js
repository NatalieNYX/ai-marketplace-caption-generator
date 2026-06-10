//Create an object that stores all the infromation given by the user 
const watchData = {
    image: null,
    model: '',
    condition: '',
    extras: ''
};

//DOM References  
//Include all elements that we need to interact with in JS here
//Faster than calling getElementById multiple times in different functions

//Upload image 
const uploadCard    = document.getElementById('upload-card');
const photoInput    = document.getElementById('photo-input');
const msgPhoto      = document.getElementById('msg-photo');
const photoFilename = document.getElementById('photo-filename');
 
// Watch Model 
const msgAskModel   = document.getElementById('msg-ask-model');
const msgModel      = document.getElementById('msg-model');
const bubbleModel   = document.getElementById('bubble-model');
 
// Condition 
const msgAskCondition  = document.getElementById('msg-ask-condition');
const conditionOptions = document.getElementById('condition-options');
const msgCondition     = document.getElementById('msg-condition');
const bubbleCondition  = document.getElementById('bubble-condition');
 
// Extras Details
const msgAskDetails = document.getElementById('msg-ask-details');
const msgExtras     = document.getElementById('msg-extras');
const bubbleExtras  = document.getElementById('bubble-extras');
 
// Loading and caption + error
const msgLoading    = document.getElementById('msg-loading');
const msgCaption    = document.getElementById('msg-caption');
const captionText   = document.getElementById('caption-text');
const msgError      = document.getElementById('msg-error');
 
// Input bar at the bottom
const textInput     = document.getElementById('text-input');
const sendBtn       = document.getElementById('send-btn');
 
// Caption action buttons
const btnCopy       = document.getElementById('btn-copy');
const btnRestart    = document.getElementById('btn-restart');
const btnRetry      = document.getElementById('btn-retry');



// Helpers
// To remove .hidden from element to reveal it 
function reveal(el){
  el.classList.remove('hidden');

  //Scroll the message widnow down so the new message is visible
  const win = document.getElementById('message-window');
  // Small delay so the elemt is in the DOM before we scroll
  setTimeout(() =>{
    win, scrollTop = win.scrollHeight;
  }, 50);
}

// Enables the shared text input bar and sets its placeholder text 
function enableTextInput(placeholder){
  textInput.placeholder = placeholder;
  textInput.disable = false;
  textInput.value = '';
  sendBtn.disable = false;
  textInput.focus();
}

// Disable the input bar so the user cant type during bot steps 
function disableTextInput(){
  textInput.placeholder = '';
  sendBtn.disable = true;
  textInput.value = '';
  textInput.disable = true;
}


// Step 1 -> Upload Image 
// Upload card is already visible in HTML, so need to add clcik -> file picker and preview flow

// Clicking anywhere in the card will trigger hidden input type = file 
uploadCard.addEventListener('click', ()=>{
  photoInput.click()
});

photoInput.addEventListener('change', ()=>{
  const file = photoInput.files[0];  // Take the first file selected  by the user

  if (!file) return; // if no file the stop function 

  watchData.image = file  // add file to the object

  //show preview of image in user bubble 
  const img = document.createElement('img')
  img.src = URL.createObjectURL(file); // create a temporary local url for the file
  img.alt = file.name;

 
  msgPhoto.querySelector('.bubble').innerHTML = '';  // clear any old content
  msgPhoto.querySelector('.bubble').appendChild(img); //insert the image
  
  const nameSpan = document.createElement('span');
  nameSpan.classList.add('photo-name');
  nameSpan.textContent = file.name;
  msgPhoto.querySelector('.bubble').appendChild(nameSpan);

  reveal(msgPhoto); //unhide the msgPhoto element 

  uploadCard.classList.add('done');

  // Add small delay on model input to make conversation feel natural 
  setTimeout(()=>{
    reveal(msgAskModel);

    // Activate the shared text input for the model step 
    enableTextInput('e.g. Casio AE1200, Seiko SKX007…');

    // Tell the send handler which step we are on 
    currentStep = 'model';
  }, 700);
});


// Step 2 -> Shared Text Input Handler 
// One send handler covers both model and extras 
// Use currentStep to know which field to fill 
let currentStep = 'idle'; // idle, model, extras

function handleTextSubmit(){
  const value = textInput.value.trim();
  if (!value) return;

  if(currentStep === 'model'){
    watchData.model = value;
    bubbleModel.textContent = value;
    reveal(msgModel);
    disableTextInput();

    setTimeout(()=>{
      reveal(msgAskCondition);
    }, 700);

    currentStep = 'idle';

  }else if (currentStep === 'extras'){
    watchData.extras = value;
    bubbleExtras.textContent = value;
    reveal(msgExtras);
    disableTextInput();

    setTimeout(()=>generateCaption(), 700);

    currentStep = 'idle';
  }
}

// Set up both click and enter key btn 
sendBtn.addEventListener('click', handleTextSubmit);
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleTextSubmit();
});


// Step 3 -> Conditions Button 
// Attack one click handler to parent div using EVENT DELEGATION 
// one listenr covers all 5 buttons instead of separately 
conditionOptions.addEventListener('click', (e)=>{
  // e.target is whichever element that is clicked 
  // .closest() walks up the DOM to find nearest .option-btn
  const btn = e.target.closest('.option-btn');
  if (!btn) return; //stop if click is on div gap and not a button 

  watchData.condition = btn.dataset.value; //reads data-value

  // Mark chosen button as selected and lock all buttons 
  conditionOptions.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('locked');
  });
  btn.classList.add('selected');

  //Show the picked condition as user bubble 
  bubbleCondition.textContent = watchData.condition;
  reveal(msgCondition);

  setTimeout(()=> {
    reveal(msgAskDetails);
    enableTextInput('e.g. box & papers, aftermarket strap…');
    currentStep = 'extras';
    //also show a Skip option next to the send button 
    showSkipButton();
  }, 700);
});


// Step 4 -> Skip Button for Extras 
// Add skip button during extras step then remove it afterwards
function showSkipButton(){
  // Avoid duplicayong if somehow called twice 
  if(document.getElementById('skip-btn')) return;

  const skip = document.createElement('button');
  skip.id = 'skip-btn';
  skip.textContent = 'Skip';
  skip.classList.add('action-btn');  // Reuse action-btn styling 
  skip.style.marginLeft = '6px';

  skip.addEventListener('click', ()=>{
    watchData.extras = '';
    skip.remove();
    disableTextInput();
    // Show a skipped bubble so the chat flow feels complete 
    bubbleExtras.textContent = '(no extras)';
    reveal(msgExtras);
    setTimeout(()=>generateCaption(), 700);
    currentStep = 'idle';
  });

  //Insert the Skip button right after the send button 
  sendBtn.insertAdjacentElement('afterend', skip);
}


function removeSkipButton() {
    const skip = document.getElementById('skip-btn');
    if (skip) skip.remove();
}
 

// Step 5 -> Generate Caption (fetch)
// This is the only place the frontend talks to node.js
async function generateCaption(){
  removeSkipButton();
  disableTextInput();
  reveal(msgLoading);

  //FormData bundles file and text fields 
  //multer on the Node.js side is built to receive thsi format 
  const formData = new FormData();
  formData.append('image', watchData.image);
  formData.append('model', watchData.model);
  formData.append('condition', watchData.condition);
  formData.append('extras', watchData.extras);

  try{
    // IMPORTANT -> No Content-Type header when sending FormData
    // The browser will automatically set it with required "boundary" string
    // Setting it manually will break multer 
    const response = await fetch('http://localhost:3000/generate-caption', {
      method: 'POST',
      body: formData
    });

    msgLoading.classList.add('hidden');
    
    if(!response.ok){
      //HTTP error (400,500) -> server responsed but theres issues 
      const errData = await response.json().catch(()=>({}));
      console.error('Server error:', errData);
      reveal(msgError);
      return;
    }

    const data = await response.json();
    captionText.textContent = data.caption;
    reveal(msgCaption);
  }catch(err){
    //Network error -> server not running
    msgLoading.classList.add('hidden');
    reveal(msgError);
    console.error('Fetch failed: ', err);
  }
}

// Caption Acations 
btnCopy.addEventListener('click', async()=>{
  try{
    await navigator.clipboard.writeText(captionText.textContent);
    btnCopy.textContent = 'Copied!';
    setTimeout(() => { btnCopy.textContent = 'Copy'; }, 2000);
  }catch{
    btnCopy.textContent = 'Select Text Manually';
  }
});


// Reload the page to reset all state 
btnRestart.addEventListener('click', ()=>location.reload());
btnRetry.addEventListener('click', ()=>location.reload());