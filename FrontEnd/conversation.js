window.addEventListener("load", function (evt) {
    
    //Toggles menu button visibility
    function toggleMenuButtons() {
        menuButtons.classList.toggle('open');
    }
    
    // Handling logout scenario
    function logOut() {
        sessionStorage.removeItem('sessionId');
        // Redirecting the user to the log in page
        window.location.href = 'signIn.html';
    }
    
    // Handling logout scenario
    function goHome() {
        // Redirecting the user to the home page
        window.location.href = 'home.html';
    }
    
    async function getConversation() {
        if(pid != null && cid != null) {
            try {
                const getConversationResponse = await fetch(`www.something.com/conversation?pid=${pid}&cid=${cid}`, {
                    method: 'GET'
                });
                const conversationData = await getConversationResponse.json();

                //Remove all pre-existing messages
                while (chatList.firstChild) {
                    chatList.removeChild(chatList.firstChild);
                }
                
                conversationData.forEach(item => {
                    let type = item.type;
                    let text = item.text;
                    
                    // Create HTML elements for each conversation object
                    let messageElement = document.createElement('div');
                    messageElement.innerHTML = `
                    <div class="${type}">${text}</div>`; 
                    chatList.appendChild(messageElement);
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }else {
            alert("Unable to retrieve session ID.");
        }
    }
    
    async function pollConversation(pid, cid, timestamp){
        const interval = 5000;
        let conversationId = null;
        const polling = async () => {
            try {
                const pollingResponse = await fetch(`www.something.com/conversation?pid=${pid}&cid=${cid}&timestamp=${timestamp}`, {
                    method: 'GET'
                });
                
                if (!pollingResponse.ok) {
                    throw new Error('Polling request failed');
                }

                const pollingData = await pollingResponse.json();
                if (pollingData.conversationId) {
                    // Conversation ID received, stop polling
                    conversationId = pollingData.conversationId;
                    console.log('Received conversation ID:', conversationId);
                    getConversation();
                } else {
                    // No conversation ID yet, continue polling
                    setTimeout(polling, interval);
                }
                
            } catch (error) {
                console.error('Polling failed:', error.message);
                // Retry polling or handle error as needed
            }
        };
        // Start initial polling
        polling();
    }
    
    async function sendMessage(pid, cid, userMessage) {
        try {
            const messageResponse = await fetch('www.something.com/conversation?pid=' + pid + '&cid=' + cid, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "message": userMessage
                })
            });
    
            if (!messageResponse.ok) {
                const errorMessage = await messageResponse.text();
                throw new Error(errorMessage);
            }
    
            const messageData = await messageResponse.json();
            //Assign the creation initialization timestamp if sent back by the api
            const timestamp = messageData.timestamp;
            if(timestamp != null){
                pollConversation(pid, cid, timestamp);
            }else {
                 alert("Message send Failed. No polling timestamp found.");
            }
            
            
        } catch (error) {
            // Display error message to the user
            console.error('Creation failed:', error.message);
            // You can modify HTML to display the error message to the user here
        }
    }
    
    async function handleSendMessage(event) {
        event.preventDefault(); // Prevent default form submission
                if(pid != null && cid != null) {
            if(userMessage != null && userMessage !== ""){
                await sendMessage(pid, cid, userMessage);
            }else {
                alert("No message to send.");
            }
        }else {
            alert("Unable to retrieve session ID.");
        }
    };
    
    const pid = sessionStorage.getItem('sessionId');
    const chatList = document.querySelector("#chat-container");
    const icon = document.querySelector('.icon');
    const menuButtons = document.querySelector('.menuButtons');
    const logOutButton = document.querySelector("#logOut");
    const homeButton = document.querySelector("#home");
    const sendChatButton = document.querySelector("#send-button");
    const userMessage = document.querySelector("#user-input").value;
    const params = (new URL(document.location)).searchParams;
    const cid = params.get("cid");
    
    getConversation();
    icon.addEventListener('click', toggleMenuButtons);
    logOutButton.addEventListener ('click', logOut);
    homeButton.addEventListener ('click', goHome);
    sendChatButton.addEventListener ('click', handleSendMessage);
});
