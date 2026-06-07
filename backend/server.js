const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const {spawn} = require('child_process');

//create new express app
const app = express();
const PORT = 3000;

//app.use() -> run on every request 
//cors() -> adds the right header to every response to allow cross-origin requests (HTML and Node server)
app.use(cors());
//express.json() -> teaches Express to read JSOn from request bodies and make it available in req.body
app.use(express.json());
//when a browser visits the root URL, serve the static files from the frontend folder (index.html, style.css, script.js)
app.use(express.static('fronted'));

//bridge function to connect Node.js to Python script
// Return as a PROMISE that resolves with the parsed JSON from Python
function callPython(data){
    return new Promise((resolve, reject) => {
        //Spawn Python as a child process and run watch_agent.py
        // '-m' flag tells Python to run the ai as a module instead of folder
        // 'ai.watch_agent' is the module name
        const pythonProcess = spawn('python', ['-m', 'ai.watch_agent'], {
            // go one level up from backend/ to project root
            cwd: path.join(__dirname, '..')
        });

        //containers to collect output from Python 
        let stdoutData = '';
        let stderrData = '';

        //Listen for data coming OUT of Python 
        //Python may send data in chunks so we concatenate it until we get all the data
        //.on() listens to events from the child process. 'data' event is emitted when Python sends data to stdout or stderr
        pythonProcess.stdout.on('data', (chunk) =>{
            stdoutData += chunk.toString();
        });

        //Listen fro error messages in Python 
        pythonProcess.stderr.on('data', (chunk) =>{
            stderrData += chunk.toString();
        });

        // When Python process finishes 
        // how do we get the exit code -> when close event triggers, Node.js automatically inects the exit status into the first argument of the function 
        pythonProcess.on('close', (exitCode) =>{
            if (exitCode !==0){
                //Python crashed then reject with error message 
                console.error('Python stderr:', stderrData);
                reject(new Error(`Python exited with code ${exitCode}: ${stderrData}`));
            } else {
                //Python finished successfully, resolve with the output
                try {
                    // Parse means to take a string and convert it into a data structure (like a dictionary) that we can work with in JavaScript.
                    const parsed = JSON.parse(stdoutData);
                    resolve(parsed); // send results back to Node.js
                }catch (e){
                    reject(new Error(`Failed to parse Python output: ${stdoutData}`));

                }
            }
        });

        //Write data into Python's stdin thhen close pipe 
        // stdin.end() signals to Python that theres no more input 
        pythonProcess.stdin.write(JSON.stringify(data)); // send data to Python as a JSON string
        pythonProcess.stdin.end(); // close the stdin stream to signal to Python that we're done sending data
    });
}

//Configuration object that tells multer how to store files on disk
//multer.diskStorage() configures destination and filename 
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        //if no error then store file in updloads
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb){
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({storage: storage});

// when someone sends a GET request to the / path -> run the callback function
app.get('/', (req, res) => {
    res.json({status: 'Watch Caption API is running'})
});


//app.post()->respond to POST request (Frontend will POST form data here)
//add async to use await inside function to wait for callPython to finish before sending response back to frontend
app.post('/generate-caption', upload.single('image'), async(req, res) => {
   //upload.single tell multer to find a single find in req that has the field name of image
    if(!req.file){
        return res.status(400).json({error: 'No file uploaded'});
    } 
    if(!req.body.model){
        return res.status(400).json({error: 'No model specified'});
    }
    if(!req.body.condition){
        return res.status(400).json({error: 'No condition specified'});
    }

    console.log('--- New Caption Request ---');
    console.log('Image saved to:', req.file.path);
    console.log('Model:', req.body.model);
    console.log('Condition:', req.body.condition);
    console.log('Extras:', req.body.extras || '(none)');

    //Build a data object to send to Python 
    //req.file/path is the path multer saved the uploaded file to 
    //This is the data that Python expects to receive from Node.js
    const data = {
        image_path: path.resolve(req.file.path),
        model_name: req.body.model,
        condition: req.body.condition,
        extras: req.body.extras || ''
    };

    //call Python and wait for the caption 
    try {
        const result = await callPython(data);
        console.log('Caption generated successfully');
        res.json({
            caption: result.caption
        });
    }catch (error){
        console.error('Error generating caption:', error.message);
        res.status(500).json({error: 'Caption generated failed. Please try again.'});
    }
});

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
});