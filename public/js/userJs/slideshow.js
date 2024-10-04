

let slideIndex = 0;
const showSlides = () => {
    let slides = document.querySelector('.slides-wrapper');
    let totalSlides = document.querySelectorAll('.slide').length;
    
    slideIndex++;
    if (slideIndex >= totalSlides / 3) { // Adjust based on how many slides are visible at a time
        slideIndex = 0;
    }
    
    // Move the slides wrapper horizontally
    slides.style.transform = `translateX(-${slideIndex * 33.33}%)`; // Change the percentage based on the number of slides visible at once

    setTimeout(showSlides, 3000); // Move slides every 3 seconds
};

document.addEventListener('DOMContentLoaded', showSlides);
