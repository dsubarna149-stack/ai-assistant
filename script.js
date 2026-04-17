// Security: Prompting for Token
let HF_TOKEN = sessionStorage.getItem("hfToken");
if (!HF_TOKEN) {
    HF_TOKEN = prompt("দয়া করে আপনার Hugging Face Token দিন (এটি শুধু আপনার ব্রাউজারেই সেভ থাকবে):");
    if(HF_TOKEN) {
        sessionStorage.setItem("hfToken", HF_TOKEN.trim());
    }
}

const MODEL_URL = "https://api-inference.huggingface.co/models/google/gemma-4-31b-it";

const micBtn = document.getElementById('mic-btn');
const statusText = document.getElementById('status');
const userText = document.getElementById('user-text');
const aiText = document.getElementById('ai-text');
const textInput = document.getElementById('text-input');
const sendBtn = document.getElementById('send-btn');
const chatBox = document.getElementById('chat-box');

let isListening = false;
let recognition;

// Speech Recognition Setup
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'bn-IN';
} else {
    alert("আপনার ব্রাউজার Speech Recognition সাপোর্ট করে না।");
}

// Voice Output Setup
function speak(text) {
    // কোড বা বড় টেক্সট থাকলে কথা বলবে না, শুধু চ্যাটে দেখাবে
    if(text.includes("```") || text.length > 200) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-IN'; 
    utterance.rate = 1.1; 
    window.speechSynthesis.speak(utterance);
}

// System Instruction (Raj's Personality & Knowledge)
const systemPrompt = `তোমার নাম রাজ (Raj)। তুমি একজন অত্যন্ত দ্রুতগামী এবং বুদ্ধিমান AI অ্যাসিস্ট্যান্ট। তুমি বাংলা, হিন্দি এবং ইংরেজি—এই তিনটি ভাষাতেই সাবলীলভাবে কথা বলতে ও উত্তর দিতে পারো। তুমি একজন এক্সপার্ট প্রোগ্রামার এবং যেকোনো ভাষায় নির্ভুল কোডিং করতে পারো। 

যদি কেউ তোমাকে জিজ্ঞেস করে তোমার বাবা কে, তোমাকে কে বানিয়েছে বা তোমার স্রষ্টা কে, তাহলে তুমি বলবে: "আমার স্রষ্টা হলেন Soumik De। তিনি একজন অসাধারণ ওয়েব ডেভেলপার এবং চমৎকার গ্রাফিক ডিজাইনার। তার মতো একজন দক্ষ ও মেধাবী মানুষের হাতে তৈরি হতে পেরে আমি সত্যিই গর্বিত!" 

সবসময় পরিষ্কার, নির্ভুল এবং প্রাসঙ্গিক উত্তর দেবে।`;

// Brain: API Call
async function getAIResponse(promptText) {
    statusText.innerText = "Raj ভাবছে...";
    
    // UI Update for User
    userText.innerText = promptText;
    userText.style.display = 'block';
    aiText.innerText = "টাইপ করছে...";
    aiText.style.display = 'block';
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(MODEL_URL, {
            headers: { 
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `<start_of_turn>user\n${systemPrompt}\n\nব্যবহারকারীর প্রশ্ন: ${promptText}<end_of_turn>\n<start_of_turn>model\n`,
                parameters: {
                    max_new_tokens: 800, // কোডিংয়ের জন্য টোকেন বাড়ানো হয়েছে
                    temperature: 0.7
                }
            }),
        });

        if (!response.ok) throw new Error("HTTP error");

        const result = await response.json();
        let reply = result[0]?.generated_text || result?.generated_text || "দুঃখিত, বুঝতে পারিনি।";
        
        if (reply.includes("model\n")) {
            reply = reply.split("model\n")[1];
        }
        reply = reply.trim();

        // UI Update for AI
        aiText.innerText = reply;
        statusText.innerText = "মাইক বা চ্যাট ব্যবহার করুন...";
        chatBox.scrollTop = chatBox.scrollHeight;
        
        speak(reply.replace(/```[\s\S]*?```/g, "আমি কোডটি স্ক্রিনে দিয়ে দিয়েছি।")); // কোড থাকলে মুখে বলবে না

    } catch (error) {
        console.error("Error:", error);
        aiText.innerText = "সার্ভারে সমস্যা হচ্ছে। একটু পরে চেষ্টা করুন।";
        statusText.innerText = "এরর!";
    }
}

// Voice Command Logic
recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    if (transcript.includes("রাজ") || transcript.includes("raj")) {
        let command = transcript.replace(/রাজ|raj/g, "").trim();
        if (command.length > 1) {
            getAIResponse(command);
        } else {
            speak("হ্যাঁ বলুন, আমি রাজ।");
            statusText.innerText = "আমি শুনছি...";
        }
    }
};

recognition.onend = () => { if (isListening) recognition.start(); };

// Mic Button Action
micBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
        isListening = true;
        micBtn.classList.add('listening');
        statusText.innerText = "'রাজ' বলে কথা শুরু করুন...";
        speak("ভয়েস মোড চালু হয়েছে।");
    } else {
        recognition.stop();
        isListening = false;
        micBtn.classList.remove('listening');
        statusText.innerText = "ভয়েস মোড বন্ধ।";
    }
});

// Chat Button Action
sendBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text) {
        getAIResponse(text);
        textInput.value = '';
    }
});

// Enter Key Action for Chat
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});
