// টোকেন সিকিউরিটি: ব্রাউজার থেকে টোকেন নেওয়া হবে, কোডে সেভ থাকবে না
let HF_TOKEN = sessionStorage.getItem("hfToken");
if (!HF_TOKEN) {
    HF_TOKEN = prompt("দয়া করে আপনার Hugging Face Token দিন (এটি শুধু আপনার ব্রাউজারেই সেভ থাকবে):");
    if(HF_TOKEN) {
        sessionStorage.setItem("hfToken", HF_TOKEN.trim());
    } else {
        alert("টোকেন ছাড়া অ্যাসিস্ট্যান্ট কাজ করবে না। পেজ রিফ্রেশ করে টোকেন দিন।");
    }
}

const MODEL_URL = "https://api-inference.huggingface.co/models/google/gemma-4-31b-it";

const micBtn = document.getElementById('mic-btn');
const statusText = document.getElementById('status');
const userText = document.getElementById('user-text');
const aiText = document.getElementById('ai-text');

let isListening = false;
let recognition;

// Speech Recognition Setup (শোনার জন্য)
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'bn-IN'; // বাংলা ভাষা
} else {
    alert("আপনার ব্রাউজার Speech Recognition সাপোর্ট করে না। দয়া করে Chrome ব্যবহার করুন।");
}

// Assistant Voice Setup (বলার জন্য)
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-IN'; 
    utterance.rate = 1.1; 
    window.speechSynthesis.speak(utterance);
}

// Brain of Raj - Calling Gemma 4 API
async function getAIResponse(promptText) {
    statusText.innerText = "Raj ভাবছে...";
    try {
        const response = await fetch(MODEL_URL, {
            headers: { 
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `<start_of_turn>user\nতোমার নাম রাজ (Raj)। তুমি একজন অত্যন্ত বুদ্ধিমান AI অ্যাসিস্ট্যান্ট। তোমার ডেভেলপার বা স্রষ্টা হলো Soumik De। তুমি সবসময় সংক্ষেপে এবং সুন্দর শুদ্ধ বাংলায় উত্তর দেবে। ব্যবহারকারীর প্রশ্ন: ${promptText}<end_of_turn>\n<start_of_turn>model\n`,
                parameters: {
                    max_new_tokens: 500,
                    temperature: 0.7
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        let reply = result[0]?.generated_text || result?.generated_text || "দুঃখিত, আমি বুঝতে পারিনি।";
        
        // পরিষ্কার উত্তরের জন্য ফরম্যাটিং (মডেলের প্রম্পট অংশটুকু বাদ দেওয়া)
        if (reply.includes("model\n")) {
            reply = reply.split("model\n")[1];
        }
        reply = reply.replace(/[#*]/g, "").trim();

        aiText.innerText = reply;
        aiText.style.display = 'block';
        statusText.innerText = "Raj শুনছে (Wake word: Raj)";
        
        speak(reply);
    } catch (error) {
        console.error("Error:", error);
        if(error.message.includes("401")) {
            statusText.innerText = "টোকেন ভুল হয়েছে!";
            speak("আপনার দেওয়া টোকেনটি ভুল। পেজ রিফ্রেশ করে আবার দিন।");
            sessionStorage.removeItem("hfToken"); // ভুল টোকেন মুছে ফেলা
        } else {
            statusText.innerText = "সার্ভার এরর!";
            speak("দুঃখিত, সার্ভারের সাথে সংযোগ করতে পারছি না।");
        }
    }
}

// Voice Command Logic with Wake Word 'Raj'
recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("Input:", transcript);

    // Wake word 'Raj' বা 'রাজ' চেক করা
    if (transcript.includes("রাজ") || transcript.includes("raj")) {
        let command = transcript.replace(/রাজ|raj/g, "").trim();
        
        if (command.length > 1) {
            userText.innerText = "আপনি বললেন: " + command;
            userText.style.display = 'block';
            getAIResponse(command);
        } else {
            speak("হ্যাঁ বলুন, আমি রাজ। আপনাকে কীভাবে সাহায্য করতে পারি?");
            statusText.innerText = "আমি শুনছি...";
        }
    }
};

// Continuous Listening Logic
recognition.onend = () => {
    if (isListening) recognition.start();
};

// Start/Stop Microphone
micBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
        isListening = true;
        micBtn.classList.add('listening');
        statusText.innerText = "রাজ অ্যাক্টিভ! 'রাজ' বলে কথা শুরু করুন...";
        speak("সিস্টেম অনলাইন হয়েছে।");
    } else {
        recognition.stop();
        isListening = false;
        micBtn.classList.remove('listening');
        statusText.innerText = "সিস্টেম অফলাইন। চালু করতে ক্লিক করুন।";
    }
});
