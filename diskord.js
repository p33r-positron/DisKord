//usr/bin/env node
const child_process = require("node:child_process");
const path = require("node:path");
const url = require("node:url");
const os = require("node:os");
const fs = require("node:fs");
const readline = require("node:readline");

let plat = os.platform();
if(plat === "win32"){
	child_process.execSync("chcp 65001 > nul");
	
};

let cfg = fs.existsSync(path.join(__dirname, "config.json")) ? "config.json" : `config${plat}.json`;
const config = require(path.join(__dirname, cfg));

const rl = readline.createInterface({"input": process.stdin, "output": process.stdout});

/*
PLAN:

0. Help: diskord -h | diskord --help | diskord


1. Extract

diskord <base64file>
diskord -u urlList.txt -c "CHECKSUM"
diskord -u urlList.txt
diskord <options> -q

2. Intract

diskord -i MySuperArchive -z MyOGFile.zip [-b:exports to base64|-l exports to urllist + checksum]
*/

const help = `Usage: ("diskord" = "node diskord.js") (Put the flags in the order indicated here)

\tDOWNLOAD/EXTRACTION:

\t\tdiskord [-h|--help] -> Displays this.
\t\tdiskord <fileContainingBase64.diskord> -> Downloads, extracts and verify archive from base64 form.
\t\tdiskord -u <fileContainingUrlList.txt> -> Downloads and extracts archive from discord URLs.
\t\tdiskord -u <fileContainingUrlList.txt> -c <Checksum> -> Verify checksum after extraction. Only for -u option.
\t\tdiskord <options> -q -> Don't delete archive files after extraction

\tMAKING AN ARCHIVE:

\t\tdiskord -i <nameOfArchive> <options> -> Archive making form. Always start by diskord -i.
\t\tdiskord -i -z <nameOfArchive> <file> -> Splits file into multiple 25 Mo .zip files, uploadable on discord.
\t\tdiskord -i -n <nameOfArchive> <file> -> Splits file into multiple 500 Mo .zip files, uploadable on discord with nitro.
\t\tdiskord -i -b <urlListFile> <checksum> -> Converts URLList file and checksum into diskord archive.
`;

Array.prototype.last = function(){
	return this[this.length-1];
};

function errquit(msg){
	process.stderr.write(msg);
	process.exit(1);
};

function verifyURL(s){
	try {
		new url.URL(s);
		return 0;
	} catch(e){
		return 1;
	};
};

function verifyFormat(test){
	var err = 0;
	var splt = test.split('@');
	if(splt.length != 2) return false;
	var urllist = splt[0].split(';');
	var chksum = splt[1];
	for(u of urllist){
		err += verifyURL(u);
	};
	if(err){
		return false;
	} else {
		return {"urllist": urllist, "chksum": chksum};
	};
	
};

function downloadAll(urllist){
	var toDo = urllist.length;
	for(var i = 0 ; i < toDo ; i++){
		process.stdout.write(`[INFO] Starting to download file ${i+1}/${toDo}.\r`);
		child_process.execSync(
			config.downloadcmd
				.replace("%downloader%", config.downloader)
				.replace("%url%", urllist[i])
		);
	};
	return true;
};

function extract(firstfile){
	let cmd = config.unzipcmd
						.replace("%unzipper%", config.unzipper)
						.replace("%firstfile%", firstfile);
	child_process.execSync(cmd);
	return true;
};

function seek(firstfile){
	let cmd = config.seekcmd
					.replace("%seeker%", config.seeker)
					.replace("%firstfile%", firstfile);
	let x = child_process.execSync(cmd);
	return x.toString();
};

function getChecksum(file){
	let cmd = config.chkcmd
					.replace("%chker%", config.chker)
					.replace("%file%", file);
	let x = child_process.execSync(cmd);
	return x.toString();
};

