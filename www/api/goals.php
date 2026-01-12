<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include 'db.php';

// Get the 'action' from the URL (e.g. goals.php?action=fetch)
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Get JSON Input
$data = json_decode(file_get_contents("php://input"));

switch ($action) {
    case 'fetch':
        $result = $conn->query("SELECT * FROM goals ORDER BY id DESC");
        $goals = array();
        while($row = $result->fetch_assoc()) {
            array_push($goals, array(
                "id" => $row['id'],
                "name" => $row['name'],
                "target" => floatval($row['target_amount']),
                "saved" => floatval($row['saved_amount'])
            ));
        }
        echo json_encode($goals);
        break;

    case 'add':
        if(isset($data->name) && isset($data->target)) {
            $stmt = $conn->prepare("INSERT INTO goals (name, target_amount, saved_amount) VALUES (?, ?, ?)");
            $stmt->bind_param("sdd", $data->name, $data->target, $data->saved);
            if($stmt->execute()) echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            else echo json_encode(["status" => "error"]);
            $stmt->close();
        }
        break;

    case 'update':
        if(isset($data->id)) {
            $stmt = $conn->prepare("UPDATE goals SET name=?, target_amount=?, saved_amount=? WHERE id=?");
            $stmt->bind_param("sddi", $data->name, $data->target, $data->saved, $data->id);
            if($stmt->execute()) echo json_encode(["status" => "success"]);
            else echo json_encode(["status" => "error"]);
            $stmt->close();
        }
        break;

    case 'delete':
        if(isset($data->id)) {
            $stmt = $conn->prepare("DELETE FROM goals WHERE id=?");
            $stmt->bind_param("i", $data->id);
            if($stmt->execute()) echo json_encode(["status" => "success"]);
            else echo json_encode(["status" => "error"]);
            $stmt->close();
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>