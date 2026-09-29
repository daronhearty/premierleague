document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");

    if (!menuButton || !nav) return;

    menuButton.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            nav.classList.remove("is-open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open menu");
        });
    });
});