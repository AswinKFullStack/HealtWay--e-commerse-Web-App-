// JavaScript for handling sidebar toggle on smaller screens
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const navbarToggler = document.querySelector('.navbar-toggler');

    navbarToggler.addEventListener('click', function () {
        sidebar.classList.toggle('active');
    });
});
