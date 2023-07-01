const nbt = require('binary-nbt'), fs = require('fs'), zlib = require('zlib'), path = require("path");


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

async function StoreData(folderPath, filename, fileContents) {

    let dir = `${folderPath}`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    compressedFileContents = zlib.gzipSync( nbt.serializeNBT(fileContents) )

    fs.writeFileSync(folderPath + filename, compressedFileContents);

}

async function ConvertlvlFile(lvlFile) {
    let data = await nbt.deserializeCompressedNBT( fs.readFileSync(lvlFile) );

    let formatted = new Object();
    if (data.Data) {
        formatted = data;
    }
    else {
        formatted.Data = data;
    }


    let compressedFileContents;
    try {
        var dir = `${outputFolder}`;
    
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        compressedFileContents = zlib.gzipSync( nbt.serializeNBT(formatted) )

        fs.writeFileSync(dir + 'level.dat', compressedFileContents);

        console.log("[+] Successfully created level.dat file!");

    } catch (error) {
        console.log("[+] Failed to create level.dat file with error: " + error);
        return;
    }

    return compressedFileContents;
}

async function lvldatToOld(compressedFileContents) {

    try {
        var dir = `${outputFolder}`;
    
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
    
        fs.writeFileSync(dir + 'level.dat_old', compressedFileContents);

        console.log("[+] Successfully created level.dat_old file!");

    } catch (error) {
        console.log("[+] Failed to create level.dat_old file with error: " + error);
        return;
    }
}

async function GenerateSessionLock() {
    try {
        const int64 = Date.now()   
        const b = new Buffer.alloc(8)
        const MAX_UINT32 = 0xFFFFFFFF

        // write
        const big = ~~(int64 / MAX_UINT32)
        const low = (int64 % MAX_UINT32) - big

        b.writeUInt32BE(big, 0)
        b.writeUInt32BE(low, 4)

        console.log(b)

        fs.writeFileSync(`${outputFolder}session.lock`, b)

        console.log("[+] Successfully created session.lock file!");
    } catch (error) {
        console.log("[+] Failed to create session.lock file with error: " + error);
        return;
    }
}

// END FUNCITONS //

// BIGIN MAIN FUNTION //
async function main() {

    ConvertlvlFile(inputlvlFile).then( compressedFileContents => {
        lvldatToOld(compressedFileContents);
    });

    GenerateSessionLock();

    fs.readdir(inputFolderChunks, (err, files) => {
        if(err) throw err;
    
        let totalFiles = files.length;
    
        console.log(`[~] Updating ${totalFiles} chunk files ...`);
    
        files.forEach(file => {
            ConvertChunkDataFromFile(inputFolderChunks + file).then( (data) => {
                StoreData(
                    data["folderPath"],
                    data["filename"],
                    data["fileContents"]
                ).then( () => {totalFiles--;} );
            });
        });
    
        if (totalFiles < 5) {
            console.log(`[+] Successfully updated chunk files ...`);
        }
    
    });

}
// END MAIN FUNTION //


let inputFolder       = './input/';
let inputFolderChunks = inputFolder + "c0/";
let inputlvlFile      = inputFolder + "lvl";

let outputFolder = './output/';

if (!fs.existsSync(outputFolder)){

    fs.mkdirSync(outputFolder, { recursive: true });

} else {
    console.log("[~] Removing all old files ...");

    fs.rmSync(outputFolder, { recursive: true })
    fs.mkdirSync(outputFolder, { recursive: true });

    console.log("[+] Removed all old files ...");
}

main();
