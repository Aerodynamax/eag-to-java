const nbt = require('binary-nbt'), fs = require('fs'), zlib = require('zlib');

// var Beta = fs.readFileSync('./Chunk file read tests/c.0.0.dat');

// nbt.parse(Beta, function(error, data) {
//     if (error) { throw error; }

//     console.log("\n\n==BETA-1.2==\n\n")

//     console.log(data.value);
// });

async function GetXZChunkFile(chunkFile) {

    try {
        let data = await nbt.deserializeCompressedNBT( fs.readFileSync(chunkFile) );
    
        let x = (data.xPos) ? data.xPos : data.Level.xPos;
        let z = (data.zPos) ? data.zPos : data.Level.zPos;

        x = parseInt(x);
        z = parseInt(z);

        console.log("[+] Successfully identified chunk X & Z!");

        return {xPos: x, zPos: z};

    } catch (error) {
        console.log("[-] Failed to identify chunk X & Z with error: " + error);
        return;
    }
};

async function IncludeMCFormatChunkFile(chunkFile) {

    try {
        let data = await nbt.deserializeCompressedNBT( fs.readFileSync(chunkFile) );
    
        if (data.Level) {
            // console.log("already MC format, continuing ...");
        }
        else {
            const formatted = new Object();
            formatted.Level = data;

            data = formatted;
        }

        console.log("[+] Successfully formatted chunk!");

        return data;

    } catch (error) {
        console.log("[-] Failed to format chunk with error: " + error);
        return;
    }
};

async function ConvertChunkDataFromFile(chunkFile) {

    let data = await nbt.deserializeCompressedNBT( fs.readFileSync(chunkFile) );
    
    let x = 0, z = 0;
    try {
        x = (data.xPos) ? data.xPos : data.Level.xPos;
        z = (data.zPos) ? data.zPos : data.Level.zPos;

        x = parseInt(x);
        z = parseInt(z);

        console.log("[+] Successfully identified chunk X & Z!");

    } catch (error) {
        console.log("[-] Failed to identify chunk X & Z with error: " + error);
        return;
    }

    let formatted = new Object();
    try {
        if (data.Level) {
            formatted = data;
        }
        else {
            formatted.Level = data;
        }

        console.log("[+] Successfully formatted chunk!");


    } catch (error) {
        console.log("[-] Failed to format chunk with error: " + error);
        return;
    }

    let folder1, folder2, filename;
    try {
        // var c = (a < b) ? "a is less than b"  : "a is not less than b";

        folder1 = (x < 0) ? (256 + x % 64).toString(36) : (x % 64).toString(36); // if negative, wrap around to 256
        folder2 = (z < 0) ? (256 + z % 64).toString(36) : (z % 64).toString(36);

        filename = "c." + (x).toString(36) + "." + (z).toString(36) + ".dat";

        console.log("[+] Successfully identified folder & filenames!");

    } catch (error) {
        console.log("[+] Failed to identify folder & filenames with error: " + error);
        return;
    }


    return {
        "folderPath": `./test/${folder1}/${folder2}/`,
        "filename" : filename,
        "fileContents" : formatted
    };
};

async function StoreChunkData(folderPath, filename, fileContents) {

    try {
        var dir = `${folderPath}`;
    
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        compressedFileContents = zlib.gzipSync( nbt.serializeNBT(fileContents) );
    
        fs.writeFileSync(folderPath + filename, compressedFileContents);

        console.log("[+] Successfully created Path and stored file!");

    } catch (error) {
        console.log("[+] Failed to create Path and store file with error: " + error);
        return;
    }
}

function writeFileNoOverwrite(filename, content) {
    fs.writeFile(filename, "some data", { flag: "wx" }, function(err) {
        if (err) {
            filename = filename + "_";
            writeFileNoOverwrite(filename, content);
        }
    });
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
        var dir = `./test/`;
    
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
        var dir = `./test/`;
    
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

// https://stackoverflow.com/a/35743335
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

        fs.writeFileSync('./test/session.lock', b)

        console.log("[+] Successfully created session.lock file!");
    } catch (error) {
        console.log("[+] Failed to create session.lock file with error: " + error);
        return;
    }
}

async function main() {

    try {
        fs.rmSync('./test/', { recursive: true })
    } catch { }

    // await GetXZChunkFile('./test files/AZ0Y0Z0ZIH');
    // await GetXZChunkFile('./test files/c.0.0.dat');

    // await IncludeMCFormatChunkFile('./test files/AZ0Y0Z0ZIH');
    // await IncludeMCFormatChunkFile('./test files/c.0.0.dat');

    console.log("==EAGERCRAFT==");
    let chunkDataE = await ConvertChunkDataFromFile('./test files/AZ0Y0Z0ZIH');
    await StoreChunkData(
        chunkDataE["folderPath"],
        chunkDataE["filename"],
        chunkDataE["fileContents"]
    );
    let lvlDataE = await ConvertlvlFile('./test files/lvl');
    await lvldatToOld(lvlDataE);

    console.log("==EAGERCRAFT==");
    console.log("===BETA-1.2===");
    let chunkDataB = await ConvertChunkDataFromFile('./test files/c.0.0.dat');
    await StoreChunkData(
        chunkDataB["folderPath"],
        chunkDataB["filename"],
        chunkDataB["fileContents"]
    );
    let lvlDataB = await ConvertlvlFile('./test files/level.dat');
    await lvldatToOld(lvlDataB);

    console.log("===BETA-1.2===");

    console.log("=SESSION.LOCK=");
    GenerateSessionLock();
    console.log("=SESSION.LOCK=");

    console.log("complete!!");
}

main();