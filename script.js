// আপনার Firebase Config এখানে বসাতে হবে (Google Firebase থেকে নিয়ে)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// UI Elements
const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const joinBtn = document.getElementById('join-btn');
const roomPinInput = document.getElementById('room-pin');
const userNameInput = document.getElementById('user-name');
const errorMsg = document.getElementById('error-msg');
const displayPin = document.getElementById('display-pin');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const leaveBtn = document.getElementById('leave-btn');

let currentRoom = '';
let currentUser = '';

// Join Room Logic
joinBtn.addEventListener('click', () => {
    const pin = roomPinInput.value.trim();
    const name = userNameInput.value.trim();

    if (pin.length !== 4) {
        errorMsg.innerText = "পিন অবশ্যই ৪-সংখ্যার হতে হবে!";
        errorMsg.style.display = 'block';
        return;
    }
    if (name === '') {
        errorMsg.innerText = "আপনার নাম লিখতে হবে!";
        errorMsg.style.display = 'block';
        return;
    }

    currentRoom = pin;
    currentUser = name;
    
    // Switch Screen
    loginSection.classList.remove('active');
    chatSection.classList.add('active');
    displayPin.innerText = currentRoom;
    errorMsg.style.display = 'none';

    // Load Messages
    loadMessages();
});

// Send Message Logic
function sendMessage() {
    const text = messageInput.value.trim();
    if (text !== '') {
        const msgData = {
            name: currentUser,
            text: text,
            timestamp: Date.now()
        };
        // Firebase এ মেসেজ পাঠানো
        db.ref('chats/' + currentRoom).push(msgData);
        messageInput.value = '';
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Load Messages from Firebase in Real-time
function loadMessages() {
    chatBox.innerHTML = ''; // আগের মেসেজ ক্লিয়ার করা
    
    db.ref('chats/' + currentRoom).on('child_added', (snapshot) => {
        const data = snapshot.val();
        
        const msgDiv = document.createElement('div');
        // মেসেজটি আমার নাকি অন্যের তা চেক করা
        if (data.name === currentUser) {
            msgDiv.className = 'msg msg-me';
            msgDiv.innerHTML = `<span>${data.text}</span>`;
        } else {
            msgDiv.className = 'msg msg-other';
            msgDiv.innerHTML = `<span class="sender-name">${data.name}</span><span>${data.text}</span>`;
        }
        
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto scroll to bottom
    });
}

// Leave Room
leaveBtn.addEventListener('click', () => {
    // চ্যাট থেকে বেরিয়ে আসা
    db.ref('chats/' + currentRoom).off(); // লিসেনার বন্ধ করা
    currentRoom = '';
    chatSection.classList.remove('active');
    loginSection.classList.add('active');
    chatBox.innerHTML = '';
});
