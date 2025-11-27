const githubUser = "vinicius-soares2";

        document.addEventListener("DOMContentLoaded", () => {
            const themeBtn = document.getElementById("themeToggle");

            if (localStorage.getItem("theme") === "light")
                document.body.classList.add("light");

            themeBtn.onclick = () => {
                document.body.classList.toggle("light");
                localStorage.setItem(
                    "theme",
                    document.body.classList.contains("light") ? "light" : ""
                );
            };

            const pages = document.querySelectorAll("section");
            const menuLinks = document.querySelectorAll("nav a");

            menuLinks.forEach(link => {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    pages.forEach(p => p.classList.remove("active"));
                    document.querySelector(link.getAttribute("href")).classList.add("active");
                });
            });

            fetch(`https://api.github.com/users/${githubUser}`)
                .then(r => r.json())
                .then(data => {
                    document.getElementById("avatar").src = data.avatar_url;
                });

            fetch(`https://api.github.com/users/${githubUser}/repos`)
                .then(r => r.json())
                .then(repos => {
                    const grid = document.getElementById("projectsGrid");
                    repos.forEach(repo => {
                        const div = document.createElement("div");
                        div.className = "project";
                        div.innerHTML = `
                            <h2>${repo.name}</h2>
                            <p>${repo.description || "Sem descrição."}</p>
                            <a href="${repo.html_url}" target="_blank">Ver no GitHub</a>
                        `;
                        grid.appendChild(div);
                    });
                });
        });