<?php
//creating variable to track status code
$status = 0;
//creating database connection.
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
    switch ($route) {
        case 'createConversation':
            if($body !== null){
                handleFunction($connect, "saveAndReturnCreation", $body);
            } else {
                //Error if body data is missing
                $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
                echo $JSON;
                $status = 400;
            }
            break;
        case 'conversationReply':
            if($body !== null){
                handleFunction($connect, "saveAndReturnReply", $body);
            } else {
                //Error if body data is missing
                $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
                echo $JSON;
                $status = 400;
            }
            break;
        case 'logIn':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if ($body !== null) {
                    handleFunction($connect, "logIn", $body);
                } else {
                    //Error if body data is missing
                    $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else {
                //Error if incorrect method type is detected
                $JSON = "{\"success\" : false, \"error\" : \"Forbidden HTTP Method Type\"}";
                echo $JSON;
                $status = 403;
            }
            break;
        case 'signUp':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if ($body !== null) {
                    handleFunction($connect, "signUp", $body);
                } else {
                    //Error if body data is missing
                    $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else {
                //Error if incorrect method type is detected
                $JSON = "{\"success\" : false, \"error\" : \"Forbidden HTTP Method Type\"}";
                echo $JSON;
                $status = 403;
            }
            break;
        case 'home':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if ($body !== null) {
                    handleFunction($connect, "createConversation",$body);
                } else {
                    //Error if body data is missing
                    $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                if($query !== null) {
                    handleFunction($connect, "listConversations", $query);
                } else {
                    //Error if query parameter data is missing
                    $JSON = "{\"success\" : false, \"error\" : \"Missing Query Parameter Data\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                if($query !== null) {
                    handleFunction($connect, "deleteConversation", $query);
                } else {
                    //Error if query parameter data is missing
                    $JSON = "{\"success\" : false, \"error\" : \"Missing Query Parameter Data\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else {
                //Error if incorrect method type is detected
                $JSON = "{\"success\" : false, \"error\" : \"Forbidden HTTP Method Type\"}";
                echo $JSON;
                $status = 403;
            }
            break;
        case 'conversation':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if ($body !== null) {
                    handleFunction($connect, "sendConversation",$body);
                } else {
                    //Error if body data is missing
                    $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                if($query !== null) {
                    handleFunction($connect, "readConversation",$query);
                } else {
                    //Error if query parameter data is missing
                    $JSON = "{\"success\" : false, \"error\" : \"Missing Query Parameter Data\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else {
                //Error if incorrect method type is detected
                $JSON = "{\"success\" : false, \"error\" : \"Forbidden HTTP Method Type\"}";
                echo $JSON;
                $status = 403;
            }
            break;
        default:
            //Error if no cases are matched
            $JSON = "{\"success\" : false, \"error\" : \"Unable to Locate Operation\"}";
            echo $JSON;
            $status = 500;
    }
} else {
    //Error if URL cannot be decomposed
    $JSON = "{\"success\" : false, \"error\" : \"Invalid Request URL\"}";
    echo $JSON;
    $status = 500;
};


//Middleman function for checking data and starting new myAPI instance
function handleFunction($connect, $functionType, $parameter) {
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


class myAPI {
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
    
//Sign-In Page functions -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    //Method for handling the operation when a user attempts a login
    public function logIn($connect, $body) {
        //Checking and preparing parameters
        if($body !== null && $body->username !== null && $body->password !== null){
            $username = $connect->real_escape_string($body->username);
            $password = $connect->real_escape_string($body->password);
            //Building sql query to check if an account exists and sending to database
            $sql = "SELECT * FROM accounts WHERE `username` = '$username'";
            $result = mysqli_query($connect, $sql);
            //Check if any accounts were found
            if ($result &&  $result->num_rows === 1) {
                //Verifying correct data is present then echoing
                $row = mysqli_fetch_assoc($result);
                if ($row !== null  && $row['pid'] !== null && $row['password'] === $password) {
                    $JSON = "{\"success\" : true, \"pid\" : " . $row['pid'] . "}";
                    echo $JSON;
                    $status = 200;
                }else {
                    //Error if password is incorrect
                    $JSON = "{\"success\" : false, \"error\" : \"Password Incorrect\"}";
                    echo $JSON;
                    $status = 400;
                }
            } else {
                //Error if no accounts are found
                $JSON = "{\"success\" : false, \"error\" : \"No Accounts Found\"}";
                echo $JSON;
                $status = 204;
            }
        } else {
            //Error if no conversations are found
            $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
            echo $JSON;
            $status = 400;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }

    //Method for handling the operation when a user signs up
    public function signUp($connect, $body) {
        //Checking and preparing parameters
        if($body !== null && $body->username !== null && $body->password !== null && $body->email !== null && $body->name !== null){
            $username = $connect->real_escape_string($body->username);
            $password = $connect->real_escape_string($body->password);
            $email = $connect->real_escape_string($body->email);
            $name = $connect->real_escape_string($body->name);
            //Building sql query to check if an account exists and sending to database
            $sql = "SELECT * FROM accounts WHERE `username` = '$username' OR `email` = '$email'";
            $result = mysqli_query($connect, $sql);
            //Checking if any conversations were found
            if (!$result || $result->num_rows === 0) {
                //Building second sql query to create a new account and sending to database
                $sql2 = "INSERT INTO `accounts` (`username`, `password`, `email`, `name`) VALUES ('$username', '$password', '$email', '$name')";
                $result2 = mysqli_query($connect, $sql2);
                //Sending the account check query again after creation
                $result3 = mysqli_query($connect, $sql);
                //Checking if any accounts were found
                if ($result3 &&  $result3->num_rows === 1) {
                    //verifying correct data is present then echoing
                    $row = mysqli_fetch_assoc($result3);
                    if ($row !== null  && $row['pid'] !== null && $row['password'] === $password) {
                        $JSON = "{\"success\" : true, \"pid\" : " . $row['pid'] . "}";
                        echo $JSON;
                        $status = 201;
                    }else {
                        //Error if pid cannot be found or password has issues
                        $JSON = "{\"success\" : false, \"error\" : \"Account Creation Unsuccessful\"}";
                        echo $JSON;
                        $status = 500;
                    }
                } else {
                    //Error if no account is found
                    $JSON = "{\"success\" : false, \"error\" : \"Account Creation Unsuccessful\"}";
                    echo $JSON;
                    $status = 500;
                }
            } else {
                $row = mysqli_fetch_assoc($result);
                if($row['username'] === $username) {
                    //Error if username already exists
                    $JSON = "{\"success\" : false, \"error\" : \"An account with the same username already exists\"}";
                    echo $JSON;
                    $status = 400;
                } else {
                    //Error if email already exists
                    $JSON = "{\"success\" : false, \"error\" : \"An account with the same email already exists\"}";
                    echo $JSON;
                    $status = 400;
                }
            }
        } else {
            //Error if body data is missing
            $JSON = "{\"success\" : false, \"error\" : \"Missing request body data\"}";
            echo $JSON;
            $status = 400;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }
    
//Home Page functions --------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Method for handling the operation of listing user conversations
    public function getConversationList($connect, $pid) {
        //Building sql query to search for conversations and sending to database
        $sql = "SELECT * FROM conversations WHERE pid = $pid";
        $result = mysqli_query($connect, $sql);
        //Checking if any conversations were found
        if ($result->num_rows > 0) {
            $resultArr = [];
            //Verifying correct data is present then echoing
            while ($row = mysqli_fetch_assoc($result)) {
                if ($row !== null && $row['pid'] === $pid && $row['title'] !== null && $row['latitude'] !== null && $row['longitude'] !== null) {
                    array_push($resultArr, $row);
                }
            }
            $JSON = "{\"success\" : true, \"results\" : " . json_encode($resultArr) . "}";
            echo $JSON;
            $status = 200;
        } else {
            //Error if no conversations are found
            $JSON = "{\"success\" : false, \"error\" : \"No Conversations Found\"}";
            echo $JSON;
            $status = 204;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }

    //Method for handling the operation of polling a user requested creation
    public function pollConversationList($connect, $pid, $timestamp) {
        //Checking and preparing parameters
        $timestamp = $connect->real_escape_string($timestamp);
        //Building sql query to search for conversations and sending to database
        $sql = "SELECT * FROM conversations WHERE pid = $pid";
        $result = mysqli_query($connect, $sql);
        //Checking if any conversations were found
        if ($result->num_rows > 0){
            $resultArr = [];
            //Checking each item in result list
            while ($row = mysqli_fetch_assoc($result)) {
                if ($row !== null && $row['pid'] === $pid && $row['created'] !== null) {
                    //Comparing against the timestamp to determine if it is newly created
                    $date = DateTime::createFromFormat('Y-m-d H:i:s', $row['created']);
                    $formattedDate = $date->getTimestamp();
                    if ($formattedDate >= $timestamp) {
                        array_push($resultArr, $row);
                    }
                }
            }
            //Checking if any newly created conversations have been found and returning if true
            if(count($resultArr) > 0) {
                $JSON = "{\"success\" : true}";
                echo $JSON;
                $status = 200;
            } else {
                //Status if no newly created conversations are found
                $JSON = "{\"success\" : false}";
                echo $JSON;
                $status = 204;
            }
        } else {
            //Error if no conversations are found
            $JSON = "{\"success\" : false}";
            echo $JSON;
            $status = 204;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }

    //function to determine the path of a list conversation request
    public function listConversations($connect, $query) {
        //Checking and preparing parameters
        $pid = '';          
        $timestamp = '';
        $queries = explode('&', $query);
        $pid = $this->checkQueryValue($queries, 'pid=');
        $timestamp = $this->checkQueryValue($queries, 'timestamp=');
        if($pid !== null && $timestamp === null){
            $this->getConversationList($connect, $pid);
        } else if ($pid !== null && $timestamp !== null){
            $this->pollConversationList($connect, $pid, $timestamp);
        } else {
            //Error if query data is invalid
            $JSON = "{\"success\" : false, \"error\" : \"Invalid Query Parameter Data\"}";
            echo $JSON;
            $status = 400;
        }
    }
    
    //Method for handling the operation when a user creates a conversation
    public function createConversation($connect, $body) {   
        //Checking and preparing parameters
        if ($body !== null && $body->pid !== null && $body->title !== null && $body->latitude !== null && $body->longitude !== null) {
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
                //Checking response data for webhook result
                if($responseData === 'Webhook accepted.'){
                    $timestamp = time();
                    $JSON = "{\"success\" : true, \"timestamp\" : " . $timestamp . "}";
                    echo $JSON;
                    $status = 200;
                } else {
                    //Error if webhook was rejected
                    $JSON = "{\"success\" : false, \"error\" : \"Webhook Rejected.\"}";
                    echo $JSON;
                    $status = 500;
                }
        } else {
            //Error if body data is missing
            $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
            echo $JSON;
            $status = 400;
        }
        //Free memory from output
        http_response_code($status);
    }
    
    //Method for handling the operation when a user deletes a conversation
    public function deleteConversation($connect, $query) {
        //Checking and preparing parameters
        $pid = '';        
        $cid = '';
        $queries = explode('&', $query);
        $pid = $this->checkQueryValue($queries, 'pid=');
        $cid = $this->checkQueryValue($queries, 'cid=');
        if($pid != null && $cid != null){
            $cid = $connect->real_escape_string($cid);
            //Building sql query to search for the conversation and sending to database
            $sql = "SELECT * FROM conversations WHERE pid = $pid AND cid = '$cid'";
            $result = mysqli_query($connect, $sql);
            //Checking if any conversations were found
            if ($result->num_rows === 1) {
                //Building sql query to delete conversation and sending to database if it exists
                $sql2 = "DELETE FROM conversations WHERE pid = $pid AND cid = '$cid'";
                $result2 = mysqli_query($connect, $sql2);
                //Sending conversation search again after deletion
                $result3 = mysqli_query($connect, $sql);
                //Verifying correct data is present then echoing
                if($result3-> num_rows === 0) {
                    $JSON = "{\"success\" : true}";
                    echo $JSON;
                    $status = 200;
                } else {
                    //Error if conversations are found
                    $JSON = "{\"success\" : false, \"error\" : \"Conversation Deletion Failed\"}";
                    echo $JSON;
                    $status = 500;
                }
            } else {
                //Error if no conversations are found
                $JSON = "{\"success\" : false, \"error\" : \"Conversation For Deletion Not Found\"}";
                echo $JSON;
                $status = 500;
            }
        } else {
            //Error if query data is invalid
            $JSON = "{\"success\" : false, \"error\" : \"Invalid Query Parameter Data\"}";
            echo $JSON;
            $status = 400;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }
    
//Conversation Page functions -----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Method for handling the operation of retrieving a user conversation
    public function getConversation($connect, $pid, $cid) {
        //Checking and preparing parameters
        $cid = $connect->real_escape_string($cid);
        //building sql query to search for the conversation and sending to database
        $sql = "SELECT * FROM conversations WHERE pid = $pid AND cid = '$cid'";
        $result = mysqli_query($connect, $sql);
        //Checking if any conversations were found
        if ($result->num_rows > 0) {
            //Ensuring there is only 1 conversation identified
            if ($result->num_rows === 1) {
                $resultObj;
                //Verifying correct data is present
                $row = mysqli_fetch_assoc($result);
                if ($row !== null && $row['cid'] === $cid && $row['pid'] === $pid && $row['title'] !== null && $row['messages'] !== null) {
                    //Building request object and echoing
                    $resultObj['title'] = $row['title'];
                    $resultObj['messages'] = $row['messages'];
                    $JSON = "{\"success\" : true, \"result\" : " . json_encode($resultObj) . "}";
                    echo $JSON;
                    $status = 200;
                }else {
                    //Error if record does not match
                    $JSON = "{\"success\" : false, \"error\" : \"Record Does Not Match Expected Result\"}";
                    echo $JSON;
                    $status = 500;
                }
            } else {
                //Error if multiple conversations are found
                $JSON = "{\"success\" : false, \"error\" : \"Multiple Conversations Found\"}";
                echo $JSON;
                $status = 500;
            }
        } else {
            //Error if no conversations are found
            $JSON = "{\"success\" : false, \"error\" : \"No Conversations Found\"}";
            echo $JSON;
            $status = 500;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }
    
    //Method for handling the operation of polling a user requested conversation update
    public function pollConversation($connect, $pid, $cid, $timestamp) {
        //Checking and preparing parameters
        $cid = $connect->real_escape_string($cid);
        $timestamp = $connect->real_escape_string($timestamp);
        //Building sql query to search for the conversation and sending to database
        $sql = "SELECT * FROM conversations WHERE pid = $pid AND cid = '$cid'";
        $result = mysqli_query($connect, $sql);
        //Checking if any conversations were found
        if ($result && $result->num_rows > 0){
            //Ensuring there is only 1 conversation identified
            if ($result->num_rows === 1) {
                $resultIndicator = false;
                $row = mysqli_fetch_assoc($result);
                if ($row !== null && $row['pid'] === $pid && $row['cid'] === $cid && $row['updated'] !== null) {
                    //Comparing against the timestamp to determine if it has been recently updated
                    $date = DateTime::createFromFormat('Y-m-d H:i:s', $row['updated']);
                    $formattedDate = $date->getTimestamp();
                    if ($formattedDate >= $timestamp) {
                        $resultIndicator = true;
                    }
                    //Verifying correct data is present and echoing
                    if($resultIndicator === true) {
                        $JSON = "{\"success\" : true}";
                        echo $JSON;
                        $status = 200;
                    }else {
                        //Status if conversation has not been updated
                        $JSON = "{\"success\" : false}";
                        echo $JSON;
                        $status = 204;
                    }
                }else {
                    //Error if record does not match
                    $JSON = "{\"success\" : false, \"error\" : \"Record Does Not Match Expected Result\"}";
                    echo $JSON;
                    $status = 500;
                }
            }else {
                //Error if multiple records are found
                $JSON = "{\"success\" : false, \"error\" : \"Multiple Conversations Found\"}";
                echo $JSON;
                $status = 500;
            }
        }else{
            //Error if no conversation is found
            $JSON = "{\"success\" : false, \"error\" : \"No Conversations Found\"}";
            echo $JSON;
            $status = 500;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }
    
    //function to determine the path of a read conversation request
    public function readConversation($connect, $query) {
        //Checking and preparing parameters
        $cid = '';
        $pid = '';          
        $timestamp = '';      
        $queries = explode('&', $query);
        $cid = $this->checkQueryValue($queries, 'cid=');
        $pid = $this->checkQueryValue($queries, 'pid=');
        $timestamp = $this->checkQueryValue($queries, 'timestamp=');
        if($cid !== null && $pid !== null && $timestamp === null){
            $this->getConversation($connect, $pid, $cid);
        } else if ($cid !== null && $pid !== null && $timestamp !== null){
            $this->pollConversation($connect, $pid, $cid, $timestamp);
        } else {
            //Error if query data is invalid
            $JSON = "{\"success\" : false, \"error\" : \"Invalid Query Parameter Data\"}";
            echo $JSON;
            $status = 400;
        }
    }
    
    //Method for handling the operation when a user sends a message to a conversation
    public function sendConversation($connect, $body)  {
        //Checking and preparing parameters
        if ($body !== null && $body->pid !== null && $body->cid !== null && $body->message !== null) {
            $pid = $body->pid;
            $cid = $connect->real_escape_string($body->cid);
            //Building sql query to search for the conversation and sending to database
            $sql = "SELECT * FROM conversations WHERE pid = $pid AND cid = '$cid'";
            $result = mysqli_query($connect, $sql);
            //Checking if any conversations were found
            if ($result && $result->num_rows > 0) {
                //Ensuring there is only 1 conversation identified
                if ($result->num_rows === 1) {
                    $resultObj;
                    $row = mysqli_fetch_assoc($result);
                    //Unsure why this was causing an issue but pid was not coming back as an integer, so I have cast it manually
                    if ($row !== null && $row['cid'] === $cid && (int)$row['pid'] === $pid && $row['messages'] !== null) {
                        //Retrieving the last message id
                        $newMessages = json_decode($row['messages']);
                        $lastMessage = end($newMessages);
                        //Checking if last message was an assistant message for synchronization
                        if ($lastMessage->role === 'assistant') {
                            //Creating new message from user message
                            $newMessageObject;
                            $newMessageObject['id'] = $lastMessage->id + 1;
                            $newMessageObject['role'] = 'user';
                            $newMessageObject['content'] = $body->message;
                            //Adding new message to message list
                            array_push($newMessages, $newMessageObject);
                            //Formatting variables for http request
                            $resultObj['cid'] = $row['cid'];
                            $resultObj['pid'] = $row['pid'];
                            $resultObj['messages'] = $newMessages;
                            $url = 'https://freddierouget-h.cyclr.uk/api/webhook/NNBcMlQq'; //Webhook URL
                            $jsonBody = json_encode($resultObj);
                            $requestConfig = array('http' => array(
                                'method' => 'POST',
                                'header' => 'Content-type: application/json',
                                'content' => $jsonBody
                            ));
                            //Creating the stream context
                            $context  = stream_context_create($requestConfig);
                            //Making the POST request
                            $response = file_get_contents($url, false, $context);
                            //Checking response data for webhook result
                            if(json_decode($response) === 'Webhook accepted.'){
                                $timestamp = time();
                                $JSON = "{\"success\" : true, \"timestamp\" : " . $timestamp . "}";
                                echo $JSON;
                                $status = 200;
                            } else {
                                //Error if webhook was rejected
                                $JSON = "{\"success\" : false, \"error\" : \"Webhook Rejected\"}";
                                echo $JSON;
                                $status = 500;
                            }
                        }else {
                        //Error if last conversation message was from a user
                        $JSON = "{\"success\" : false, \"error\" : \"Last Message Already Sent By User\"}";
                        echo $JSON;
                        $status = 500;
                        }
                    }else {
                        //Error if conversation details are not returned
                        $JSON = "{\"success\" : false, \"error\" : \"Conversation Record Data Could Not Be Retrieved\"}";
                        echo $JSON;
                        $status = 500;
                    }
                } else {
                    //Error if multiple conversations are found
                    $JSON = "{\"success\" : false, \"error\" : \"Multiple Conversations Found\"}";
                    echo $JSON;
                    $status = 500;
                }   
            } else {
                //Error if no conversations are found
                $JSON = "{\"success\" : false, \"error\" : \"No Conversations Found\"}";
                echo $JSON;
                $status = 500;
            }
        } else {
            //Error if body data is missing
            $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
            echo $JSON;
            $status = 400;
        }   
        //Free memory from output
        http_response_code($status);
    }
    
//Integration functions --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    //Method for handling the operation when the creation cycle has completed its task
    public function saveAndReturnCreation($connect, $body) {
        //Checking and preparing parameters
        if($body !== null && $body->cid !== null && $body->pid !== null && $body->title !== null && $body->messages !== null && $body->latitude !== null && $body->longitude !== null){
            //Ensuring the AI has correctly interpreted the request
            if($body->messages[1]->content === 'Awaiting questions' || $body->messages[1]->content === 'Awaiting questions.') {
                //Further checking and preparing of parameters
                $cid = $connect->real_escape_string($body->cid);
                $pid = $body->pid;
                $title = $connect->real_escape_string($body->title);
                $messages = $connect->real_escape_string(json_encode($body->messages));
                $latitude = $connect->real_escape_string($body->latitude);
                $longitude = $connect->real_escape_string($body->longitude);
                //Building sql query to add the new conversation and sending to database
                $sql = "INSERT INTO `conversations` (`cid`, `pid`, `title`, `messages`, `latitude`, `longitude`) VALUES ('$cid', '$pid', '$title', '$messages', '$latitude', '$longitude')";
                mysqli_query($connect, $sql);
                //Building sql query to check that the conversation was created and sending to database
                $sql2 = "SELECT * FROM `conversations` WHERE `cid` = '$cid' AND `pid` = '$pid' AND `latitude` = '$latitude' AND `longitude` = '$longitude'  ORDER BY cid DESC LIMIT 1";
                $result = mysqli_query($connect, $sql2);
                //Verifying correct data is present and echoing
                if ($result !== false && mysqli_num_rows($result) > 0) {
                    $JSON = "{\"success\" : true, \"cid\" : " . $cid . "}";
                    echo $JSON;
                    $status = 201;
                } else {
                    //Error if the conversation was not created
                    $JSON = "{\"success\" : false,\"error\" : \"Record Creation For This Conversation Failed.\"}";
                    echo $JSON;
                    $status = 500;
                }
            } else {
                //Error if content did not return as expected
                $JSON = "{\"success\" : false,\"error\" : \"ChatGPT Component did not produce expected response.\"}";
                echo $JSON;
                $status = 500;
            }
        } else {
            //Error if body data is missing
            $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
            echo $JSON;
            $status = 400;
        }
        //Free memory from output
        mysqli_free_result($result);
        http_response_code($status);
    }

    //Method for handling the operation when the reply cycle has completed its task
    public function saveAndReturnReply($connect, $body) {
        //Checking and preparing parameters
        if($body !== null && $body->cid  !== null && $body->pid !== null && $body->messages !== null){
            $timestamp = time();
            //formatting variables for sql query
            $pid = $body->pid;
            $cid = $connect->real_escape_string($body->cid);
            $messages = $connect->real_escape_string(json_encode($body->messages));
            //Building sql query to update the conversation and sending to database
            $sql = "UPDATE `conversations` SET `messages` = '$messages' WHERE `cid` = '$cid' AND `pid` = $pid";
            $result = mysqli_query($connect, $sql);
            //Building sql query to check that the conversation was created and sending to database
            $sql2 = "SELECT * FROM `conversations` WHERE `cid` = '$cid' AND `pid` = '$pid'";
            $result2 = mysqli_query($connect, $sql2);
            //Checking if any conversations were found
            if ($result2 !== false && mysqli_num_rows($result2) > 0) {
                //Ensuring there is only 1 conversation identified
                if ($result2->num_rows === 1) {
                    $resultIndicator = false;
                    $row = mysqli_fetch_assoc($result2);
                    //Unsure why this was causing an issue but pid was not coming back as an integer, so I have cast it manually
                    if ($row !== null && (int)$row['pid'] === $pid && $row['cid'] === $cid && $row['updated'] !== null) {
                        //Comparing updated date to current timestamp to ensure it has been correctly updated
                        $date = DateTime::createFromFormat('Y-m-d H:i:s', $row['updated']);
                        $formattedDate = $date->getTimestamp();
                        if ($formattedDate >= $timestamp) {
                            $resultIndicator = true;
                        }
                        //Verifying correct data is present and echoing
                        if($resultIndicator) {
                            $JSON = "{\"success\" : true, \"cid\" : " . $cid . "}";
                            echo $JSON;
                            $status = 201;
                        }else {
                            //Error if conversation has not been updated
                            $JSON = "{\"success\" : false,\"error\" : \"Record not updated\"}";
                            echo $JSON;
                            $status = 500;
                        }
                    }else {
                        //Error if record does not match
                        $JSON = "{\"success\" : false, \"error\" : \"Record Does Not Match Expected Result\"}";
                        echo $JSON;
                        $status = 500;
                    }
                }else {
                    //Error if multiple records are found
                    $JSON = "{\"success\" : false, \"error\" : \"Multiple Conversations Found\"}";
                    echo $JSON;
                    $status = 500;
                }
            } else {
                //Error if the conversation was not found
                $JSON = "{\"success\" : false, \"error\" : \"No Conversations Found\"}";
                echo $JSON;
                $status = 500;
            }
        } else {
            //Error if body data is missing
            $JSON = "{\"success\" : false, \"error\" : \"Missing Request Body Data\"}";
            echo $JSON;
            $status = 400;
        }
        http_response_code($status);
    }
}

//set response code, free output from memory and close connection
http_response_code($status);
mysqli_close($connect);


?>