function main(argc, argv){
	//0. Help
	let isHelp = ["-h","--help"].includes(argv[2]);
	if(argc <= 2){
		errquit(help);
	} else if(isHelp) {
		console.log(help);
		return;
	}
	
	//1 & 2
	switch(argv[2])
	{
		case "-i": //2. Intract / Make a Diskord Archive
			if(argv.length < 6){
				errquit(help);
			};
			if(['-z','-n'].includes(argv[3])){
				let size = argv[3] === '-z' ? 25 : 500;
				let name = argv[4];
				let file = argv[5];
				
				console.log("[INFO] Making the diskord archive...")
				let cmd = config.zipcmd
								.replace("%zipper%", config.zipper)
								.replace("%size%", String(size))
								.replace("%name%", name)
								.replace("%file%", file);
				let x = child_process.execSync(cmd);
				console.log("[INFO] Diskord archive done. Now upload the files to discord.")
				process.exit(0);
			} else if(argv[3] === '-b'){
				let chksum = argv[5];
				console.log("[INFO] Opening URL List file...");
				let urllist = fs.readFileSync(argv[4], "utf-8");
				if(urllist.indexOf(';') == -1){
					urllist = urllist.replaceAll('\n', ';');
				};
				urllist = urllist.concat("@"+chksum);
				console.log("[INFO] Convereting to Base64...");
				let output = btoa(urllist);
				let outputFile = argv[4].slice(-4) === ".txt" ? argv[4].slice(0,-4).concat(".diskord") : argv[4].concat(".diskord");
				console.log("[INFO] Writing to .diskord file...");
				fs.writeFileSync(outputFile, output, "utf-8");
				console.log("[INFO] Everything done !");
				process.exit(0);
			} else {
				errquit(help);
			};
			break;
		case "-u": //1 -> URL List
			var file = fs.readFileSync(argv[2], "utf-8");
			var urllist = file.split(/;|\n/);
			var checksum = 0;
			if(typeof argv[3] !== "undefined" && argv[3] == "-c"){
				if(typeof argv[4] !== "undefined")
					checksum = argv[4].replaceAll('"','');
				else
					console.log("[WARNING] No checksum specified with -c option. File integrity check won't be made.");
			};
			let errlvl = 0;
			for(u of urllist){
				errlvl += verifyURL(u);
			};
			if(errlvl !== 0){
				errquit(`Found ${errlvl} Invalid URL${errlvl > 1 ? 's' : ''} in URL List File.`);
			};
			console.log("[INFO] Starting Download process");
			downloadAll(urllist);
			console.log("\n[INFO] Download process done");
			console.log("[INFO] Starting to extract");
			console.log("[COMMENT] Reminder: If the extraction is taking too long compared with file's size, it might be an error on the extractor prorgam (E.g. 'Do you want to overwrite ?'). In this case try to extract the file yourself.");
			let ff = urllist[0].split('/').last();
			extract(ff);
			console.log("[INFO] Finished to extract");
			let name = seek(ff);
			console.log(`[INFO] File has been extracted to ${path.join(__dirname, name)}`);
			if(checksum !== 0){
				console.log("[INFO] Verifying checksum");
				let chk = getChecksum(name).replace(/\r|\n|\t| /igm, '') === checksum;
				console.log(
					chk
						? "[INFO] SHA256 Checksum is valid. File integrity has been verified."
						: "[WARNING] SHA256 Checksum is invalid. File may be corrupted."
				);
			};
			if(!argv.includes('-q')){
				console.log("[INFO] No -q option detected, deleting files...");
				child_process.execSync(config.deletecmd.replace("%basefile%", urllist[0].split('/').last().slice(0,-4).concat('*')));
				console.log("[INFO] Archive files have been deleted.");
			};
			console.log("[INFO] Operation done with success.");
			rl.question("\r\nPress enter key to exit . . . ", function(){process.exit(0);});
			break;
		default: //1 -> Base64
			try{
				var code64 = fs.readFileSync(argv[2], "utf-8");
				var comp = atob(code64);
				var uned = verifyFormat(comp);
				if(uned === false){
					throw "computer through the window";
				};
				console.log("[INFO] Starting Download process");
				downloadAll(uned.urllist);
				console.log("\n[INFO] Download process done");
				console.log("[INFO] Starting to extract");
				console.log("[COMMENT] Reminder: If the extraction is taking too long compared with file's size, it might be an error on the extractor prorgam (E.g. 'Do you want to overwrite ?'). In this case try to extract the file yourself.");
				let ff = uned.urllist[0].split('/').last();
				extract(ff);
				console.log("[INFO] Finished to extract");
				let name = seek(ff);
				console.log(`[INFO] File has been extracted to ${path.join(__dirname, name)}`);
				console.log("[INFO] Verifying checksum");
				let chk = getChecksum(ff).replace(/\r|\n|\t| /igm, '') === uned.chksum;
				console.log(
					chk
						? "[INFO] SHA256 Checksum is valid. File integrity has been verified."
						: "[WARNING] SHA256 Checksum is invalid. File may be corrupted."
				);
				if(!argv.includes('-q')){
					console.log("[INFO] No -q option detected, deleting files...");
					child_process.execSync(config.deletecmd.replace("%basefile%", uned.urllist[0].split('/').last().slice(0,-4).concat('*')));
					console.log("[INFO] Archive files have been deleted.");
				};
				rl.question("\r\nPress enter key to exit . . . ", function(){process.exit(0);});
			} catch(e){
				//For debug, uncomment if you think that it is not unvalid base64.
				//console.log(e);
				errquit("Error, probably invalid base 64.");
			};
	}
};

main(process.argv.length, process.argv);