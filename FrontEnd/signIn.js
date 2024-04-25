window.addEventListener("load", function (evt) {
    
    //Function for toggling which form is being shown
    function toggleForm() {  
        logInForm.classList.toggle('active');
        signUpForm.classList.toggle('active');
    }
    
    //Function for sending a login request to the API
    async function loginUser(username, password) {
        try {
            //Building the request
            const loginResponse = await fetch('https://fgr11.brighton.domains/testing/guidegpt/api.php/logIn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "username": username,
                    "password": password
                })
            });
    
            //Checking the response for errors
            if (!loginResponse.ok) {
                const errorMessage = await loginResponse.text();
                throw new Error(errorMessage);
            }
            
            const loginData = await loginResponse.json();
            //Checking data was successful and contains a PID
            if(loginData.success && loginData.pid != null) {
                //Assigning the session ID to the user's session storage
                const sessionId = loginData.pid;
                sessionStorage.setItem('sessionId', sessionId);
                //Redirecting the user to the home page
                window.location.href = 'home.html';
            }else {
                //Presenting errors to the user if they occur
                alert("Error: " + loginData.error);
            }
            
    
        } catch (error) {
            //Display error message to the user
            console.error('Login failed:', error.message);
        }
    }

    //Function for sending a signup request to the API
    async function signUpUser(email, name, username, password) {
        try {
            //Building the request
            const signUpResponse = await fetch('https://fgr11.brighton.domains/testing/guidegpt/api.php/signUp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "email": email,
                    "name": name,
                    "username": username,
                    "password": password
                })
            });
            
            //Checking the response for errors
            if (!signUpResponse.ok) {
                const errorMessage = await signUpResponse.text();
                throw new Error(errorMessage);
            }
            
            const signUpData = await signUpResponse.json();
            //Checking data was successful and contains a PID
            if(signUpData.success && signUpData.pid != null) {
                //Assigning the session ID to the user's session storage
                const sessionId = signUpData.pid;
                sessionStorage.setItem('sessionId', sessionId);
                //Redirecting the user to the home page
                window.location.href = 'home.html';
            }else {
                //Presenting errors to the user if they occur
                alert("Error: " + signUpData.error);
            }
            
        } catch (error) {
            //Display error message to the user
            console.error('Login failed:', error.message);
        }
    }
    
    //Function to handle processing when a user clicks a submit button
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        //Defining and retrieving variables
        const form = event.target;
        const formData = new FormData(form);
        
        const username = formData.get('username');
        const password = formData.get('password');
        
        //Checking if it is a login or signup request and launching the correct function
        if (form.id === 'logInForm') {
            await loginUser(username, password);
        } else if (form.id === 'signUpForm') {
            const email = formData.get('email');
            const name = formData.get('name');
            await signUpUser(email, name, username, password);
        }
    }
    
    //Assigning divs and buttons to variables for targeted actions
    const logInForm = document.querySelector('#login');
    const signUpForm = document.querySelector('#signup');
    const logToSignButton = document.querySelector('#logToSignButton');
    const signToLogButton = document.querySelector('#signToLogButton');

    //Adding event listeners for dynamic functionality
    logToSignButton.addEventListener('click', toggleForm);
    signToLogButton.addEventListener('click', toggleForm);
    logInForm.addEventListener('submit', handleFormSubmit);
    signUpForm.addEventListener('submit', handleFormSubmit);
});
