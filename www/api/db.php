<?php
// Database Credentials
$host = "localhost"; 
$user = "root";      // Default XAMPP user
$pass = "";          // Default XAMPP password is empty
$db   = "ringgittrack";

// Create Connection
$conn = new mysqli($host, $user, $pass, $db);

// Check Connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set Charset to handle special characters
$conn->set_charset("utf8");
?>