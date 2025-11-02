document.addEventListener("DOMContentLoaded", function () {

    // encode URI component for search forms
    const elements = document.getElementsByClassName("search-form");
    if (elements) encoding(elements);

    // apply saved dark or light theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme) applyTheme(savedTheme);


    // apply saved font size
    const savedFontSize = localStorage.getItem('fontSize') || '1rem';
    if (savedFontSize) applyFontSize(savedFontSize);

    // Apply theme on radio change
    themeRadios = document.querySelectorAll('input[name^="theme"]');
    if (themeRadios) applyRadioTheme(themeRadios);

    fontRadios = document.querySelectorAll('input[name^="fontSize"]');
    if (fontRadios) applyRadioFont(fontRadios);


    // Initialize scroll to top button
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) initScrollToTop(scrollTopBtn);

    // Generate sidebar table of contents and create indentation
    const article = document.querySelector("article");
    const sidebar = document.querySelector("#sidebarContent ul");
    const contentBarSM = document.querySelector("#contentMenuSM ul");
    if (article && sidebar && contentBarSM) initSidebarTOC(article, sidebar, contentBarSM);


    // This is like a UI improvement for small screens showing the input when the svg is clicked
    const searchBtnSm = document.getElementById("searchButtonSm");
    if (searchBtnSm) showInputOnClick(searchBtnSm);

    const suggestions = document.getElementById('suggestions');
    // if (suggestions) suggestSearch(suggestions);
    const suggestionsBox = document.getElementById('suggestionList');
    suggestSearch(suggestionsBox);

});

function encoding(elements) {
    Array.from(elements).forEach(el => {
        el.addEventListener("submit", function (e) {
            e.preventDefault();
            const title = this.title.value.trim();
            if (title) window.location.href = `/search/${encodeURIComponent(title)}/`;
        });
    });
}

function applyTheme(theme) {
    const body = document.body;
    const navBar = document.getElementById("navBar");
    const themeToggle = theme === 'dark' ? 'bg-dark' : 'bg-light'

    body.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);
    body.classList.remove('bg-light', 'bg-dark');
    body.classList.add(themeToggle);

    if (!navBar) return;

    document.querySelectorAll(`input[value="${theme}"]`).forEach(el => el.checked = true);
    navBar.classList.remove('navbar-light', 'navbar-dark', 'bg-light', 'bg-dark');
    navBar.classList.add(
        theme === 'dark' ? 'navbar-dark' : 'navbar-light',
        themeToggle
    );

};

function applyFontSize(fontSize) {
    const introText = document.getElementsByClassName("intro-text")[0];
    const mainTextBody = document.querySelectorAll(".main-text-content");


    if (introText) introText.style.fontSize = fontSize;
    if (mainTextBody) mainTextBody.forEach(element => element.style.fontSize = fontSize);

    if (!introText || !mainTextBody) return;
    document.querySelectorAll(`input[value="${fontSize}"]`).forEach(el => el.checked = true);
}

function applyRadioTheme(radios) {
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const theme = e.target.value;
            document.querySelectorAll('input[name^="theme"]').forEach(r => {
                r.checked = r.value === theme;
            });
            localStorage.setItem('theme', theme);
            applyTheme(theme);
        });
    });
}

function applyRadioFont(radios) {
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const fontSize = e.target.value;
            document.querySelectorAll('input[name^="fontSize"]').forEach(r => {
                r.checked = r.value === fontSize;
            });
            localStorage.setItem('fontSize', fontSize);
            applyFontSize(fontSize);
        });
    });
}


function initScrollToTop(scrollTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initSidebarTOC(article, sidebar, contentBarSM) {
    const headers = article.querySelectorAll("h2, h3, h4, h5, h6");
    let isClickScrolling = false;

    // Sometimes wiki API gives article with one or less headers thus i've added this
    if (headers.length <= 1) {
        document.getElementById("sidebarContainer").classList.add("d-none");
        document.getElementById("sidebarContainer").classList.remove("d-md-block");
        document.getElementById("contentDropdownMenu").classList.remove("d-md-none");
        document.getElementById("contentDropdownMenu").classList.add("d-none");
        document.getElementById("mainContentContainer").classList.remove("col-md-8");
        document.getElementById("mainContentContainer").classList.add("col-md-10");
        return;
    }

    headers.forEach(header => {
        const level = parseInt(header.tagName.substring(1));

        const liSidebar = document.createElement("li");
        liSidebar.classList.add("fs-6", `ms-${(level - 2) * 2}`, "mb-2", "pb-1");
        const linkSidebar = document.createElement("a");
        linkSidebar.href = `#${header.id}`;
        linkSidebar.textContent = header.textContent;
        liSidebar.appendChild(linkSidebar);
        sidebar.appendChild(liSidebar);

        const liSM = document.createElement("li");
        liSM.classList.add("fs-6", `ms-${(level - 2) * 2}`, "mb-2", "pb-1");
        const linkSM = document.createElement("a");
        linkSM.href = `#${header.id}`;
        linkSM.textContent = header.textContent;
        liSM.appendChild(linkSM);
        contentBarSM.appendChild(liSM);
    });

    const observer = new IntersectionObserver((entries) => {
        if (isClickScrolling) return;
        entries.forEach(entry => {
            const id = entry.target.getAttribute("id");
            const linkSidebar = sidebar.querySelector(`a[href="#${id}"]`);
            const linkSM = contentBarSM.querySelector(`a[href="#${id}"]`);
            if (entry.isIntersecting) {

                sidebar.querySelectorAll("a").forEach(a => a.classList.remove("active"));
                linkSidebar?.classList.add("active");

                contentBarSM.querySelectorAll("a").forEach(a => a.classList.remove("active"));
                linkSM?.classList.add("active");
            }
        });
    }, { rootMargin: "0px 0px -99% 0px" });

    headers.forEach(h => observer.observe(h));

    sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            isClickScrolling = true;
            const target = document.querySelector(link.getAttribute("href"));
            sidebar.querySelectorAll("a").forEach(a => a.classList.remove("active"));
            link.classList.add("active");
            contentBarSM.querySelectorAll("a").forEach(a => a.classList.remove("active"));
            const correspondingSM = contentBarSM.querySelector(`a[href="${link.getAttribute("href")}"]`);
            correspondingSM?.classList.add("active");
            target.scrollIntoView({ behavior: "smooth" });
            setTimeout(() => {
                isClickScrolling = false;
            }, 500);
        });
    });

    contentBarSM.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            isClickScrolling = true;
            const target = document.querySelector(link.getAttribute("href"));
            contentBarSM.querySelectorAll("a").forEach(a => a.classList.remove("active"));
            link.classList.add("active");
            sidebar.querySelectorAll("a").forEach(a => a.classList.remove("active"));
            const correspondingSidebar = sidebar.querySelector(`a[href="${link.getAttribute("href")}"]`);
            correspondingSidebar?.classList.add("active");
            target.scrollIntoView({ behavior: "smooth" });
            setTimeout(() => {
                isClickScrolling = false;
            }, 500);
        });
    });
    stickyContentSM();
}

