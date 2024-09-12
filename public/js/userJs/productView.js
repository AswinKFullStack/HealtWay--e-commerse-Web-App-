
  function changeImage(image) {
    document.getElementById('mainImage').src = '/uploads/re-image/' + image;
  }

  const productImage = document.querySelector('.product-image');
  const zoomImage = document.querySelector('.zoom-img');

  productImage.addEventListener('mousemove', function(e) {
    const x = e.clientX - productImage.offsetLeft;
    const y = e.clientY - productImage.offsetTop;

    const xPercent = (x / productImage.offsetWidth) * 100;
    const yPercent = (y / productImage.offsetHeight) * 100;

    zoomImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    zoomImage.style.transform = 'scale(2.5)'; // Adjust the scale for the zoom effect
  });

  productImage.addEventListener('mouseleave', function() {
    zoomImage.style.transform = 'scale(1)'; // Reset the zoom when the mouse leaves
  });
