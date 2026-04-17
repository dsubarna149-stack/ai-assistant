// Firebase Configuration (Updated with Database URL)
const firebaseConfig = {
  apiKey: "AIzaSyDGSdb35nB5ArKxB1hjCBFFXC7ahKna_eI",
  authDomain: "secretchat-51403.firebaseapp.com",
  databaseURL: "https://secretchat-51403-default-rtdb.firebaseio.com/", // এটি যোগ করা হয়েছে
  projectId: "secretchat-51403",
  storageBucket: "secretchat-51403.firebasestorage.app",
  messagingSenderId: "170278237183",
  appId: "1:170278237183:web:4877ec627a2f9a36caadca",
  measurementId: "G-DHS1L8BY1F"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const joinBtn = document.getElementById('join-btn');
const roomPinInput = document.getElementById('room-pin');
const userNameInput = document.getElementById('user-name');
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
    if (pin.length === 4 && name !== '') {
        currentRoom = pin;
        currentUser = name;
        loginSection.classList.remove('active');
        chatSection.classList.add('active');
        displayPin.innerText = currentRoom;
        
        // পুরানো লিসেনার থাকলে বন্ধ করা
        db.ref('chats/' + currentRoom).off();
        loadMessages();
    } else {
        alert("দয়া করে ৪ সংখ্যার পিন এবং আপনার নাম দিন।");
    }
});

// Send Message Logic
function sendMessage() {
    const text = messageInput.value.trim();
    if (text !== '' && currentRoom !== '') {
        db.ref('chats/' + currentRoom).push({
            name: currentUser,
            text: text,
            timestamp: Date.now()
        }).then(() => {
            console.log("Message sent successfully");
        }).catch((error) => {
            console.error("Error sending message: ", error);
            alert("মেসেজ পাঠানো যায়নি! Rules চেক করুন।");
        });
        messageInput.value = '';
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// Load Messages in Real-time
function loadMessages() {
    chatBox.innerHTML = '';
    db.ref('chats/' + currentRoom).on('child_added', (snapshot) => {
        const data = snapshot.val();
        const msgDiv = document.createElement('div');
        
        if (data.name === currentUser) {
            msgDiv.className = 'msg msg-me';
            msgDiv.innerHTML = `<span>${data.text}</span>`;
        } else {
            msgDiv.className = 'msg msg-other';
            msgDiv.innerHTML = `<span class="sender-name">${data.name}</span><span>${data.text}</span>`;
        }
        
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

leaveBtn.addEventListener('click', () => { 
    if(currentRoom) db.ref('chats/' + currentRoom).off();
    location.reload(); 
});
