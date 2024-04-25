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
    
    //Function to open the conversation creation window
    function openCreationWindow() {
        creationWindow.style.display = "block";
    }
    
    //Function to open the conversation deletion window
    function openDeletionWindow() {
        deletionCid = event.target.parentElement.id;
        deletionWindow.style.display = "block";
    }
    
    //Function to close the conversation creation window
    function closeCreationWindow() {
        creationWindow.style.display = "none";
        creationHint.style.display = "none";
    }
    
    //Function to close the conversation deletion window
    function closeDeletionWindow() {
        deletionWindow.style.display = "none";
    }
    
    //Function to close all pop up windows
    function closeWindows(event) {
        if (event.target == creationWindow) {
            creationWindow.style.display = "none";
            creationHint.style.display = "none";
        }
    }

    //Function to handle a users request to open a chat
    function handleChatButton() {
        //Identifying conversation ID
        const cid = event.target.parentElement.id;
        if (cid != null && cid !== "" && pid != null) {
            window.location.href = 'conversation.html?cid=' + cid;
        }else {
            //Error if either ID cannot be found
            alert("Unable to retrieve session ID or conversation ID.");
        }
    }
    
    //Function for sending a list conversation request to the API
    async function getConversations() {
        if(pid != null) {
            try {
                //Building the request
                listConversationResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/home?pid=${pid}`, {
                    method: 'GET'
                });
                
                //Checking the response for errors
                if (!listConversationResponse.ok) {
                    const errorMessage = await listConversationResponse.text();
                    throw new Error(errorMessage);
                }
                
                const listConversationData = await listConversationResponse.json();
                //Remove all pre-existing conversations
                while (conversationList.firstChild) {
                    conversationList.removeChild(conversationList.firstChild);
                }
                
                if (listConversationData != null && listConversationData.success && listConversationData.results != null && listConversationData.results.length > 0) {
                    //Going over each conversation in the list returned
                    listConversationData.results.forEach(item => {
                        let conversationTitle = item.title;
                        let conversationId = item.cid;
                    
                        //Create HTML elements for each conversation object
                        let conversationElement = document.createElement('div');
                        conversationElement.innerHTML = `
                        <div class="conversation" id="${conversationId}">
                            <h2 class="conversation-title">${conversationTitle}</h2>
                            <button class="chat-button">Chat</button>
                            <button class="delete-conversation-button">Delete Conversation</button>
                        </div>`;
                        //Add each conversation to the list
                        conversationList.appendChild(conversationElement);
                    });
                    //Attaching chat event listeners outside the loop
                    const chatButtons = document.querySelectorAll('.chat-button');
                    chatButtons.forEach(button => {
                        button.addEventListener('click', handleChatButton);
                    });
                    
                    //Attaching delete event listeners outside the loop
                    const deleteConversationButtons = document.querySelectorAll('.delete-conversation-button');
                    deleteConversationButtons.forEach(button => {
                        button.addEventListener('click', openDeletionWindow);
                    });
                } else {
                    //Adding message if no conversations are found
                    let bodyElement = document.createElement('div');
                    bodyElement.innerHTML = 
                        `<div class="conversation" id="noConvoText"><h2 class="conversation-title">No Conversations Found. Create one using the menu at the top right!</h2></div>`; 
                    conversationList.appendChild(bodyElement);
                }
            } catch (error) {
                //Display error message to the user
                console.error('Error fetching data:', error.message);
            }
        }else {
            //Display error message to the user if the PID is not found
            alert("Unable to retrieve session ID.");
        }
    }
    
    //Function for sending a poll conversation list request to the API
    async function pollConversation(pid, timestamp){
        const interval = 2000;
        let conversationId = null;
        const polling = async () => {
            try {
                //Building the request
                const pollingResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/home?pid=${pid}&timestamp=${timestamp}`, {
                    method: 'GET'
                });
                //Added console log to ensure developer can check if polling is successfully recurring
                console.log('Polling Conversation Creation');
                
                //Checking the response for errors
                if (!pollingResponse.ok) {
                    throw new Error('Polling request failed');
                }

                const pollingData = await pollingResponse.json();
                if (pollingData.success) {
                    //Success flag received, stop polling and reload conversations
                    getConversations();
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
    
    //Function for sending a create conversation request to the API
    async function createConversation(pid, title, latitude, longitude) {
        try {
            //Building the request
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
            
            //Checking the response for errors
            if (!creationResponse.ok) {
                const errorMessage = await creationResponse.text();
                throw new Error(errorMessage);
            }
    
            const creationData = await creationResponse.json();
            if(creationData.success && creationData.timestamp != null) {
                //Assigning the creation initialization timestamp if sent back by the API
                const timestamp = creationData.timestamp;
                if(timestamp != null) {
                    //Check if the no conversation text is still present and remove if so
                    let noConvoText = document.querySelector("#noConvoText");
                    if(noConvoText != null) {
                        conversationList.removeChild(conversationList.firstChild);
                    }
                    //Creating a loading element while polling occurs
                    let loadingElement = document.createElement('div');
                    loadingElement.innerHTML = `
                        <div class="conversation">
                            <img src = "https://fgr11.brighton.domains/testing/guidegpt/images/spinninggear.gif" alt="Error Displaying Gif">
                        </div>`;
                    //Adding loading element to conversation list
                    conversationList.appendChild(loadingElement);
                    //Scrolling to the bottom of the page if needed
                    window.scrollTo(0,document.body.scrollHeight);
                    //Launching polling
                    pollConversation(pid, timestamp);
                }else {
                    //Display error to user if timestamp is not found
                    alert("Creation Failed. No polling timestamp found.");
                }
            }else {
                //Presenting errors to the user if they occur
                alert("Error: " + creationData.error);
            }
        } catch (error) {
            //Display error message to the user
            console.error('Creation failed:', error.message);
        }
    }
    
    //Function to handle delete button actions
    async function deleteConversation() {
        event.preventDefault();
        if (deletionCid != null && deletionCid !== "") {
            try {
                //Building and sending a delete conversation request to the API
                const deletionResponse = await fetch(`https://fgr11.brighton.domains/testing/guidegpt/api.php/home?pid=${pid}&cid=${deletionCid}`, {
                    method: 'DELETE'
                });
                
                //Checking the response for errors
                if (!deletionResponse.ok) {
                    const errorMessage = await deletionResponse.text();
                    throw new Error(errorMessage);
                }
                
                const deletionData = await deletionResponse.json();
                if(deletionData.success) {
                    //Unassigning deletionCid so it can be used again
                    deletionCid = "";
                    closeDeletionWindow()
                    //Reload conversation list
                    getConversations();
                }else {
                    //Presenting errors to the user if they occur
                    alert("Error: " + deletionData.error);
                }
            } catch (error) {
                //Display error message to the user
                console.error('Error fetching data:', error.message);
            }
        }else {
            //Display error message to the user if the PID or CID is not found
            alert("Unable to retrieve session ID or conversation ID.");
        }
    }
    
    //Function to handle create button actions
    async function handleCreationSubmit(event) {
        event.preventDefault();
        //Identifying important creation window variables
        const title = document.querySelector("#title").value;
        const useLocation = document.querySelector("#useLocation").checked;
        const creationHint = document.querySelector("#creationHint");
        let latitude = '';
        let longitude = '';
        //Checking if PID is present
        if(pid != null) {
            //Checking if title is present
            if(title != null && title !== ""){
                //Checking if users location will be used
                if(useLocation === true){
                    if(navigator.geolocation) {
                        //Initializing navigator geolocation
                        const getPosition = () => {
                            return new Promise((resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(resolve, reject);
                            });
                        }
                        
                        //Assigning latitude and longitude based on navigator geolocation
                        try {
                            const position = await getPosition();
                            latitude = position.coords.latitude;
                            longitude = position.coords.longitude;
                        } catch (error) {
                            //Error if navigator geolocation fails
                            console.error("Error getting location:", error);
                            alert("Unable to retrieve location. Creating conversation without location reference.");
                        }
                    } else {
                        //Error if geolocation navigator cannot be found
                        alert("Unable to retrieve location. Creating conversation without location reference.");
                    }
                }
                //Clean up screen and launch creation request
                toggleMenuButtons()
                await createConversation(pid, title, latitude, longitude);
                creationWindow.style.display = "none";
                creationHint.style.display = "none";
            }else {
                //Display title hint if no title is found
                creationHint.style.display = "block";
            }
        }else {
            //Display error message to the user if the PID is not found
            alert("Unable to retrieve session ID.");
        }
    };
    
    //Assigning divs and buttons to variables for targeted actions
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
    
    //Adding event listeners for dynamic functionality
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
