// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const message = document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            message.textContent = error.message;

            return;
        }

        window.location.href = "index.html";
    });
}


// ===============================
// CHECK SESSION
// ===============================

async function checkUserSession() {

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    const currentPage =
        window.location.pathname.split("/").pop();

    if (!session && currentPage === "index.html") {

        window.location.href = "login.html";

        return;
    }

    if (session && currentPage === "login.html") {

        window.location.href = "index.html";
    }
}

checkUserSession();


// ===============================
// LOGOUT
// ===============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {

            alert(error.message);

            return;
        }

        window.location.href = "login.html";
    });
}