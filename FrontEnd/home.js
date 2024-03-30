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
    
    // Open conversation creation window
    function openCreationWindow() {
        creationWindow.style.display = "block";
    }
    
    // Open conversation deletion window
    function openDeletionWindow() {
        deletionCid = event.target.parentElement.id;
        deletionWindow.style.display = "block";
    }
    
    // Close conversation creation window
    function closeCreationWindow() {
        creationWindow.style.display = "none";
        creationHint.style.display = "none";
    }
    
    // Close conversation deletion window
    function closeDeletionWindow() {
        deletionWindow.style.display = "none";
    }
    
    // Close all pop up windows
    function closeWindows(event) {
        if (event.target == creationWindow) {
            creationWindow.style.display = "none";
            creationHint.style.display = "none";
        }
    }

    function handleChatButton() {
        const cid = event.target.parentElement.id;
        if (cid != null && cid !== "" && pid != null) {
            window.location.href = 'conversation.html?cid=' + cid;
        }else {
            alert("Unable to retrieve session ID or conversation ID.");
        }
    }
    
    async function getConversations() {
        if(pid != null) {
            try {
                listConversationResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/home?pid=${pid}`, {
                    method: 'GET'
                });

                if (!listConversationResponse.ok) {
                    const errorMessage = await listConversationResponse.text();
                    throw new Error(errorMessage);
                }
            
                const listConversationData = await listConversationResponse.json();
                //Remove all pre-existing conversations
                while (conversationList.firstChild) {
                    conversationList.removeChild(conversationList.firstChild);
                }
                
                if (listConversationData != null && listConversationData.results != null && listConversationData.results.length > 0) {
                    listConversationData.results.forEach(item => {
                        let conversationTitle = item.title;
                        let conversationId = item.cid;
                    
                        // Create HTML elements for each conversation object
                        let conversationElement = document.createElement('div');
                        conversationElement.innerHTML = `
                        <div class="conversation" id="${conversationId}">
                            <h2 class="conversation-title">${conversationTitle}</h2>
                            <button class="chat-button">Chat</button>
                            <button class="delete-conversation-button">Delete Conversation</button>
                        </div>`; 
                        conversationList.appendChild(conversationElement);
                    });
                    // Attach event listeners outside the loop
                    const chatButtons = document.querySelectorAll('.chat-button');
                    chatButtons.forEach(button => {
                        button.addEventListener('click', handleChatButton);
                    });

                    const deleteConversationButtons = document.querySelectorAll('.delete-conversation-button');
                    deleteConversationButtons.forEach(button => {
                        button.addEventListener('click', openDeletionWindow);
                    });
                } else {
                    let bodyElement = document.createElement('div');
                    bodyElement.innerHTML = 
                    `<h3 class="noConversationsMessage">No Conversations Found. Create one using the menu at the top right!</h2>`; 
                    conversationList.appendChild(bodyElement);
                }
            } catch (error) {
                console.error('Error fetching data:', JSON.stringify(error));
            }
        }else {
            alert("Unable to retrieve session ID.");
        }
    }
    
    async function deleteConversation() {
        event.preventDefault(); // Prevent default form submission
        if (deletionCid != null && deletionCid !== "") {
            try {
                const deletionResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/home?pid=${pid}&cid=${deletionCid}`, {
                    method: 'DELETE'
                });
                const deletionData = await deletionResponse.json();
                
                if(deletionData.success) {
                    deletionCid = "";
                    deletionWindow.style.display = "none";
                    getConversations();
                }
            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }else {
            alert("Unable to retrieve session ID or conversation ID.");
        }
    }

    
    async function pollConversation(pid, timestamp){
        const interval = 2000;
        let conversationId = null;
        const polling = async () => {
            try {
                const pollingResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/home?pid=${pid}&timestamp=${timestamp}`, {
                    method: 'GET'
                });
                console.log('Polling Conversation Creation');
                
                if (!pollingResponse.ok) {
                    throw new Error('Polling request failed');
                }

                const pollingData = await pollingResponse.json();
                if (pollingData.success) {
                    // Success flag received, stop polling and reload conversations
                    getConversations();
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
    
    async function createConversation(pid, title, latitude, longitude) {
        try {
            const creationResponse = await fetch('https://fgr11.brighton.domains/testing/guidegpt/api.php/home', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "pid": pid,
                    "title": title,
                    "latitude": latitude,
                    "longitude": longitude
                })
            });
    
            if (!creationResponse.ok) {
                const errorMessage = await creationResponse.text();
                throw new Error(errorMessage);
            }
    
            const creationData = await creationResponse.json();
            //Assign the creation initialization timestamp if sent back by the api
            const timestamp = creationData.timestamp;
            if(timestamp != null){
                pollConversation(pid, timestamp);
            }else {
                 alert("Creation Failed. No polling timestamp found.");
            }
            
            
        } catch (error) {
            // Display error message to the user
            console.error('Creation failed:', error.message);
            // You can modify HTML to display the error message to the user here
        }
    }
    
    async function handleCreationSubmit(event) {
        event.preventDefault(); // Prevent default form submission
        const title = document.querySelector("#title").value;
        const useLocation = document.querySelector("#useLocation").checked;
        const creationHint = document.querySelector("#creationHint");
        let latitude = null;
        let longitude = null;
        if(pid != null) {
            if(title != null && title !== ""){
                if(useLocation === true){
                    if(navigator.geolocation) {
                        const getPosition = () => {
                            return new Promise((resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(resolve, reject);
                            });
                        }
                        
                        try {
                            const position = await getPosition();
                            latitude = position.coords.latitude;
                            longitude = position.coords.longitude;
                        } catch (error) {
                            console.error("Error getting location:", error);
                            alert("Unable to retrieve location. Creating conversation without location reference.");
                        }
                    } else {
                        alert("Unable to retrieve location. Creating conversation without location reference.");
                    }
                }
                await createConversation(pid, title, latitude, longitude);
                creationWindow.style.display = "none";
                creationHint.style.display = "none";
            }else {
                creationHint.style.display = "block";
            }
        }else {
            alert("Unable to retrieve session ID.");
        }
    };
    
    var deletionCid = "";
    const pid = parseInt(sessionStorage.getItem('sessionId'));
    const conversationList = document.querySelector("#conversationList");
    const icon = document.querySelector('.icon');
    const menuButtons = document.querySelector('.menuButtons');
    const logOutButton = document.querySelector("#logOut");
    const createConvoButton = document.querySelector("#createConvo");
    const creationWindow = document.querySelector("#creationWindow");
    const creationWindowCloseButton = document.querySelector("#creationWindowClose");
    const creationForm = document.querySelector("#creationForm");
    const deletionWindow = document.querySelector("#deletionWindow");
    const deletionWindowCloseButton = document.querySelector("#deletionWindowClose");
    const deletionForm = document.querySelector("#deletionForm");
    
    getConversations();
    icon.addEventListener('click', toggleMenuButtons);
    logOutButton.addEventListener ('click', logOut);
    createConvoButton.addEventListener ('click', openCreationWindow);
    creationWindowCloseButton.addEventListener ('click', closeCreationWindow);
    creationForm.addEventListener ('submit', handleCreationSubmit);
    deletionWindowCloseButton.addEventListener ('click', closeDeletionWindow);
    deletionForm.addEventListener ('submit', deleteConversation);
    window.addEventListener('click', closeWindows);
});
