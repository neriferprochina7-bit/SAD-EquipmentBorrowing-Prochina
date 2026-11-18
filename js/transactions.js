// ==========================================
// BORROWING TRANSACTIONS
// ==========================================


// ==========================================
// SAVE BORROWING TRANSACTION
// ==========================================

async function saveBorrowingTransaction() {

    const borrowerName =
        document.querySelector("#borrowerName").value.trim();

    const borrowerType =
        document.querySelector("#borrowerType").value;

    const department =
        document.querySelector("#department").value.trim();

    const equipmentId =
        document.querySelector("#equipmentSelect").value;

    const dateBorrowed =
        document.querySelector("#dateBorrowed").value;

    const dueDate =
        document.querySelector("#dueDate").value;


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!borrowerName) {
        alert("Please enter borrower name.");
        return;
    }

    if (!borrowerType) {
        alert("Please select borrower type.");
        return;
    }

    if (!department) {
        alert("Please enter department.");
        return;
    }

    if (!equipmentId) {
        alert("Please select equipment.");
        return;
    }

    if (!dateBorrowed) {
        alert("Please select borrowing date.");
        return;
    }

    if (!dueDate) {
        alert("Please select due date.");
        return;
    }


    // Due date cannot be earlier than borrowing date
    if (dueDate < dateBorrowed) {
        alert("Due date cannot be earlier than borrowing date.");
        return;
    }


    // ==========================================
    // CHECK IF EQUIPMENT IS STILL AVAILABLE
    // ==========================================

    const { data: equipment, error: equipmentError } =
        await supabaseClient
            .from("equipment")
            .select("*")
            .eq("id", equipmentId)
            .single();


    if (equipmentError) {

        console.error(equipmentError);

        alert(
            "Unable to check equipment: " +
            equipmentError.message
        );

        return;
    }


    if (equipment.availability !== "Available") {

        alert("This equipment is no longer available.");

        loadEquipment();

        return;
    }


    // ==========================================
    // GET CURRENT USER
    // ==========================================

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        alert("You must be logged in.");

        return;
    }


    // ==========================================
    // INSERT BORROWING TRANSACTION
    // ==========================================

    const { error: transactionError } =
        await supabaseClient
            .from("borrow_transactions")
            .insert([
                {
                    equipment_id: equipmentId,
                    borrower_name: borrowerName,
                    borrower_type: borrowerType,
                    department: department,
                    date_borrowed: dateBorrowed,
                    due_date: dueDate,
                    status: "Borrowed",
                    user_id: user.id
                }
            ]);


    if (transactionError) {

        console.error(transactionError);

        alert(
            "Failed to save borrowing transaction: " +
            transactionError.message
        );

        return;
    }


    // ==========================================
    // UPDATE EQUIPMENT AVAILABILITY
    // ==========================================

    const { error: updateError } =
        await supabaseClient
            .from("equipment")
            .update({
                availability: "Borrowed"
            })
            .eq("id", equipmentId);


    if (updateError) {

        console.error(updateError);

        alert(
            "Transaction saved, but equipment status was not updated: " +
            updateError.message
        );

        return;
    }


    // ==========================================
    // SUCCESS
    // ==========================================

    alert("Borrowing transaction saved successfully!");


    // Clear form
    document.querySelector("#borrowerName").value = "";
    document.querySelector("#borrowerType").value = "Student";
    document.querySelector("#department").value = "";
    document.querySelector("#equipmentSelect").value = "";
    document.querySelector("#dateBorrowed").value = "";
    document.querySelector("#dueDate").value = "";


    // Reload data
    loadEquipment();
    loadTransactions();
}


// ==========================================
// LOAD TRANSACTIONS
// ==========================================

async function loadTransactions() {

    const { data, error } =
        await supabaseClient
            .from("borrow_transactions")
            .select(`
                *,
                equipment (
                    equipment_name,
                    asset_code
                )
            `)
            .order("id", { ascending: false });


    if (error) {

        console.error("Error loading transactions:", error);

        return;
    }


    console.log("Transactions loaded:", data);

    displayTransactions(data);

    updateTransactionDashboard(data);
}


