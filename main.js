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

// Intersection Observer for scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe sections
    const sectionsToAnimate = [
        document.getElementById('intro-section'),
        document.getElementById('education-section'),
        document.getElementById('container-2'),
        document.getElementById('container-3')
    ];

    sectionsToAnimate.forEach(section => {
        if (section) {
            observer.observe(section);
        }
    });

    // Observe education items with staggered delay
    const educationItems = document.querySelectorAll('.education-item');
    educationItems.forEach(item => {
        if (item) {
            observer.observe(item);
        }
    });

    // Observe skill icons with staggered delay
    const skillIcons = document.querySelectorAll('.iconSkill');
    skillIcons.forEach((icon, index) => {
        if (icon) {
            // Add delay based on index for staggered effect
            icon.style.transitionDelay = `${(index % 4) * 0.1}s`;
            observer.observe(icon);
        }
    });
}

// Initialize scroll animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}