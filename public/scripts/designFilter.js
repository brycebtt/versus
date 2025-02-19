const button2 = document.querySelectorAll(".button-2");
const design_gallery = document.querySelectorAll(".design-gallery");

let prev_gallery = design_gallery[0];
let prev_selected = button2[0];

for (let i = 0; i < button2.length; i++) {
  button2[i].addEventListener("click", function () {
    console.log("click");
    prev_selected.classList.remove("b2-selected");
    prev_gallery.classList.add("hidden");
    button2[i].classList.add("b2-selected");
    design_gallery[i].classList.remove("hidden");
    prev_selected = button2[i];
    prev_gallery = design_gallery[i];
  });
}
