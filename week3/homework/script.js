const largeImage = document.getElementById('largeImage');
const thumbnailButtons = document.querySelectorAll('.small-image button');

thumbnailButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const thumbImg = btn.querySelector('img');
    largeImage.src = thumbImg.src;
    largeImage.alt = thumbImg.alt;
  });
});