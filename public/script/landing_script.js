let carousel = document.querySelector(".carousel");
let arrowBtn = document.querySelectorAll(".wrapper i");
const firstImg = carousel.querySelectorAll("img")[0];
let isMove = false,
  prevPageX,
  prevScrollLeft;
let firstImgWidth = firstImg.clientWidth + 14;

const draggingStart = (e) => {
  isMove = true;
  prevPageX = e.pageX || e.touches[0].pageX; // get the x position of the mouse or touch
  prevScrollLeft = carousel.scrollLeft;
};

const dragging = (e) => {
  if (!isMove) return;
  e.preventDefault();
  carousel.classList.add("dragging");
  let posisionDiff = (e.pageX || e.touches[0].pageX) - prevPageX;
  carousel.scrollLeft = prevScrollLeft - posisionDiff;
  showHideBtn();
};
const draggingStop = () => {
  isMove = false;
  carousel.classList.remove("dragging");
};

const showHideBtn = () => {
  let scrollWidth = carousel.scrollWidth - carousel.clientWidth; // gettting the width of the scrollable area
  arrowBtn[0].style.display = carousel.scrollLeft == 0 ? "none" : "block";
  arrowBtn[1].style.display =
    carousel.scrollLeft == scrollWidth ? "none" : "block";
};
arrowBtn.forEach((element) => {
  element.addEventListener("click", () => {
    // if clicked left button, scroll to left, if clicked right button, scroll to right
    carousel.scrollLeft +=
      element.id === "left" ? -firstImgWidth : firstImgWidth;
    setTimeout(() => showHideBtn(), 60); // call showHideBtn after 60ms
  });
});

carousel.addEventListener("mousedown", draggingStart);
carousel.addEventListener("touchstart", draggingStart);

carousel.addEventListener("mousemove", dragging);
carousel.addEventListener("touchmove", dragging);

carousel.addEventListener("mouseup", draggingStop);
carousel.addEventListener("touched", draggingStop);
