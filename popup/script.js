(function(){
    
    var displayName = $("name"),
        inputWrap = $("edit-device-name"),
        inputEle = $('name-input'),
        saveNameBtn = $('save');
    
    updateName();
    
    displayName.addEventListener( 'click', function(e){
        displayName.classList.add("hidden");
        inputWrap.classList.remove("hidden");
    });
    
    saveNameBtn.addEventListener( 'click', function(e){
        inputWrap.classList.add("hidden");
        displayName.classList.remove("hidden");
        var name = inputEle.value;
        
        if( name != '' ){
            chrome.runtime.sendMessage({
                type: 'setName',
                newName : name
            }, function (response) {
                updateName();
            });
        }
    });
    
    chrome.runtime.sendMessage({
        type: 'getUid'
    }, function (response) {  
        new QRCode(document.getElementById("qrcode"), response.userId);
    });
    
    function updateName(){
        chrome.runtime.sendMessage({
            type: 'getName'
        }, function (response) {
            inputEle.value = displayName.textContent = response.deviceName;
        });
    }

    function $(q){ return document.getElementById(q); }
    
})();