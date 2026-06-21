/* =========================================
   STARS BACKGROUND
========================================= */

const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];

function createStars() {

    stars = [];

    for (let i = 0; i < 250; i++) {

        stars.push({

            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,

            radius: Math.random() * 2,

            alpha: Math.random(),

            speed: Math.random() * 0.02 + 0.003

        });

    }

}

createStars();

function animate() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {

        star.alpha += star.speed;

        if (star.alpha >= 1 || star.alpha <= 0) {
            star.speed *= -1;
        }

        ctx.beginPath();

        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;

        ctx.fill();

    });

    requestAnimationFrame(animate);

}

animate();

window.addEventListener("resize", () => {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    createStars();

});


/* =========================================
   PASSWORD SYSTEM
========================================= */

const PASSWORD = "cutie2026";

const input = document.getElementById("password");
const loginCard = document.getElementById("loginCard");
const button = document.getElementById("unlockBtn");
const error = document.getElementById("error");

button.addEventListener("click", () => {

    if (input.value === PASSWORD) {

        error.style.color = "#7dff7d";
        error.textContent = "Identity Verified ✓";

        button.disabled = true;
        button.textContent = "Verifying...";

        setTimeout(() => {

            loginCard.classList.add("fade-out");

        }, 1500);

        setTimeout(() => {

            window.location.href = "birthday.html";

        }, 2500);

    } else {

        error.style.color = "#ff6b6b";
        error.textContent = "Incorrect Secret Key";

        input.value = "";
        input.focus();

        // Shake Animation
        input.classList.add("shake");

        setTimeout(() => {

            input.classList.remove("shake");

        }, 400);

    }

});


/* =========================================
   ENTER KEY SUPPORT
========================================= */

input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        button.click();

    }

});