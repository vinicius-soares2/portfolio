const drop=document.getElementById("drop");
const fileInput=document.getElementById("file");
const logBox=document.getElementById("log");
const progress=document.getElementById("progress");

drop.onclick=()=>fileInput.click();

drop.ondrop=e=>{
    e.preventDefault();
    fileInput.files=e.dataTransfer.files;
    log(`[+] ${fileInput.files.length} arquivos carregados`);
};

drop.ondragover=e=>e.preventDefault();

function log(msg){
    logBox.innerHTML+=msg+"<br>";
    logBox.scrollTop=99999;
}

/* -------- KEY -------- */
async function getKey(password){
    const enc=new TextEncoder();
    const material=await crypto.subtle.importKey("raw",enc.encode(password),{name:"PBKDF2"},false,["deriveKey"]);
    return crypto.subtle.deriveKey(
        {name:"PBKDF2",salt:enc.encode("arakawa"),iterations:100000,hash:"SHA-256"},
        material,
        {name:"AES-GCM",length:256},
        false,
        ["encrypt","decrypt"]
    );
}

/* -------- PROCESS -------- */
async function process(mode){
    const pass=password.value;
    if(!fileInput.files.length||!pass) return;

    log("[+] derivando chave...");
    const key=await getKey(pass);

    const zip=new JSZip();
    let i=0;

    for(const file of fileInput.files){

        log(`[+] processando ${file.name} ...`);

        const buffer=new Uint8Array(await file.arrayBuffer());

        if(mode==="enc"){
            const iv=crypto.getRandomValues(new Uint8Array(12));
            const enc=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,buffer);

            const result=new Uint8Array(iv.length+enc.byteLength);
            result.set(iv);
            result.set(new Uint8Array(enc),12);

            zip.file(file.name+".enc",result);

        }else{
            const iv=buffer.slice(0,12);
            const data=buffer.slice(12);
            const dec=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,data);

            zip.file(file.name.replace(".enc",""),dec);
        }

        i++;
        progress.value=(i/fileInput.files.length)*100;
    }

    log("[✓] gerando zip...");
    const blob=await zip.generateAsync({type:"blob"});

    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="resultado.zip";
    a.click();

    log("[✓] concluído!");
}

function encryptAll(){process("enc")}
function decryptAll(){process("dec")}