function stickyContentSM() {
    const dropdownMenu = document.getElementById("contentDropdownMenu");
    window.addEventListener('scroll', () => {
        if (window.scrollY >= 125) {
            dropdownMenu.classList.add("sticky-toc");
        } else {
            dropdownMenu.classList.remove("sticky-toc");
        }
    });
}

function showInputOnClick(button) {
    const navFormContainer = document.getElementById("navFormContainer");
    const navLogo = document.getElementById("navLogo");
    const navInput = document.querySelector("#navFormContainer form input");

    if (!navLogo || !navFormContainer) return;

    button.addEventListener("click", () => {
        navLogo.classList.add("hide");
        navFormContainer.classList.remove("d-md-block");
        navFormContainer.classList.remove("d-none");
        button.classList.add("hide");
        navInput.focus();
    });

    navInput.addEventListener("focusout", () => {
        navLogo.classList.remove("hide");
        button.classList.remove("hide");

        navFormContainer.classList.add("d-md-block");
        navFormContainer.classList.add("d-none");
    });

    window.addEventListener('resize', () => {
        const isLargeScreen = window.innerWidth >= 768; // Adjust if your md breakpoint is different
        if (isLargeScreen) {
            // On large screens, ensure form is in default "visible" state
            navLogo.classList.remove("hide");
            button.classList.remove("hide");
            navFormContainer.classList.add("d-md-block");
            navFormContainer.classList.add("d-none");
        } else {
            // On small screens, ensure form is in default "hidden" state
            navLogo.classList.remove("hide");
            button.classList.remove("hide");
            navFormContainer.classList.add("d-md-block");
            navFormContainer.classList.add("d-none");
        }
    });
}

function suggestSearch(suggestionsBox) {
    const searchInput = document.querySelector('input[name="title"]');
    const searchBar = document.getElementById("searchBar");
    let controller;
    const suggestionsCache = {};  // Cache object: {query: [suggestions]}

    // Function to toggle has-value based on suggestion box state
    const toggleHasValue = () => {
        if (suggestionsBox.children.length > 0 && !suggestionsBox.classList.contains('d-none')) {
            searchBar.classList.add('has-value');
        } else {
            searchBar.classList.remove('has-value');
        }
    };

    const displaySuggestions = (suggestions) => {
        suggestionsBox.innerHTML = '';
        if (suggestions.length > 0) {
            suggestionsBox.classList.remove('d-none');
            suggestions.forEach(title => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'list-group-item list-group-item-action';
                item.textContent = title;
                item.addEventListener('click', () => {
                    searchInput.value = title;
                    suggestionsBox.classList.add('d-none');
                    toggleHasValue();
                    searchInput.form.submit();
                });
                suggestionsBox.appendChild(item);
            });
            toggleHasValue();
        } else {
            suggestionsBox.classList.add('d-none');
            toggleHasValue();
        }
    };

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add('d-none');
            toggleHasValue();
        }
    });

    searchInput.addEventListener('input', function () {
        const query = this.value.trim();
        suggestionsBox.innerHTML = '';

        if (controller) controller.abort();
        
        if (!query) {
            suggestionsBox.classList.add('d-none');
            toggleHasValue();
            return;
        }
        if (suggestionsCache[query]) {
            displaySuggestions(suggestionsCache[query]);
            return;
        }

        setTimeout(async () => {
            controller = new AbortController();
            
            try {
                const response = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(query)}`,
                    { signal: controller.signal }
                );
                const data = await response.json();
                const suggestions = data[1];

                suggestionsCache[query] = suggestions;

                displaySuggestions(suggestions);
            } catch (err) {
                if (err.name !== 'AbortError') console.error(err);
                suggestionsBox.classList.add('d-none');
                toggleHasValue();
            }
        }, 750);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() && suggestionsBox.children.length > 0) {
            suggestionsBox.classList.remove('d-none');
            toggleHasValue();
        }
    });
}
