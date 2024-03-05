window.addEventListener("load", function (evt) {
    //defining variables for finding divs and creating a counter
    var contact = document.querySelector("#Contact");
    var loading = document.querySelector("#Loading");
    var success = document.querySelector("#Success");
    var error = document.querySelector("#Error");
    var count = 0;
    
    //Creating an event listener for the submit button
    var form = document.querySelector("#Form");
    form.addEventListener('submit', function(evt) {
        evt.preventDefault();

        //Defining variables for the search and input validation
        var search = document.querySelector("#Search").value.trim();
        var hintsearch = document.querySelector("#HintSearch");
        var fieldsok = true;
        
        //Using if/else methods to display correct div for scenario
        if(search.length === 0) {
            fieldsok = false;
            hintsearch.style.display = "inline";
        }else {
            hintsearch.style.display = "none";
        }
        
        if (fieldsok === true) {
            contact.style.display = "none";
            loading.style.display = "block";
            success.style.display = "none";
            error.style.display = "none";
            //Remove previous results and create search result header
            while (success.firstChild !== null) {
                let target = success.lastChild;
                target.remove();
            }
            //Creating element for search result counter
            var result = document.createElement("h3");
            success.appendChild(result);
            count = 0;
            

            
            //Creating xmlhttp request
            var xhttp = new XMLHttpRequest();
            xhttp.addEventListener("load", function (evt) {
                if (xhttp.status == 200) {
                    console.log("success");
                    var jsonResponse = JSON.parse(xhttp.responseText);
                    console.log(jsonResponse);                    
                    
                    //Loop for each search result
		            jsonResponse.collection.items.forEach(function (item){
                        
                        //Creating element, getting data and appending to the success div
                        //Then repeating the process for each type of data needed
			            var title = item.data[0].title;
			            var titleDoc = document.createElement("h4");
			            titleDoc.textContent = title;
                        success.appendChild(titleDoc);
                        console.log(title);
                        count++;
                        
                        var link = item.links[0].href;
                        var linkDoc = document.createElement("img");
                        linkDoc.setAttribute("src", link);
                        linkDoc.setAttribute("alt", "Error displaying image");
                        success.appendChild(linkDoc);
                        console.log(link);
                     
                        var description = item.data[0].description_508;
                        var descDoc = document.createElement("p");
                        descDoc.textContent = description;
                        success.appendChild(descDoc);
                        console.log(description);
                        
                        var date = item.data[0].date_created;
                        var dateDoc = document.createElement("p");
                        dateDoc.textContent = date;
                        success.appendChild(dateDoc);
                        console.log(date);
                    });
                
                //Updating search result counter
                result.textContent = count + " results found";
                
                //Showing/hiding correct divs for SPA
                contact.style.display = "block";
                loading.style.display = "none";
                success.style.display = "block";
                error.style.display = "none";                    
                }else {
                    contact.style.display = "block";
                    loading.style.display = "none";
                    success.style.display = "none";
                    error.style.display = "block";

                }
            });
            //Get request to NASA API
            xhttp.open("GET", 'https://images-api.nasa.gov/search?q=' + search + '&media_type=image', true);
            xhttp.send();
            }
        
    });
});