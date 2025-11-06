const header = document.getElementById("header");
if (header) {
    fetch("/components/header.html")
        .then((res) => res.text())
        .then((html) => {
            header.outerHTML = html;
        });
}

const footer = document.getElementById("footer");
if (footer) {
    fetch("/components/footer.html")
        .then((res) => res.text())
        .then((html) => {
            footer.outerHTML = html;
            const yearBlock = document.getElementById("year");
            yearBlock && (yearBlock.textContent = new Date().getFullYear());
        });
}
