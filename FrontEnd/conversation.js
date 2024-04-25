window.addEventListener("load", function (evt) {
    
    //Function for toggling menu visibility
    function toggleMenuButtons() {
        menuButtons.classList.toggle('open');
    }
    
    //Function to handle logout scenario
    function logOut() {
        //Removing session identifier
        sessionStorage.removeItem('sessionId');
        //Redirecting the user to the log in page
        window.location.href = 'signIn.html';
    }
    
    //Function to handle home page selection
    function goHome() {
        //Redirecting the user to the home page
        window.location.href = 'home.html';
    }
    
    //Function for sending a get conversation request to the API
    async function getConversation() {
        if(pid != null && cid != null) {
            try {
                //Building the request
                const getConversationResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/conversation?pid=${pid}&cid=${cid}`, {
                    method: 'GET'
                });
                
                //Checking the response for errors
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
                    //Assigning title to the page
                    title.innerHTML = conversationData.result.title;
                    //Checking if the conversation has more than 2 messages to see if the user has used it before
                    if(JSON.parse(conversationData.result.messages).length > 2) {
                        //Going over each message in the list returned
                        var messages = JSON.parse(conversationData.result.messages);
                        messages.forEach(item => {
                            if(item.id !== 1 && item.id !== 2) {
                                //Assigning properties from JSON to the HTML element
                                let role = item.role;
                                let text = item.content.replace(/\n/g, '<br>');;
                    
                                //Create HTML elements for each message object
                                let messageElement = document.createElement('div');
                                messageElement.innerHTML = `
                                    <div class="${role}-message">${text}</div>`;
                                //Add each message to the list
                                chatList.appendChild(messageElement);
                            }
                        });
                        //Scrolls to bottom of page if needed
                        window.scrollTo(0,document.body.scrollHeight);
                    } else {
                        //Creating suggestion message element
                        let messageElement = document.createElement('div');
                        messageElement.innerHTML = `
                            <div class="assistant-message">Please ask GuideGPT a question to begin the conversation. Examples of questions: <br>1.Can you tell me some interesing facts about the area? <br>2. What's the nearest train station to me? <br>3. Can you plan an itinerary for me to explore my location? 4. What activities are there to do in my area? <br>5. Can you tell me about the history of my area?</div>`;
                        //Adding suggestion message to the chat list
                        chatList.appendChild(messageElement);
                    }
                }else {
                    //Presenting errors to the user if they occur
                    alert("Error: " + conversationData.error);
                }
            } catch (error) {
                //Display error message to the user
                console.error('Error fetching data:', error);
            }
        }
    }
    
    //Function for sending a poll conversation request to the API
    async function pollConversation(pid, cid, timestamp){
        const interval = 2000;
        let conversationId = null;
        const polling = async () => {
            //Building the request
            try {
                const pollingResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/conversation?pid=${pid}&cid=${cid}&timestamp=${timestamp}`, {
                    method: 'GET'
                });
                //Added console log to ensure developer can check if polling is successfully recurring
                console.log('Polling Conversation Reply');
                
                //Checking the response for errors
                if (!pollingResponse.ok) {
                    throw new Error('Polling request failed');
                }

                const pollingData = await pollingResponse.json();
                if (pollingData.success) {
                    //Success flag received, stop polling and reload messages
                    getConversation();
                } else {
                    //Continuing polling if success is false
                    setTimeout(polling, interval);
                }
                
            } catch (error) {
                //Display error message to the user
                console.error('Polling failed:', error.message);
            }
        };
        // Start initial polling
        polling();
    }
    
    //Function for sending a send message request to the API
    async function sendMessage(userMessage) {
        try {
            //Building the request
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
            
            //Checking the response for errors
            if (!messageResponse.ok) {
                const errorMessage = await messageResponse.text();
                throw new Error(errorMessage);
            }
    
            const messageData = await messageResponse.json()
            if(messageData.success && messageData.timestamp != null) {
                //Assign the modification initialization timestamp if sent back by the API
                const timestamp = messageData.timestamp;
                if(timestamp != null) {
                    if(document.querySelector("#loading-icon") === null) {
                        //Creating a loading element while polling occurs
                        let loadingElement = document.createElement('div');
                        loadingElement.innerHTML = `
                            <div id="loading-icon" class="assistant-message">
                                <img src = "https://fgr11.brighton.domains/testing/guidegpt/images/spinninggear.gif" alt="Error Displaying Gif">
                            </div>`; 
                        //Adding loading element to message list
                        chatList.appendChild(loadingElement);
                        //Scrolling to the bottom of the page if needed
                        window.scrollTo(0,document.body.scrollHeight);
                        //Launching polling
                        pollConversation(pid, cid, timestamp);
                    }else {
                        //Display error to user if loading element is already present
                        alert("Message send Failed. Already sending message.");
                    }
                }else {
                    //Display error to user if timestamp is not found
                    alert("Message send Failed. No polling timestamp found.");
                }
            }else {
                //Presenting errors to the user if they occur
                alert("Error: " + messageData.error);
            }
            
            
        } catch (error) {
            // Display error message to the user
            console.error('Creation failed:', error.message);
            // You can modify HTML to display the error message to the user here
        }
    }
    
    //Function to handle send button actions
    async function handleSendMessage(event) {
        event.preventDefault();
        //Identifying message
        const userMessage = document.querySelector("#user-input").value;
        //Checking if PID and CID are present
        if(pid != null && cid != null) {
            //Checking user message has content
            if(userMessage != null && userMessage !== "") {
                //Reset chat box and launch send message request
                document.querySelector("#user-input").value = "";
                await sendMessage(userMessage);
            }else {
                //Display error to user if no message is found
                alert("No message to send.");
            }
        }else {
            //Display error to user if no PID or CID are found
            alert("Unable to retrieve session ID or conversation ID.");
        }
    };
    
    //Assigning divs and buttons to variables for targeted actions
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
    
    //Adding event listeners for dynamic functionality
    getConversation();
    icon.addEventListener('click', toggleMenuButtons);
    logOutButton.addEventListener ('click', logOut);
    homeButton.addEventListener ('click', goHome);
    sendChatButton.addEventListener ('click', handleSendMessage);
});
