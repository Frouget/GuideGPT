<?php
//User should have to log in, then be presented with a list of conversations, then should be able to choose a conversation and interact with it
//creating variable to track status code
$status = 0;
//creating database connection. Password is: q_vX$-2Im<z-pRE
$connect = mysqli_connect('fgr11.brighton.domains', 'fgr11_Admin', 'Jetster726', 'fgr11_guide_gpt');
header('content-type: application/json');

//Declaring routing
$url = $_SERVER['REQUEST_URI'];
$lastSlashPos = strrpos($url, '/');
if ($lastSlashPos !== false) {
    $endpoint = substr($url, $lastSlashPos + 1);
    $queryPos = strpos($endpoint, '?');
    $route = ($queryPos !== false) ? substr($endpoint, 0, $queryPos) : $endpoint;
    $query = ($queryPos !== false) ? substr($endpoint, $queryPos + 1) : false;
    $body = json_decode(file_get_contents('php://input'));
    //Using substring defined variables to determine route location
    if($route === 'createConversation') {
        if($body !== null){
            handleFunction($connect, "saveAndReturnCreation", $body);
        } else {
            echo "Missing Request Body Data";
            $status = 400;
        }
    } else if ($route === 'api/reply') {
        if($body !== null){
            handleFunction($connect, "saveAndReturnReply", $body);
        } else {
            echo "Missing Request Body Data";
            $status = 400;
        }
    } else if ($route === 'logIn' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($body !== null && $body->username !== null && $body->password !== null ) {
        handleFunction($connect, "logIn", $body);
        } else {
            echo "Missing Request Body Data";
            $status = 400;
        }
    } else if ($route === 'signUp' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($body !== null && $body->email !== null && $body->name !== null && $body->username !== null && $body->password !== null ) {
        handleFunction($connect, "signUp", $body);
        } else {
            echo "Missing Request Body Data";
            $status = 400;
        }
    } else if ($route === 'home') {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if ($body !== null) {
                handleFunction($connect, "createConversation",$body);
            } else {
                echo "Missing Request Body Data";
                $status = 400;
            }
        } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if($query !== null) {
                handleFunction($connect, "listConversations", $query);
            } else {
                echo "Missing query parameter";
                $status = 400;
            }
        } else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            if($query !== null) {
                handleFunction($connect, "deleteConversation", $query);
            } else {
                echo "Missing query parameter";
                $status = 400;
            }
        } else {
            $status = 500;
        }
    } else if ($route === 'conversation') {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if ($body !== null && $body->cid !== null && $body->message !== null) {
                handleFunction($connect, "sendConversation",$body);
            } else {
                echo "Missing Request Body Data";
                $status = 400;
            }
        } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if($query !== false) {
                handleFunction($connect, "readConversation",$query);
            } else {
                echo "Missing query parameter";
                $status = 400;
            }
        } else {
            $status = 500;
        }
    } else {
        $status = 500;
    }
} else {
    $status = 500;
};

function handleFunction($connect, $functionType, $parameter)
{
    //checking database connection
    if (!$connect) {
        $status = 500;
        http_response_code($status);
    } else {
        //Launching myAPI instance
        $sent = new myAPI();
        $status = $parameter !== null ? $sent->$functionType($connect, $parameter) : $sent->$functionType($connect);
    }
}


    


