const button2=document.querySelectorAll(".button-2"),home_gallery=document.querySelectorAll(".home-gallery"),price=document.querySelectorAll(".price");let prev_gallery=home_gallery[0],prev_price=price[0],prev_selected=button2[0];for(let i=0;i<button2.length;i++)button2[i].addEventListener("click",function(){prev_selected.classList.remove("b2-selected"),prev_gallery.classList.add("hidden"),prev_price.classList.add("hidden"),button2[i].classList.add("b2-selected"),home_gallery[i].classList.remove("hidden"),price[i].classList.remove("hidden"),prev_selected=button2[i],prev_gallery=home_gallery[i],prev_price=price[i]});