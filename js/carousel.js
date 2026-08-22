"use strict";
function initCarousel() {
    const carousel = document.querySelector(".logo-carousel");
    if (!carousel)
        return;
    const track = carousel.querySelector(".logo-carousel__track");
    const slides = carousel.querySelectorAll(".logo-carousel__slide");
    const dotsContainer = carousel.querySelector(".carousel-dots");
    if (!track || !dotsContainer || slides.length === 0)
        return;
    const trackEl = track;
    const slidesList = slides;
    const dotsEl = dotsContainer;
    let idx = 0;
    let timer = null;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    slides.forEach((slide, i) => {
        const panelId = slide.id || `carousel-panel-${i + 1}`;
        const tabId = `carousel-tab-${i + 1}`;
        slide.id = panelId;
        slide.setAttribute("role", "tabpanel");
        slide.setAttribute("aria-labelledby", tabId);
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = `carousel-dot${i ? "" : " is-active"}`;
        tab.id = tabId;
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-label", `Grupo ${i + 1}`);
        tab.setAttribute("aria-controls", panelId);
        tab.setAttribute("aria-selected", i ? "false" : "true");
        tab.tabIndex = i ? -1 : 0;
        tab.addEventListener("click", () => {
            activate(i, true);
            resetTimer();
        });
        dotsContainer.appendChild(tab);
    });
    const tabs = dotsContainer.querySelectorAll(".carousel-dot");
    function activate(i, focusTab) {
        idx = i;
        trackEl.style.transform = `translateX(-${i * 100}%)`;
        slidesList.forEach((slide, n) => {
            const active = n === i;
            slide.setAttribute("aria-hidden", active ? "false" : "true");
            slide.setAttribute("tabindex", active ? "0" : "-1");
        });
        tabs.forEach((tab, n) => {
            const active = n === i;
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", active ? "true" : "false");
            tab.tabIndex = active ? 0 : -1;
            if (focusTab && active)
                tab.focus();
        });
    }
    dotsEl.addEventListener("keydown", (event) => {
        const last = tabs.length - 1;
        if (event.key === "ArrowRight") {
            event.preventDefault();
            activate((idx + 1) % tabs.length, true);
            resetTimer();
        }
        else if (event.key === "ArrowLeft") {
            event.preventDefault();
            activate((idx - 1 + tabs.length) % tabs.length, true);
            resetTimer();
        }
        else if (event.key === "Home") {
            event.preventDefault();
            activate(0, true);
            resetTimer();
        }
        else if (event.key === "End") {
            event.preventDefault();
            activate(last, true);
            resetTimer();
        }
    });
    function next() {
        activate((idx + 1) % slidesList.length, false);
    }
    function start() {
        if (!reduced) {
            stop();
            timer = setInterval(next, 5000);
        }
    }
    function stop() {
        if (timer)
            clearInterval(timer);
        timer = null;
    }
    function resetTimer() {
        stop();
        start();
    }
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", (event) => {
        if (!carousel.contains(event.relatedTarget))
            start();
    });
    activate(0, false);
    start();
}
document.addEventListener("DOMContentLoaded", initCarousel);
