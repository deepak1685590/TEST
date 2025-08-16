// JavaScript for the SmartSignal Chatbot UI

const GOOGLE_AI_API_KEY = "AIzaSyABOg8iFtaSrfQ6N8Z2KHghgvYCc8ix2h0";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_AI_API_KEY}`;

document.addEventListener('DOMContentLoaded', () => {
    const fab = document.getElementById('chatbot-fab');
    const chatWindow = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const chatForm = document.getElementById('chatbot-form');
    const chatInput = document.getElementById('chatbot-input');
    const messagesContainer = document.getElementById('chatbot-messages');

    // Toggle chat window visibility
    fab.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    // Handle form submission
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = chatInput.value.trim();
        if (messageText === '') return;

        addMessage(messageText, 'user-message');
        chatInput.value = '';

        getAiResponse(messageText);
    });

    async function getAiResponse(message) {
        addMessage("Thinking...", 'bot-message', true); // Add a temporary thinking message

        const payload = {
            contents: [{ parts: [{ text: message }] }]
        };

        try {
            const response = await axios.post(GEMINI_API_URL, payload);
            const botMessage = response.data.candidates[0].content.parts[0].text;

            const thinkingMessage = document.querySelector('.thinking');
            if (thinkingMessage) {
                thinkingMessage.querySelector('p').textContent = botMessage;
                thinkingMessage.classList.remove('thinking');
            } else {
                addMessage(botMessage, 'bot-message');
            }
        } catch (error) {
            console.error("Google AI Error:", error);
            const errorMessage = "Error: Could not connect to AI. Check API key or network.";
            const thinkingMessage = document.querySelector('.thinking');
            if (thinkingMessage) {
                thinkingMessage.querySelector('p').textContent = errorMessage;
                thinkingMessage.classList.remove('thinking');
            } else {
                addMessage(errorMessage, 'bot-message');
            }
        }
    }

    function addMessage(text, type, isThinking = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        if (isThinking) {
            messageElement.classList.add('thinking');
        }

        const p = document.createElement('p');
        p.textContent = text;
        messageElement.appendChild(p);

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});
