// ==========================================
// EQUIPMENT MANAGEMENT
// ==========================================

// Load all equipment from Supabase
async function loadEquipment() {

    const { data, error } = await supabaseClient
        .from("equipment")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("Error loading equipment:", error);
        alert("Failed to load equipment: " + error.message);
        return;
    }

    console.log("Equipment loaded:", data);

    displayEquipment(data);
    updateDashboard(data);
    loadEquipmentDropdown(data);
}


// ==========================================
// DISPLAY EQUIPMENT TABLE
// ==========================================

function displayEquipment(equipmentList) {

    const tableBody = document.querySelector("#equipmentTableBody");

    if (!tableBody) {
        console.error("equipmentTableBody not found");
        return;
    }

    tableBody.innerHTML = "";

    equipmentList.forEach(function (equipment) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${equipment.asset_code}</td>
            <td>${equipment.equipment_name}</td>
            <td>${equipment.category}</td>
            <td>${equipment.condition}</td>
            <td>${equipment.availability}</td>
            <td>
                <button onclick="editEquipment(${equipment.id})">
                    Edit
                </button>

                <button onclick="deleteEquipment(${equipment.id})">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// ==========================================
// UPDATE DASHBOARD COUNTERS
// ==========================================

function updateDashboard(equipmentList) {

    const total = equipmentList.length;

    const available = equipmentList.filter(
        equipment => equipment.availability === "Available"
    ).length;

    const borrowed = equipmentList.filter(
        equipment => equipment.availability === "Borrowed"
    ).length;


    const totalElement = document.querySelector("#totalEquipment");

    const availableElement = document.querySelector("#availableEquipment");

    const borrowedElement = document.querySelector("#borrowedEquipment");


    if (totalElement) {
        totalElement.textContent = total;
    }

    if (availableElement) {
        availableElement.textContent = available;
    }

    if (borrowedElement) {
        borrowedElement.textContent = borrowed;
    }
}


// ==========================================
// LOAD EQUIPMENT INTO BORROWING DROPDOWN
// ==========================================

function loadEquipmentDropdown(equipmentList) {

    const dropdown = document.querySelector("#equipmentSelect");

    if (!dropdown) {
        console.error("equipmentSelect not found");
        return;
    }

    dropdown.innerHTML = `
        <option value="">Select Equipment</option>
    `;

    equipmentList
        .filter(equipment => equipment.availability === "Available")
        .forEach(function (equipment) {

            const option = document.createElement("option");

            option.value = equipment.id;

            option.textContent =
                equipment.equipment_name +
                " - " +
                equipment.asset_code;

            dropdown.appendChild(option);
        });
}


// ==========================================
// ADD EQUIPMENT
// ==========================================

async function addEquipment() {

    const equipmentName =
        document.querySelector("#equipmentName").value.trim();

    const category =
        document.querySelector("#equipmentCategory").value.trim();

    const assetCode =
        document.querySelector("#assetCode").value.trim();

    const condition =
        document.querySelector("#equipmentCondition").value;


    // Validation
    if (!equipmentName) {
        alert("Please enter equipment name.");
        return;
    }

    if (!category) {
        alert("Please enter category.");
        return;
    }

    if (!assetCode) {
        alert("Please enter asset code.");
        return;
    }


    const { data, error } = await supabaseClient
        .from("equipment")
        .insert([
            {
                equipment_name: equipmentName,
                category: category,
                asset_code: assetCode,
                condition: condition,
                availability: "Available"
            }
        ])
        .select();


    if (error) {

        console.error("Error adding equipment:", error);

        alert("Failed to add equipment: " + error.message);

        return;
    }


    alert("Equipment added successfully!");


    // Clear form
    document.querySelector("#equipmentName").value = "";
    document.querySelector("#equipmentCategory").value = "";
    document.querySelector("#assetCode").value = "";
    document.querySelector("#equipmentCondition").value = "Good";


    // Reload equipment
    loadEquipment();
}


// ==========================================
// DELETE EQUIPMENT
// ==========================================

async function deleteEquipment(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this equipment?"
    );

    if (!confirmDelete) {
        return;
    }


    const { error } = await supabaseClient
        .from("equipment")
        .delete()
        .eq("id", id);


    if (error) {

        console.error("Error deleting equipment:", error);

        alert("Failed to delete equipment: " + error.message);

        return;
    }


    alert("Equipment deleted successfully!");

    loadEquipment();
}


// ==========================================
// EDIT EQUIPMENT
// ==========================================

async function editEquipment(id) {

    const newName = prompt("Enter new equipment name:");

    if (newName === null || newName.trim() === "") {
        return;
    }


    const { error } = await supabaseClient
        .from("equipment")
        .update({
            equipment_name: newName.trim()
        })
        .eq("id", id);


    if (error) {

        console.error("Error editing equipment:", error);

        alert("Failed to edit equipment: " + error.message);

        return;
    }


    alert("Equipment updated successfully!");

    loadEquipment();
}


// ==========================================
// SEARCH EQUIPMENT
// ==========================================

async function searchEquipment() {

    const searchInput =
        document.querySelector("#equipmentSearch");

    if (!searchInput) {
        loadEquipment();
        return;
    }

    const searchText =
        searchInput.value.trim();


    let query = supabaseClient
        .from("equipment")
        .select("*")
        .order("id", { ascending: true });


    if (searchText) {

        query = query.or(
            `equipment_name.ilike.%${searchText}%,asset_code.ilike.%${searchText}%`
        );

    }


    const { data, error } = await query;


    if (error) {

        console.error("Search error:", error);

        alert("Search failed: " + error.message);

        return;
    }


    displayEquipment(data);
}


// ==========================================
// LOAD WHEN PAGE OPENS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Equipment JavaScript loaded.");

    loadEquipment();

});