// Below is the codes from the youtube video teaching how to make a horizontal gallery with dragging and touch effect
let carousel = document.querySelector("#h-gallery");
const firstImg = carousel.querySelectorAll("img")[0];
let isMove = false;
let prevPageX;
let prevScrollLeft;
let firstImgWidth = firstImg.clientWidth;

const draggingStart = (e) => {
  isMove = true;
  prevPageX = e.pageX || e.touches[0].pageX; // Get the x position of the mouse or touch
  prevScrollLeft = carousel.scrollLeft;
};

const dragging = (e) => {
  if (!isMove) return;
  e.preventDefault();
  // Carousel.classList.add("dragging");
  let positionDiff = (e.pageX || e.touches[0].pageX) - prevPageX;
  carousel.scrollLeft = prevScrollLeft - positionDiff;
};

const draggingStop = () => {
  isMove = false;
  // Carousel.classList.remove("dragging");
};
carousel.addEventListener("mousedown", draggingStart);
carousel.addEventListener("touchstart", draggingStart);

carousel.addEventListener("mousemove", dragging);
carousel.addEventListener("touchmove", dragging);

carousel.addEventListener("mouseup", draggingStop);
carousel.addEventListener("touched", draggingStop);