// ==========================================
// DISPLAY TRANSACTIONS
// ==========================================

function displayTransactions(transactions) {

    const tableBody =
        document.querySelector("#transactionTableBody");


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    transactions.forEach(function (transaction) {

        let status = transaction.status;


        // ==========================================
        // OVERDUE DETECTION
        // ==========================================

        if (
            status !== "Returned" &&
            new Date() > new Date(transaction.due_date)
        ) {

            status = "Overdue";

        }


        const equipmentName =
            transaction.equipment
                ? transaction.equipment.equipment_name
                : "Unknown";


        const assetCode =
            transaction.equipment
                ? transaction.equipment.asset_code
                : "Unknown";


        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${transaction.borrower_name}</td>

            <td>${transaction.borrower_type}</td>

            <td>${transaction.department}</td>

            <td>${equipmentName}</td>

            <td>${assetCode}</td>

            <td>${transaction.date_borrowed}</td>

            <td>${transaction.due_date}</td>

            <td>${transaction.date_returned || "-"}</td>

            <td>${status}</td>

            <td>
                ${
                    status !== "Returned"
                    ?
                    `<button onclick="returnEquipment(${transaction.id}, ${transaction.equipment_id})">
                        Return
                    </button>`
                    :
                    `<span>Returned</span>`
                }
            </td>
        `;


        tableBody.appendChild(row);

    });
}


// ==========================================
// RETURN EQUIPMENT
// ==========================================

async function returnEquipment(transactionId, equipmentId) {

    const confirmReturn =
        confirm("Are you sure you want to return this equipment?");


    if (!confirmReturn) {
        return;
    }


    // ==========================================
    // CHECK TRANSACTION
    // ==========================================

    const { data: transaction, error: transactionCheckError } =
        await supabaseClient
            .from("borrow_transactions")
            .select("*")
            .eq("id", transactionId)
            .single();


    if (transactionCheckError) {

        alert(
            "Unable to find transaction: " +
            transactionCheckError.message
        );

        return;
    }


    // Prevent returning twice
    if (transaction.status === "Returned") {

        alert("This transaction has already been returned.");

        return;
    }


    // ==========================================
    // CURRENT DATE
    // ==========================================

    const today =
        new Date().toISOString().split("T")[0];


    // ==========================================
    // UPDATE TRANSACTION
    // ==========================================

    const { error: returnError } =
        await supabaseClient
            .from("borrow_transactions")
            .update({
                date_returned: today,
                status: "Returned"
            })
            .eq("id", transactionId);


    if (returnError) {

        alert(
            "Failed to return equipment: " +
            returnError.message
        );

        return;
    }


    // ==========================================
    // UPDATE EQUIPMENT
    // ==========================================

    const { error: equipmentError } =
        await supabaseClient
            .from("equipment")
            .update({
                availability: "Available"
            })
            .eq("id", equipmentId);


    if (equipmentError) {

        alert(
            "Transaction returned, but equipment status failed: " +
            equipmentError.message
        );

        return;
    }


    alert("Equipment returned successfully!");


    loadEquipment();
    loadTransactions();
}


// ==========================================
// TRANSACTION DASHBOARD
// ==========================================

function updateTransactionDashboard(transactions) {

    let borrowed = 0;
    let returned = 0;
    let overdue = 0;


    transactions.forEach(function (transaction) {

        if (transaction.status === "Returned") {

            returned++;

        }
        else {

            const today = new Date();
            const dueDate = new Date(transaction.due_date);

            if (today > dueDate) {
                overdue++;
            }
            else {
                borrowed++;
            }

        }

    });


    const borrowedElement =
        document.querySelector("#borrowedEquipment");

    const returnedElement =
        document.querySelector("#returnedEquipment");

    const overdueElement =
        document.querySelector("#overdueEquipment");


    if (borrowedElement) {
        borrowedElement.textContent = borrowed;
    }

    if (returnedElement) {
        returnedElement.textContent = returned;
    }

    if (overdueElement) {
        overdueElement.textContent = overdue;
    }
}


// ==========================================
// LOAD TRANSACTIONS WHEN PAGE OPENS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    loadTransactions();

});