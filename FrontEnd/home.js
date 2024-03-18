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
    
    // Close conversation creation window
    function closeCreationWindow() {
        creationWindow.style.display = "none";
        creationHint.style.display = "none";
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
    
    async function handleDeleteConversationButton() {
        const cid = event.target.parentElement.id;
        if (cid != null && cid !== "" && pid != null) {
            try {
                const deletionResponse = await fetch(`www.something.com/home?pid=${pid}&cid=${cid}`, {
                    method: 'GET'
                });
                const deletionData = await deletionResponse.json();
                
                if(deletionData.success) {
                    getConversations();
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }else {
            alert("Unable to retrieve session ID or conversation ID.");
        }
    }
    
    async function getConversations() {
        if(pid != null) {
            try {
                const response = await fetch(`www.something.com/home?pid=${pid}`, {
                    method: 'GET'
                });
                const listConversationData = await response.json();

                //Remove all pre-existing conversations
                while (conversationList.firstChild) {
                    conversationList.removeChild(conversationList.firstChild);
                }
                
                listConversationData.forEach(item => {
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
                    const conversationDiv = document.querySelector("#conversationForm");
                    const chatButton = conversationDiv.querySelector(".chat-button");
                    const deleteConversationButton = conversationDiv.querySelector(".delete-conversation-button");
                    chatButton.addEventListener('click', handleChatButton);
                    deleteConversationButton.addEventListener('click', handleDeleteConversationButton);
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }else {
            alert("Unable to retrieve session ID.");
        }
    }
    
    async function pollConversation(pid, timestamp){
        const interval = 5000;
        let conversationId = null;
        const polling = async () => {
            try {
                const pollingResponse = await fetch(`www.something.com/home?pid=${pid}&timestamp=${timestamp}`, {
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
            const creationResponse = await fetch('www.something.com/home', {
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
                    navigator.geolocation.getCurrentPosition(function(position) {
                    var latitude = position.coords.latitude;
                    var longitude = position.coords.longitude;
                    });
                    if(latitude === null || longitude === null){
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
    
    const pid = sessionStorage.getItem('sessionId');
    const conversationList = document.querySelector("#conversationList");
    const icon = document.querySelector('.icon');
    const menuButtons = document.querySelector('.menuButtons');
    const logOutButton = document.querySelector("#logOut");
    const createConvoButton = document.querySelector("#createConvo");
    const creationWindow = document.querySelector("#creationWindow");
    const creationWindowCloseButton = document.querySelector("#creationWindowClose");
    const creationForm = document.querySelector("#conversationForm");
    
    getConversations();
    icon.addEventListener('click', toggleMenuButtons);
    logOutButton.addEventListener ('click', logOut);
    createConvoButton.addEventListener ('click', openCreationWindow);
    creationWindowCloseButton.addEventListener ('click', closeCreationWindow);
    window.addEventListener('click', closeWindows);
    creationForm.addEventListener ('submit', handleCreationSubmit);
});
