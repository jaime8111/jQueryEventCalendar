<?php

// THIS IS THE INFO YOU MUST EDIT
$DbAccess["host"] = "localhost";
$DbAccess["user"] = "eventcalendaruse";
$DbAccess["pass"] = "";
$DbAccess["dataBase"] = "eventcalendar";

// STOP EDITING AFTER THIS LINE


error_reporting(E_ALL);
ini_set('display_errors',1);

// create an instance of the Database class and call it $db
include_once('database.php');

$db = new Database($DbAccess);

// traditional way to connect with database
/*$con = mysql_connect($DbAccess["host"], $DbAccess["user"], $DbAccess["pass"]);
if (! $con)
{
echo "<h2 align='center'>ERROR: Imposible establecer conexión con el servidor. config.php</h2>";
exit;
}

mysql_select_db($DbAccess["dataBase"],$con);*/
?>