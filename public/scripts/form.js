const form_tabs=document.querySelectorAll(".tab"),next_form=document.querySelectorAll(".next-form"),prev_form=document.querySelectorAll(".prev-form"),submit=document.querySelector(".submit"),form_error=document.querySelectorAll(".form-error");function validateBtnForm(e,t){e[t].checkValidity()?next_tab(t):form_error[t].classList.remove("hidden")}function validateCheckbox(e,t){for(let r=0;r<e.length;r++)if(e[r].checked)return next_tab(t);form_error[t].classList.remove("hidden")}function next_tab(e){form_error[e].classList.add("hidden"),form_tabs[e].classList.remove("active-tab"),form_tabs[e+1].classList.add("active-tab"),window.scrollTo(0,0)}function validateTxtForm(e){for(let t=0;t<e.length-1;t++){if(e[t].checkValidity()){e[t].style.border="none",document.querySelectorAll(".label-group label")[t].style.color="white";continue}e[t].style.border="2px solid #ff170f",document.querySelectorAll(".label-group label")[t].style.color="#ff170f"}}for(let i=0;i<next_form.length;i++){let e=form_tabs[i].querySelectorAll("input");next_form[i].addEventListener("click",function(){"radio"==e[i].type?validateBtnForm(e,i):validateCheckbox(e,i)}),prev_form[i].addEventListener("click",function(){form_tabs[i+1].classList.remove("active-tab"),form_tabs[i].classList.add("active-tab"),window.scrollTo(0,0)})}submit.addEventListener("click",function(){validateTxtForm(form_tabs[4].querySelectorAll("input"))}),$(document).ready(function(){$(".form").on("submit",function(e){e.preventDefault(),$.ajax({url:"scripts/get_started.php",type:"POST",data:$(".form").serialize(),success:function(e){console.log("success")},error:function(e,t,r){alert(r)}}),form_tabs[4].classList.remove("active-tab"),document.querySelector(".submit-tab").classList.remove("hidden"),document.querySelector(".get-started-title").innerHTML="Thank You!",window.scrollTo(0,0),this.disabled=!0})});const phone_input=document.querySelector("input[type='tel']");function phone_format(e){return(e=e.replace(/[^\d]/g,"")).length>6?e.replace(/(\d{3})(\d{3})(\d{1,4})/,"($1) $2-$3"):e.length>3?e.replace(/(\d{3})(\d{1,3})/,"($1) $2"):e}phone_input.addEventListener("keydown",function(e){let t=e.keyCode;t>=48&&t<=57||8==t||e.preventDefault()}),phone_input.addEventListener("keyup",function(){this.value=phone_format(this.value)}),phone_input.addEventListener("input",function(){let e=this.value.replace(/[^\d]/g,"");for(;e.length>10;)e=e.replace(/^\d/,""),this.value=e});