requirejs.config({
   
    paths: {
        firebase: '../vendor/firebase',
        jsencrypt: '../vendor/jsencrypt.min'
        
    },
    
    packages: [
        {
            name: 'crypto-js',
            location: '../vendor/crypto-js',
            main: 'index'
        }
    ],
    
    shim: {
        firebase: {
            exports: 'firebase'
        }
    }
});

require([ 'firebase', 'jsencrypt', "crypto-js" ], 
    function( firebase, JSEncrypt, CryptoJS, AES ){
    
    window.JSEncrypt = JSEncrypt.JSEncrypt;
    
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyCyeTX2FZcJBRaDUxAMfHXvp38EqExMPXc",
        authDomain: "swift-login-ba197.firebaseapp.com",
        databaseURL: "https://swift-login-ba197.firebaseio.com",
        storageBucket: "swift-login-ba197.appspot.com",
        messagingSenderId: "61617708225"
    };
    
    var crypt, userId, privateKey = null, publicKey = null, deviceName;
    
    firebase.initializeApp(config);
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            userId = user.uid;
            
            // TODO: Identify OS from Usergent.
            firebase.database().ref( 'users/' + userId + '/deviceDetails/OS' ).set("Windows");

            
            // Clear sessions in firebase.
            firebase.database().ref( 'users/' + userId + '/sessions' ).set("");
            
            // Listen for changes and on change, get all sessions.
                // Decrypt symmetric key using private key.
                // Decrypt sessions string using symmetric key.
                // create session objects by parsing JSON from base64 string.
                // create tabs and cookies using session objects.
            firebase.database()
                .ref('users/' + userId+ '/sessions')
                .on('value', createSessions);
            
            // Listen for sessionsToRemove and on chnage, get all sessions.
                // Decrypt symmetric key using private key.
                // Decrypt sessionsToRemove string using symmetric key.
                // create session objects by parsing JSON from base64 string.
                // Remove cookies using session objects.
                // Close tabs matching tabUrl.
            firebase.database()
                .ref('users/' + userId+ '/sessionsToRemove')
                .on('value', removeSessions);
            
            firebase.database().ref('users/' + userId + '/deviceDetails/name').on('value', function(snapshot) {
                deviceName = snapshot.val();
                
                if( deviceName == null ){
                    firebase.database().ref( 'users/' + userId + '/deviceDetails/name' ).set("PC-XYZ");
                }
            });
            
        } else {
            // User is signed out.
            firebase.auth().signInAnonymously()
            .then(function() {
               console.log('Logged in as Anonymous!')
            }).catch(function(error) {
               var errorCode = error.code;
               var errorMessage = error.message;
               console.log(errorCode);
               console.log(errorMessage);
            });
        }
    });
    
    function createSessions(snapshot){
        var encSessions = snapshot.val();
        
        if( privateKey !== null && encSessions !== "" ){
            for(var key in encSessions){
                
                var sessions = encSessions[key]['sessions'],
                    esk = encSessions[key]['ESK'];
                
                console.log(esk);
//                console.log(sessions);
                
                var symKey = decryptSymmetricKey(esk);
                console.log(symKey);
                
                sessions = decryptSessions( sessions, symKey );
                console.log(sessions);
                
                sessions.forEach(function(session){
                    
                    session.cookies.forEach(function(cookie){
                        var details = {};
                        
                        details["url"] = cookie.url;
                        details["name"] = cookie.name;
                        details["value"] = cookie.value;
                        details["path"] = cookie.path;
                        details["expirationDate"] = parseInt(cookie.expirationDate);
                        
                        if( cookie.hasOwnProperty("domain") ){
                            details["domain"] = cookie.domain;
                        }
                        
                        if( cookie.hasOwnProperty("secure") ){
                            details["secure"] = true;
                        }
                        
                        if( cookie.hasOwnProperty("httpOnly") ){
                            details["httpOnly"] = true;
                        }
                        
                        chrome.cookies.set(details);                       
                    });
                    
                    chrome.tabs.create({
                        "url" : session.tabUrl 
                    });            
                });
                
            }
        }
        
        firebase.database().ref( 'users/' + userId + '/sessions' ).set( "" );
    }
    
    function removeSessions(snapshot){
        var encSessionsObj = snapshot.val();

        if( privateKey !== null && encSessionsObj !== "" ){
            for(var key in encSessionsObj){
                
                var sessions = encSessionsObj[key]['sessions'],
                    esk = encSessionsObj[key]['ESK'];
                   
                var symKey = decryptSymmetricKey(esk);
                sessions = decryptSessions( sessions, symKey );
                
//                console.log(sessions);
                
                sessions.forEach(function(session){
                    
                    session.cookies.forEach(function(cookie){
                        
                        chrome.cookies.remove({
                            url: cookie.url,
                            name: cookie.name
                        });
                        
                    });
                    
                    // Get All Remaining Cookie name using taburl and remove them.
                    
                    // Remove/Reload Tabs matching taburl.
                    
                    chrome.tabs.create({
                        "url" : session.tabUrl 
                    });            
                });
            }
        }
        
        firebase.database().ref( 'users/' + userId + '/sessionsToRemove' ).set( "" );
    }
    
    // Communication between popup and background.
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        
        switch(message.type){
            case 'getUid':
                // Create RSA key pair and upload public key to firebase
                var keyPair = generateRSAKeys();
                privateKey = keyPair.privateKey;
                publicKey = keyPair.publicKey;
                writePublicKey( publicKey, userId );
                
                sendResponse({
                    "userId": userId
                });
                break;
            case 'getName':
                logvar();
                sendResponse({
                   "deviceName" : deviceName
                });
                break;
            case 'setName' :
                firebase.database().ref( 'users/' + userId + '/deviceDetails/name' ).set( message.newName );
                break;
            case 'reset':
                
                break;
        }
        
    });
    
    function logvar(){
        console.log(deviceName);
    }
    
    function decryptSessions( encSessions, symKey ){
        
        // Decode Base64 encoded Symmetric Key.
        var key = CryptoJS.enc.Base64.parse(symKey);
        
        // Initialization vector for AES.
        var iv = CryptoJS.enc.Base64.parse('+qMzA0ph4QEtu+jmssYmWw==');
        
        // Decode Base64 encoded encrypted data.
        var encrypted = CryptoJS.enc.Base64.parse(atob(encSessions).replace(/(\n)/gm,""));
        
        // Decrypt data using Symmetric Key.
        var decrypted = CryptoJS.AES.decrypt({ ciphertext: encrypted }, key, { mode: CryptoJS.mode.CBC, iv: iv });
            
        // Base64 Encoded JSON session string.
        var decryptedSessions = decrypted.toString(CryptoJS.enc.Utf8);
        
        // Decode Base64 and Parse JSON.
        var sessions = JSON.parse(atob(decryptedSessions));
        
        return sessions;
    }
    
    function decryptSymmetricKey( esk ){
        if( privateKey != null ){
            return crypt.decrypt(atob(esk));
        }
    }
    
    function writePublicKey( pubKey, uId ){
        firebase.database().ref( 'users/' + uId + '/publicKey' ).set( pubKey );
    }
    
    function generateRSAKeys(){
        crypt = new JSEncrypt.JSEncrypt({default_key_size: 1024});
        crypt.getKey();
        
        var keyPair = {
            privateKey : crypt.getPrivateKey(),
            publicKey : crypt.getPublicKey()
                .replace('-----BEGIN PUBLIC KEY-----', '')
                .replace('-----END PUBLIC KEY-----', '')
                .replace(/(\n)/gm,"")
        };
        
        console.log(keyPair);
        return keyPair;
    }
    
    
});