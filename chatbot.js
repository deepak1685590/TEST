// JavaScript for the SmartSignal Chatbot UI

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

        // Add user's message to the chat
        addMessage(messageText, 'user-message');

        // Clear the input
        chatInput.value = '';

        // Placeholder for bot response
        setTimeout(() => {
            addMessage('I am a UI placeholder. My AI brain is not connected yet!', 'bot-message');
        }, 1000);
    });

    function addMessage(text, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);

        const p = document.createElement('p');
        p.textContent = text;
        messageElement.appendChild(p);

        messagesContainer.appendChild(messageElement);

        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});
