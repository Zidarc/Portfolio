$(document).ready(function () {

    // Smooth scroll for all navigation links
    $('a.nav-link[href^="#"]').on('click', function (e) {
        e.preventDefault();

        const target = $(this.hash);
        if (!target.length) return;

        $('html, body').stop().animate({
            scrollTop: target.offset().top - 70
        }, 900, 'swing');
    });

});

const nav = document.getElementById("sidebar-nav");
const openBtn = document.getElementById("open-nav");
const closeBtn = document.getElementById("close-nav");
const header = document.getElementById("top-header");

openBtn.addEventListener("click", () => {
    nav.classList.add("open");
    openBtn.classList.add("hide");
    header.classList.add("hidden");
});

closeBtn.addEventListener("click", () => {
    nav.classList.remove("open");
    openBtn.classList.remove("hide");
    header.classList.remove("hidden");
});


// close when clicking a link
document.querySelectorAll(".nav-link").forEach(link =>
    link.addEventListener("click", () => {
        nav.classList.remove("open");
        openBtn.classList.remove("hide");
        header.classList.remove("hidden");
    })
);
window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});
