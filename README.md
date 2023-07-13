# DisKord
Always wanted to upload files bigger than 25Mo/500Mo on Discord ? I present to you DisKord !

## How to use it

Just drag and drop a `.diskord` file on diskord.exe, or use `node diskord.js <file.diskord>`. Use --help to know more.  

### How to use it - Config

There are two config files that are given with DisKord, `configwin32.json` and `configlinux.json`.  
By default, DisKord will use config.json, and if it does not find it, it will use configPLATFORM.json where PLATFORM is one of these values:  
`'aix', 'darwin', 'freebsd','linux', 'openbsd', 'sunos', 'win32'`  
If you use Microsoft Windows, I recommend using `DisKord_win32_7za_wget` which gives you everything you need.  
If you use GNU/Linux, you should either install p7zip or modify the config.  
You can modify the config, e.g. to replace wget by curl or 7zip by something else.  

## How it works

A `.diskord` file just contains base64 text in this form:  
`URL1;URL2;URL3;...@checksum` where all URL are discord URLs (or not, feel free to use it with other file hosts)  
Important: Use the .zip.00X format (Right Click -> 7-Zip -> Add to archive...), for some reason, WinRAR way doesn't work.  
Since it uses a checksum, a diskord archive must contain only one file. If you want more, ZIPception.  

## How to make a diskord archive with DisKord

There are 5 steps in making a diskord archive:  
1) Splitting the file into 25 Mo / 500 Mo .zip files
2) Uploading the files on Discord
3) Getting the links out of Discord
4) Getting the checksum of the file
5) Compiling the links and the checksum into a .diskord file

Diskord helps for the steps 1 and 4 (See node diskord.js --help).  
I can't upload the files for you, but remember you can only upload 10 files per message (=250Mo or 5Go per message)  
Getting the links out of Discord is pretty bothering, but it would require a Discord script to automatise it.  
But you can still do it on browser version of Discord:  
  
1) Create a group with no one but you (Invite 2 friends and kick them) or create an empty channel on a server.
2) Upload all your files there
3) Open the console (Ctrl+Shift+I)
4) Enter this:
```javascript
var files = document.getElementsByClassName("filenameLinkWrapper-3Rc6sk");
var e = "";
for(var i = 0 ; i < files.length ; i++){
e += files[i].childNodes[0].href + ";"
}
alert(e);
```

**VERY IMPORTANT**: The first URL of the URLlist you will make the DisKord archive from must be the first file (.zip.001). And thus, if you use the script above, make sure to upload the first .zip.001 file part before everything else.  

# Q & A

## Where was my file downloaded ?

It is written on the terminal before exitting.  

## What does the [COMMENT] in extracting means ?

If you've already downloaded a file and you haven't moved it/deleted it from the DisKord directory,  
Trying to download it again (If you use 7-Zip at least) will make 7-Zip ask the user a prompt for overwrite  
And this will make the child process bug or something, just don't do it.  
