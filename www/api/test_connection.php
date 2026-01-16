<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

// 1. Check if PHP is running
echo "STEP 1: Server is reachable.\n";

// 2. Try Connecting
$host = "localhost";
$user = "root";
$pass = "";
$db   = "ringgittrack";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("STEP 2: Database Connection FAILED: " . $conn->connect_error);
}
echo "STEP 2: Database Connected Successfully.\n";

// 3. Try Saving Dummy Data
// Note: We use 'transaction_date' because that is what your table calls it.
$sql = "INSERT INTO transactions (item_name, amount, category, transaction_date) VALUES ('TEST_DATA', 1.00, 'Test', NOW())";

if ($conn->query($sql) === TRUE) {
    echo "STEP 3: Insert Data SUCCESS! \n(Go check your 'transactions' table in phpMyAdmin, you should see 'TEST_DATA'.)";
} else {
    echo "STEP 3: Insert Failed: " . $conn->error;
}

$conn->close();
?>