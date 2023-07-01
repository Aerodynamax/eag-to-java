const nbt = require('binary-nbt'), fs = require('fs');

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
        "folderPath": `./world/${folder1}/${folder2}/`,
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

// END FUNCITONS //

ConvertChunkDataFromFile('./Chunk file read tests/c.0.0.dat').then( (data) => {
    StoreChunkData(
        data["folderPath"],
        data["filename"],
        data["fileContents"]
    )
});