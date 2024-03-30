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
                const getConversationResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/conversation?pid=${pid}&cid=${cid}`, {
                    method: 'GET'
                });
                
                if (!getConversationResponse.ok) {
                    const errorMessage = await getConversationResponse.text();
                    throw new Error(errorMessage);
                }
                
                const conversationData = await getConversationResponse.json();
                
                //Remove all pre-existing conversations
                while (chatList.firstChild) {
                    chatList.removeChild(chatList.firstChild);
                }

                if(conversationData.success && conversationData.result != null && conversationData.result.title != null && conversationData.result.messages != null && JSON.parse(conversationData.result.messages).length > 0) {
                    title.innerHTML = conversationData.result.title;
                    var messages = JSON.parse(conversationData.result.messages);
                    messages.forEach(item => {
                        if(item.id !== 1 && item.id !== 2) {
                            let role = item.role;
                            let text = item.content;
                    
                            // Create HTML elements for each conversation object
                            let messageElement = document.createElement('div');
                            messageElement.innerHTML = `
                            <div class="${role}-message">${text}</div>`;
                            chatList.appendChild(messageElement);
                        }
                    });
                }else {
                    alert("Function Failure");
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    }
    
    async function pollConversation(pid, cid, timestamp){
        const interval = 2000;
        let conversationId = null;
        const polling = async () => {
            try {
                const pollingResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/conversation?pid=${pid}&cid=${cid}&timestamp=${timestamp}`, {
                    method: 'GET'
                });
                console.log('Polling Conversation Reply');
                
                if (!pollingResponse.ok) {
                    throw new Error('Polling request failed');
                }

                const pollingData = await pollingResponse.json();
                if (pollingData.success) {
                    // Conversation ID received, stop polling
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
    
    async function sendMessage(userMessage) {
        try {
            const messageResponse = await fetch('https://fgr11.brighton.domains/testing/guidegpt/api.php/conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "pid": pid,
                    "cid": cid,
                    "message": userMessage
                })
            });
    
            if (!messageResponse.ok) {
                const errorMessage = await messageResponse.text();
                throw new Error(errorMessage);
            }
    
            const messageData = await messageResponse.json()
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
        const userMessage = document.querySelector("#user-input").value;
        if(pid != null && cid != null) {
            if(userMessage != null && userMessage !== ""){
                //testing polling issue
                //pollConversation(pid, cid, 1711648362);
                await sendMessage(userMessage);
            }else {
                alert("No message to send.");
            }
        }else {
            alert("Unable to retrieve session ID.");
        }
    };
    
    const pid = parseInt(sessionStorage.getItem('sessionId'));
    const params = (new URL(document.location)).searchParams;
    const cid = params.get("cid");
    const chatList = document.querySelector("#chatList");
    const icon = document.querySelector('.icon');
    const menuButtons = document.querySelector('.menuButtons');
    const logOutButton = document.querySelector("#logOut");
    const homeButton = document.querySelector("#home");
    const title = document.querySelector(".title");
    const sendChatButton = document.querySelector("#send-button");
    
    getConversation();
    icon.addEventListener('click', toggleMenuButtons);
    logOutButton.addEventListener ('click', logOut);
    homeButton.addEventListener ('click', goHome);
    sendChatButton.addEventListener ('click', handleSendMessage);
});
