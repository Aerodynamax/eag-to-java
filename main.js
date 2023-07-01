const nbt = require('binary-nbt'), fs = require('fs'), zlib = require('zlib'), path = require("path");


// BIGIN THIRD PARTY FUNCTIONS //


// https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
const GetAllFiles = function(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)
  
    arrayOfFiles = arrayOfFiles || []
  
    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = GetAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
        }
    })
  
    return arrayOfFiles
}

// END THIRD PARTY FUNCTIONS //



// BIGIN FUNCTIONS //

async function ConvertChunkDataFromFile(chunkFile) {

    let data = await nbt.deserializeCompressedNBT( fs.readFileSync(chunkFile) );
    
    let x = (data.xPos) ? data.xPos : data.Level.xPos;
    let z = (data.zPos) ? data.zPos : data.Level.zPos;

    x = parseInt(x);
    z = parseInt(z);

    let formatted = new Object();
    if (data.Level) {
        formatted = data;
    }
    else {
        formatted.Level = data;
    }

    // var c = (a < b) ? "a is less than b"  : "a is not less than b";

    let folder1 = (x < 0) ? (256 + x % 64).toString(36) : (x % 64).toString(36); // if negative, wrap around to 256
    let folder2 = (z < 0) ? (256 + z % 64).toString(36) : (z % 64).toString(36);

    let filename = "c." + (x).toString(36) + "." + (z).toString(36) + ".dat";


    return {
        "folderPath": `${outputFolder}${folder1}/${folder2}/`,
        "filename" : filename,
        "fileContents" : formatted
    };
};

async function StoreChunkData(folderPath, filename, fileContents) {

    var dir = `${folderPath}`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    compressedFileContents = zlib.gzipSync( nbt.serializeNBT(fileContents) )

    fs.writeFileSync(folderPath + filename, compressedFileContents);

}

// END SOME FUNCITONS //

let inputFolder       = './input/';
let inputFolderChunks = inputFolder + "/c0/";

let outputFolder = './output/'

if (!fs.existsSync(outputFolder)){

    fs.mkdirSync(outputFolder, { recursive: true });

} else {
    console.log("[~] Removing old files ...");

    fs.rmSync(outputFolder, { recursive: true })
    fs.mkdirSync(outputFolder, { recursive: true });

    console.log("[+] Removed all old files ...");
}


fs.readdir(inputFolderChunks, (err, files) => {
    if(err) throw err;

    let totalFiles = files.length;

    console.log(`[~] Updating ${totalFiles} chunk files ...`);

    files.forEach(file => {
        ConvertChunkDataFromFile(inputFolderChunks + file).then( (data) => {
            StoreChunkData(
                data["folderPath"],
                data["filename"],
                data["fileContents"]
            ).then( () => {totalFiles--;} );
        });
    });

    if (totalFiles <= 0) {
        console.log(`[+] Successfully updated chunk files ...`);
    }

});

