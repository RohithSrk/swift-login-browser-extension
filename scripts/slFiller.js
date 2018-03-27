(function(){
    
    var SL_DATA = { email:"soumith@gmail.com", username:"soumith12", password:"53456dsf" };
    
    var textInputs = [],
        visibleTextInputs = [],
        emailInputs = [],
        visibleEmailInputs = [],
        passwordInputs = [],
        visiblePasswordInputs = [];
    
        passwordInputs = document.querySelectorAll('input[type="password"]');

    if(passwordInputs.length !== 0){
        window.addEventListener("click", function(){

            textInputs = document.querySelectorAll('input[type="text"]');
            emailInputs = document.querySelectorAll('input[type="email"]');
            passwordInputs = document.querySelectorAll('input[type="password"]');

            textInputs.forEach(function(input){
                if(input.clientHeight >= 6){
                    visibleTextInputs.push(input);
                }
            });

            emailInputs.forEach(function(input){
                if(input.clientHeight >= 6){
                    visibleEmailInputs.push(input);
                }
            });

            passwordInputs.forEach(function(input){
                if(input.clientHeight >= 6){
                    visiblePasswordInputs.push(input);
                }
            });

            try{
                if(visibleEmailInputs.length !==0){
                    visibleEmailInputs[0].value = SL_DATA.email;
                } else {

                    //add chooser

                    visibleTextInputs[0].value = SL_DATA.username;
                    visibleTextInputs[0].value = SL_DATA.email;

                }
                visiblePasswordInputs[0].value = SL_DATA.password;

            } catch(err) {}
        });


        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        window.dispatchEvent(evt); 
    }
})();