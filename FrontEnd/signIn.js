window.addEventListener("load", function (evt) {
    function toggleForm() {  
        logInForm.classList.toggle('active');
        signUpForm.classList.toggle('active');
    }

    async function loginUser(username, password) {
        try {
            const response = await fetch('www.something.com/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "username": username,
                    "password": password
                })
            });
    
            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            }
    
            const data = await response.json();
            const sessionId = data.id; // Assuming the API sends back an ID upon successful login
    
            // Storing the session ID in the user's session
            sessionStorage.setItem('sessionId', sessionId);

            // Redirecting the user to the home page
            window.location.href = 'home.html';
    
        } catch (error) {
            // Display error message to the user
            console.error('Login failed:', error.message);
            //ADD HTML REPRESENTATION OF ERROR HERE
        }
    }

    async function signUpUser(email, name, username, password) {
        try {
            const response = await fetch('www.something.com/signup', {
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
    
            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            }
    
            const data = await response.json();
            const sessionId = data.id; // Assuming the API sends back an ID upon successful login
    
            // Storing the session ID in the user's session
            sessionStorage.setItem('sessionId', sessionId);
            
            // Redirecting the user to the home page
            window.location.href = 'home.html';
            
        } catch (error) {
            // Display error message to the user
            console.error('Login failed:', error.message);
            // You can modify HTML to display the error message to the user here
        }
    }
    
    async function handleFormSubmit(event) {
        event.preventDefault(); // Prevent the form from submitting normally
        
        const form = event.target;
        const formData = new FormData(form);
        
        const username = formData.get('username');
        const password = formData.get('password');
        
        if (form.id === 'login') {
            await loginUser(username, password);
        } else if (form.id === 'signup') {
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
    logToSignButton.addEventListener('onclick', toggleForm);
    signToLogButton.addEventListener('onclick', toggleForm);
    logInForm.addEventListener('submit', handleFormSubmit);
    signUpForm.addEventListener('submit', handleFormSubmit);
});