const demoData = [

    {
        english:"Abamectin",
        chinese:"阿维菌素"
    },

    {
        english:"Glyphosate",
        chinese:"草甘膦"
    },

    {
        english:"Atrazine",
        chinese:"莠去津"
    },

    {
        english:"Paraquat",
        chinese:"百草枯"
    },

    {
        english:"Carbendazim",
        chinese:"多菌灵"
    }

];

const wordList=document.getElementById("wordList");

function render(data){

    wordList.innerHTML="";

    data.forEach(item=>{

        wordList.innerHTML+=`

        <div class="card">

            <div class="english"
            onclick="speak('${item.english}')">

            🔊 ${item.english}

            </div>

            <div class="chinese">

            ${item.chinese}

            </div>

        </div>

        `;

    });

}

render(demoData);

function speak(text){

    let speech=new SpeechSynthesisUtterance(text);

    speech.lang="en-US";

    speech.rate=0.9;

    speech.pitch=1;

    speechSynthesis.speak(speech);

}