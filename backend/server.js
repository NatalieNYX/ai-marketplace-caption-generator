const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

//create new express app
const app = express();
const PORT = 3000;

//app.use() -> run on every request 
//cors() -> adds the right header to every response to allow cross-origin requests (HTML and Node server)
app.use(cors());
//express.json() -> teaches Express to read JSOn from request bodies and make it available in req.body
app.use(express.json());

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
app.post('/generate-caption', upload.single('image'), (req, res) => {
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

    res.json({
        caption: `[STUB] Caption for ${req.body.model} in ${req.body.condition} condition. Phase 3 will connect this to Gemini.`
    });
});

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
});