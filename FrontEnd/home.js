window.addEventListener("load", function (evt) {
    const icon = document.querySelector('.icon');
    const menuButtons = document.querySelector('.menuButtons');
    
    icon.addEventListener('click', function () {
        menuButtons.classList.toggle('open');
    });
});