class myAPI
{
    //Sign-In Page functions -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    //handling a logIn request
    public function logIn($connect, $body) {
        if($body !== null && $body->username !== null && $body->password !== null){
            $username = $connect->real_escape_string($body->username);
            $password = $connect->real_escape_string($body->password);
            //building sql query and sending to database
            $sql = "SELECT * FROM accounts WHERE `username` = '$username'";
            $result = mysqli_query($connect, $sql);
            //check if any locations were found
            if ($result &&  $result->num_rows === 1) {
                //verifying correct data is present then echoing
                $row = mysqli_fetch_assoc($result);
                if ($row !== null  && $row['pid'] !== null && $row['password'] === $password) {
                    $JSON = "{\"success\" : true, \"pid\" : " . $row['pid'] . "}";
                    $status = 200;
                    echo $JSON;
                }else {
                    //status if password is incorrect
                    $JSON = "{\"success\" : false, \"error\" : \"Password incorrect\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else {
                //status if no accounts are found
                $JSON = "{\"success\" : false, \"error\" : \"No Accounts Found\"}";
                $status = 204;
            }
        } else {
            //status if no conversations are found
            $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
            $status = 400;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }

    //handling a signUp request
    public function signUp($connect, $body) {
        if($body !== null && $body->username !== null && $body->password !== null && $body->email !== null && $body->name !== null){
            $username = $connect->real_escape_string($body->username);
            $password = $connect->real_escape_string($body->password);
            $email = $connect->real_escape_string($body->email);
            $name = $connect->real_escape_string($body->name);
            //building sql query and sending to database
            $sql = "SELECT * FROM accounts WHERE `username` = '$username' OR `email` = '$email'";
            $result = mysqli_query($connect, $sql);
            //check if any locations were found
            if (!$result || $result->num_rows === 0) {
                //mysqli_free_result($result);
                $sql2 = "INSERT INTO `accounts` (`username`, `password`, `email`, `name`) VALUES ('$username', '$password', '$email', '$name')";
                $result2 = mysqli_query($connect, $sql2);
                $result3 = mysqli_query($connect, $sql);
                if ($result3 &&  $result3->num_rows === 1) {
                    //verifying correct data is present then echoing
                    $row = mysqli_fetch_assoc($result3);
                    if ($row !== null  && $row['pid'] !== null && $row['password'] === $password) {
                        $JSON = "{\"success\" : true, \"pid\" : " . $row['pid'] . "}";
                        $status = 201;
                        echo $JSON;
                    }else {
                        //status if pid cannot be found or password has issues
                        $JSON = "{\"success\" : false, \"error\" : \"Account Creation Unsuccessful\"}";
                        $status = 500;
                        echo $JSON;
                    }
                } else {
                    //status if no account is found
                    $JSON = "{\"success\" : false, \"error\" : \"Account Creation Unsuccessful\"}";
                    $status = 500;
                    echo $JSON;
                }
            } else {
                $row = mysqli_fetch_assoc($result);
                if($row['username'] === $username) {
                    $JSON = "{\"success\" : false, \"error\" : \"An account with the same username already exists\"}";
                    $status = 400;
                    echo $JSON;
                } else {
                    $JSON = "{\"success\" : false, \"error\" : \"An account with the same email already exists\"}";
                    $status = 400;
                    echo $JSON;
                }
            }
        } else {
            $JSON = "{\"success\" : false, \"error\" : \"Missing request body data\"}";
            $status = 400;
            echo $JSON;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }
    
    //Home Page functions --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    //A simple function allowing quick verification of query properties
    public function checkQueryValue($queryArray, $string){
        //echo json_encode($queryArray);
        $queryArray = array_filter($queryArray, function($elem) use ($string) {
            return (str_contains($elem, $string));
        });
        if (count($queryArray) !== 0 && count($queryArray) === 1){
            foreach($queryArray as $query) {
                return explode('=', $query)[1];
            };
        } else {
            return null;
        }
    }

    public function getConversationList($connect, $pid){
        //building sql query and sending to database
        $sql = "SELECT * FROM conversations WHERE pid = $pid";
        $result = mysqli_query($connect, $sql);
        //check if any locations were found
        if ($result->num_rows > 0) {
            $resultArr = [];
            //verifying correct data is present then echoing
            while ($row = mysqli_fetch_assoc($result)) {
                if ($row !== null && $row['pid'] === $pid && $row['title'] !== null && $row['latitude'] !== null && $row['longitude'] !== null) {
                    array_push($resultArr, $row);
                }
            }
            $JSON = "{\"success\" : true, \"results\" : " . json_encode($resultArr) . "}";
            $status = 200;
            echo $JSON;
        } else {
            //status if no conversations are found
            $JSON = "{\"success\" : false, \"error\" : \"No Conversations Found\"}";
            $status = 204;
            echo $JSON;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }

    public function pollConversationList($connect, $pid, $timestamp) {
        //formatting variables for sql query
        $timestamp = $connect->real_escape_string($timestamp);
        //building sql query and sending to database
        $sql = "SELECT * FROM conversations WHERE pid = $pid";
        $result = mysqli_query($connect, $sql);
        if ($result->num_rows > 0){
            $resultArr = [];
            while ($row = mysqli_fetch_assoc($result)) {
                if ($row !== null && $row['pid'] === $pid && $row['created'] !== null) {
                    $date = DateTime::createFromFormat('Y-m-d H:i:s', $row['created']);
                    $formattedDate = $date->getTimestamp();
                    if ($formattedDate >= $timestamp) {
                        array_push($resultArr, $row);
                    }
                }
            }
            if(count($resultArr) > 0) {
                $JSON = "{\"success\" : true}";
                $status = 200;
                echo $JSON;
            } else {
                //status if no newly created conversations are found
                $JSON = "{\"success\" : false}";
                $status = 204;
                echo $JSON;
            }
        } else {
            //status if no conversations are found
            $JSON = "{\"success\" : false}";
            $status = 204;
            echo $JSON;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }

    //function to retrieve  a list of conversations
    public function listConversations($connect, $query)
    {
        $pid = '';          
        $timestamp = '';
        //check if any records related to the pid have been created after the timestamp
        $queries = explode('&', $query);
        $pid = $this->checkQueryValue($queries, 'pid=');
        $timestamp = $this->checkQueryValue($queries, 'timestamp=');
        if($pid !== null && $timestamp === null){
            $this->getConversationList($connect, $pid);
        } else if ($pid !== null && $timestamp !== null){
            $this->pollConversationList($connect, $pid, $timestamp);
        } else {
            //Not all query parameters found
            $status = 500;
            http_response_code($status);
        }
    }
    
    //handling a createItem request
    public function createConversation($connect, $body)
    {
        if ($body !== null && $body->pid !== null && $body->title !== null && $body->latitude !== null && $body->longitude !== null) {
                //formatting variables for http request
                $url = 'https://freddierouget-h.cyclr.uk/api/webhook/3hHSiCz0'; //Webhook URL
                $jsonBody = json_encode($body);
                $requestConfig = array('http' => array(
                    'method' => 'POST',
                    'header' => 'Content-type: application/json',
                    'content' => $jsonBody
                ));
                //Creating the stream context
                $context  = stream_context_create($requestConfig);
                //Making the POST request
                $response = file_get_contents($url, false, $context);
                $responseData = json_decode($response, true);
                if($responseData === 'Webhook accepted.'){
                    $timestamp = time();
                    $JSON = "{\"success\" : true, \"timestamp\" : " . $timestamp . "}";
                    $status = 200;
                    echo $JSON;
                } else {
                    $JSON = "{\"success\" : false, \"error\" : \"Webhook Rejected.\"}";
                    $status = 500;
                    echo $JSON;
                }
        } else {
            $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
            $status = 400;
            echo $JSON;
        }
        //Free memory from output
        http_response_code($status);
    }
    
    //handling a deleteConversation request
    public function deleteConversation($connect, $query)
    {
        $pid = '';          
        $cid = '';
        //check if any records related to the pid have been created after the timestamp
        $queries = explode('&', $query);
        $pid = $this->checkQueryValue($queries, 'pid=');
        $cid = $this->checkQueryValue($queries, 'cid=');
        if($pid !== null && $cid === null){
            //building sql query and sending to database
            $cid = $connect->real_escape_string($cid);
            $sql = "DELETE FROM conversations WHERE pid = $pid AND cid = $cid";
            $result = mysqli_query($connect, $sql);
            $sql2 = "SELECT FROM conversations WHERE pid = $pid AND cid = $cid";
            $result2 = mysqli_query($connect, $sql2);
            if($result->num_rows === 0) {
                $JSON = "{\"success\" : true}";
                $status = 200;
                mysqli_free_result($result2);
                echo $JSON;
            } else {
                //status if no conversations are found
                $JSON = "{\"success\" : false, \"error\" : \"Conversation Deletion Failed\"}";
                $status = 500;
                mysqli_free_result($result2);
                echo $JSON;
            }
        } else {
            //Not all query parameters found
            $JSON = "{\"success\" : false, \"error\" : \"Missing Query Parameter\"}";
            $status = 400;
            echo $JSON;
        }
        //Free memory from output
        http_response_code($status);
    }
    
    //Conversation Page functions -----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    private function getConversation(){
            //Assigning the personal id to identify the user and the conversation id to identify which conversation to retrieve
            $cid = $connect->real_escape_string($cid);
            //building sql query and sending to database
            $sql = "SELECT * FROM conversations WHERE cid = $cid";
            $result = mysqli_query($connect, $sql);
            if ($result->num_rows > 0) {
                if ($result->num_rows === 1) {
                    $resultObj;
                    //verifying correct data is present then echoing
                    $row = mysqli_fetch_assoc($result);
                    if ($row !== null && $row['cid'] === $cid && $row['pid'] === $pid && $row['title'] !== null && $row['messages'] !== null && $row['latitude'] !== null && $row['longitude'] !== null) {
                        $resultObj = $row;
                        $JSON = "{\"result\" : " . json_encode($resultObj) . "}";
                        $status = 200;
                        echo $JSON;
                    }
                } else {
                    //status if multiple conversations are found
                    echo 'Error: Multiple Conversations Found';
                    $status = 500;
                }
            } else {
                //status if no conversations are found
                echo 'No Conversations Found';
                $status = 204;
            }
            //Free memory from output
            mysqli_free_result($result);
            http_response_code($status);
    }
    
    private function pollConversation(){
            //formatting variables for sql query
            $cid = $connect->real_escape_string($cid);
            $timestamp = $connect->real_escape_string($timestamp);
            //building sql query and sending to database
            $sql = "SELECT * FROM conversations WHERE cid = $cid AND pid = $pid AND updated >= $timestamp";
            $result = mysqli_query($connect, $sql);
            if ($result->num_rows > 0){
                $status = 200;
                echo "Conversation Updated";
                //Free memory from output
                mysqli_free_result($result);
                http_response_code($status);
            }
    }
    
    //function related to retreival of a specific conversation
    public function readConversation($connect, $query)
    {
        $cid = '';
        $pid = '';          
        $timestamp = '';      
        $queries = explode('&', $query);
        $cid = checkQueryValue($queries, 'cid=');
        $pid = checkQueryValue($queries, 'pid=');
        $timestamp = checkQueryValue($queries, 'timestamp=');
        if($cid !== null && $pid !== null && $timestamp === null){
            getConversation();
        } else if ($cid !== null && $pid !== null && $timestamp !== null){
            pollConversation();
        } else {
            //Not all query parameters found
            $status = 500;
            http_response_code($status);
        }
    }
    
    //handling a sendConversation request
    public function sendConversation($connect, $query)
    {
        if ($body !== null && $body->cid !== null && $body->message !== null) {
            $cid = $connect->real_escape_string($cid);
            //building sql query and sending to database
            $sql = "SELECT * FROM conversations WHERE cid = $cid";
            $result = mysqli_query($connect, $sql);
            if ($result->num_rows > 0) {
                if ($result->num_rows === 1) {
                    $resultObj;
                    //verifying correct data is present then echoing
                    $row = mysqli_fetch_assoc($result);
                    if ($row !== null && $row['cid'] === $cid && $row['pid'] === $pid && $row['title'] !== null && $row['messages'] !== null && $row['latitude'] !== null && $row['longitude'] !== null) {
                        $result = $row;
                        //formatting variables for http request
                        $url = 'https:fgr11.brighton.domains/public_html/GuideGPT/api/webhook/reply'; //Webhook URL
                        $jsonBody = json_encode($body);
                        $requestConfig = array('http' => array(
                            'method' => 'POST',
                            'header' => 'Content-type: application/json',
                            'content' => $jsonBody
                        ));
                        //Creating the stream context
                        $context  = stream_context_create($requestConfig);
                        //Making the POST request
                        $response = file_get_contents($url, false, $context);
                        $responseData = json_decode($response, true);
                        if($responseData['success'] !== null && $responseData['success'] === true){
                            echo "Record Created";
                            $status = 201;
                        }
                    }
                }   else {
                    //status if multiple conversations are found
                    echo 'Error: Multiple Conversations Found';
                    $status = 500;
                }
            } else {
                //status if no conversations are found
                echo 'No Conversations Found';
                $status = 204;
            }
        } else {
            echo "Missing Request Body Data";
            $status = 400;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }
    
    //Integration functions --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //handling a saveAndReturnCreation request
    public function saveAndReturnCreation($connect, $body) {
        if($body !== null && $body->cid !== null && $body->pid !== null && $body->title !== null && $body->messages !== null && $body->latitude !== null && $body->longitude !== null){
            //formatting variables for sql query
            if($body->messages[1]->content === 'Awaiting questions') {
                $cid = $connect->real_escape_string($body->cid);
                $pid = $body->pid;
                $title = $connect->real_escape_string($body->title);
                $messages = $connect->real_escape_string(json_encode($body->messages));
                $latitude = $connect->real_escape_string($body->latitude);
                $longitude = $connect->real_escape_string($body->longitude);
                //building sql query and sending to database
                $sql = "INSERT INTO `conversations` (`cid`, `pid`, `title`, `messages`, `latitude`, `longitude`) VALUES ('$cid', '$pid', '$title', '$messages', '$latitude', '$longitude')";
                mysqli_query($connect, $sql);
                //building sql query to check that the conversation was created
                $sql2 = "SELECT * FROM `conversations` WHERE `cid` = '$cid' AND `pid` = '$pid' AND `latitude` = '$latitude' AND `longitude` = '$longitude'  ORDER BY cid DESC LIMIT 1";
                $result = mysqli_query($connect, $sql2);
                //checking the record does exist then echoing a response
                if ($result !== false && mysqli_num_rows($result) > 0) {
                    $JSON = "{\"success\" : true, \"cid\" : " . $cid . "}";
                    echo $JSON;
                    $status = 201;
                } else {
                    //error incase the conversation was not created
                    $JSON = "{\"success\" : false,
                      \"error\" : \"Record creation for this conversation failed.\"}";
                    echo $JSON;
                    $status = 500;
                }
            } else {
                $JSON = "{\"success\" : false,
                      \"error\" : \"ChatGPT Component did not produce expected response.\"}";
                echo $JSON;
                $status = 500;
            }
        } else {
            $JSON = "{\"success\" : false,
                      \"error\" : \"Body Data Missing\"}";
            echo $JSON;
            $status = 400;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }

    //handling a saveAndReturnReply request
    public function saveAndReturnReply($connect, $body) {
        if($body !== null && $body->cid !== null && $body->message !== null){
            //formatting variables for sql query
            $jsonMessages = json_encode($body->messages);
            $cid = $connect->real_escape_string($body->cid);
            $messages = $connect->real_escape_string($jsonMessages);
            //building sql query and sending to database
            $sql = "UPDATE `conversations` SET(`messages` = '$messages') WHERE (`cid` = '$cid')";
            mysqli_query($connect, $sql);
            //building sql query to check that the location was created
            $sql2 = "SELECT * FROM `conversations` WHERE `cid` = '$cid' AND `messages` = '$messages' ORDER BY cid DESC LIMIT 1";
            $result = mysqli_query($connect, $sql2);
            //checking the record has been updated with messages then echoing a response
            if ($result !== false && mysqli_num_rows($result) > 0) {
                $JSON = "{\"cid\" : " . json_encode($cid) . ",
                          \"success\" : true}";
                echo $JSON;
                $status = 201;
            } else {
                //error incase the conversation was not created
                $status = 500;
            }
        } else {
            $JSON = "{\"success\" : false,
                      \"error\" : \"Body Data Missing\"}";
            echo $JSON;
            $status = 400;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }
}

//set response code, free output from memory and close connection
http_response_code($status);
mysqli_close($connect);


?>
